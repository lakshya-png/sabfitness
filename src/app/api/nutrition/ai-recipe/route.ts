import { NextResponse } from "next/server";
import type { AIRecipeRequest, AIRecipeResponse, AIRecipeDraft } from "@/types/nutrition";
import {
  heuristicRecipePlanner,
  groundRecipeDraft,
} from "@/lib/nutrition/aiRecipeEngine";

export async function POST(request: Request) {
  try {
    const body: AIRecipeRequest = await request.json();

    if (!body || !body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "A recipe prompt is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API key is configured, attempt online LLM generation with schema enforcement
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const systemPrompt = `You are SabFitness AI Recipe Chef, a master culinary AI specialized in Indian regional cooking, healthy home cooking, fitness nutrition, and macro awareness.
You will receive a user food request, dietary preference, and optional current draft with answers to clarifying questions.
Respond ONLY with a valid JSON object matching this schema:
{
  "recipeName": "string",
  "description": "string",
  "servings": number,
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "cookedWeightGrams": number,
  "ingredients": [
    {
      "name": "string (ingredient name, e.g. rolled oats, fresh paneer, red onion, desi ghee, whole milk)",
      "quantity": number,
      "unit": "string (g, ml, tsp, tbsp, cup, piece, medium, scoop)",
      "isProposedDefault": boolean (true if you chose a sensible default because user didn't specify quantity/unit)
    }
  ],
  "instructions": ["string (step by step)"],
  "clarifyingQuestions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string"],
      "affectedField": "ingredient_choice | quantity | unit | servings | oil | general",
      "rationale": "string"
    }
  ],
  "dietaryTags": ["string"],
  "suggestedTweaks": ["string (e.g. Make it higher in protein, Reduce oil, Make two servings)"]
}
CRITICAL RULES:
- Do NOT fabricate or estimate calories or macros. The backend engine will calculate exact grounded macros from verified database tables.
- Focus on practical, authentic culinary methods.
- If user asked for an iterative refinement (e.g. "remove honey", "make higher in protein", "make 2 servings"), adjust the ingredients and servings accordingly.
- Propose 1-3 concise clarifying questions if crucial parameters (servings, oil amount, milk type) were omitted or ambiguous.`;

        const userContent = JSON.stringify({
          prompt: body.prompt,
          currentDraft: body.currentDraft,
          userDietaryPreference: body.userDietaryPreference || "vegetarian",
          answeredQuestions: body.answeredQuestions,
        });

        // Use gemini-2.5-flash with JSON mode
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\n\nUSER REQUEST DATA:\n${userContent}` },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsedDraft: Partial<AIRecipeDraft> = JSON.parse(rawText);
            // Ground all ingredients deterministically
            const grounded = groundRecipeDraft({
              ...parsedDraft,
              aiProvider: "gemini-2.5-flash",
            });

            const response: AIRecipeResponse = {
              draft: grounded,
              message: `Created **${grounded.recipeName}** powered by Google Gemini AI with 100% grounded nutritional calculation.`,
              clarifyingQuestions: grounded.clarifyingQuestions || [],
              isOnlineAI: true,
              provider: "Google Gemini 2.5 Flash",
            };

            return NextResponse.json(response);
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed or timed out, seamlessly falling back to offline heuristic planner:", geminiErr);
        // Fall back gracefully below
      }
    }

    // 2. Offline / Built-in Heuristic Recipe Engine (Zero Dependency Fallback)
    const fallbackResponse = heuristicRecipePlanner(body);
    return NextResponse.json(fallbackResponse);
  } catch (err: unknown) {
    console.error("AI Recipe route error:", err);
    return NextResponse.json(
      { error: "Failed to generate recipe. Please try again." },
      { status: 500 }
    );
  }
}
