import { createClient } from "@supabase/supabase-js";
import { OWNER_ADMIN_EMAIL } from "@/lib/storage/localState";
import { mapFitnessGoalToPrimaryGoal } from "@/lib/supabase/profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let sessionData: any = null;
  let user: any = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data?.session) {
          sessionData = data.session;
          user = data.user;
        }
      } else if (token_hash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });
        if (!error && data?.session) {
          sessionData = data.session;
          user = data.user;
        }
      }

      if (user) {
        const meta = user.user_metadata || {};
        const fullName =
          meta.full_name ||
          meta.name ||
          (user.email ? user.email.split("@")[0] : "Athlete");
        const fitnessGoal = meta.fitness_goal || "Stay fit";
        const targetWeightKg =
          meta.target_weight_kg != null ? Number(meta.target_weight_kg) : null;
        const isOwner =
          Boolean(user.email) &&
          user.email!.toLowerCase().trim() === OWNER_ADMIN_EMAIL.toLowerCase();

        const primaryGoal = mapFitnessGoalToPrimaryGoal(fitnessGoal);

        // Requirement 5: Save name, goal and target weight into existing profiles table
        const profilePayload: Record<string, any> = {
          id: user.id,
          email: user.email,
          name: fullName,
          full_name: fullName,
          fitness_goal: fitnessGoal,
          target_weight_kg: targetWeightKg,
          primary_goal: primaryGoal,
          is_admin: isOwner,
          updated_at: new Date().toISOString(),
        };

        if (targetWeightKg) {
          profilePayload.weight_kg = targetWeightKg;
        }

        await supabase.from("profiles").upsert(profilePayload, {
          onConflict: "id",
        });
      }
    } catch (err) {
      console.error("Error during auth callback processing:", err);
    }
  }

  const destination = next.startsWith("/") ? next : "/";

  // Return HTML script to sync localStorage for @supabase/supabase-js in browser, then redirect
  const responseHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Verified — SabFitness</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #080c1d;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #818cf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 18px; margin: 0 0 8px; font-weight: 700; }
    p { font-size: 13px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Account Confirmed!</h2>
    <p>Signing you in and loading your dashboard...</p>
  </div>
  <script>
    (function() {
      try {
        const session = ${JSON.stringify(sessionData)};
        if (session) {
          // Set cookie for middleware
          document.cookie = "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";
          
          // Determine storage key for @supabase/supabase-js
          const hostname = "${supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "supabase"}";
          const storageKey = "sb-" + hostname + "-auth-token";
          localStorage.setItem(storageKey, JSON.stringify(session));

          // Save to localStore
          if (session.user) {
            const user = session.user;
            const meta = user.user_metadata || {};
            const existing = JSON.parse(localStorage.getItem("sabfitness_user") || "{}");
            const updated = Object.assign({}, existing, {
              id: user.id,
              email: user.email || "",
              name: meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Athlete"),
              fullName: meta.full_name || meta.name || "",
              fitnessGoal: meta.fitness_goal || "",
              targetWeightKg: meta.target_weight_kg || undefined,
              isAdmin: (user.email || "").toLowerCase().trim() === "${OWNER_ADMIN_EMAIL}".toLowerCase()
            });
            localStorage.setItem("sabfitness_user", JSON.stringify(updated));
          }
        } else if (window.location.hash) {
          // Fallback if token came in URL hash
          const params = new URLSearchParams(window.location.hash.substring(1));
          if (params.get("access_token")) {
            document.cookie = "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";
            window.location.replace("/" + window.location.hash);
            return;
          }
        }
      } catch (e) {
        console.error("Storage sync error:", e);
      }
      setTimeout(function() {
        window.location.replace("${destination}");
      }, 500);
    })();
  </script>
</body>
</html>`;

  return new Response(responseHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": sessionData
        ? "sabfitness_session=1; Path=/; Max-Age=604800; SameSite=Lax"
        : "",
    },
  });
}
