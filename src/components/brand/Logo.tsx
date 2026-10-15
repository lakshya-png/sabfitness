import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  showTagline?: boolean;
}

export function Logo({
  className = "",
  size = "md",
  showWordmark = true,
  showTagline = false,
}: LogoProps) {
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  }[size];

  const textSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Aerodynamic Forward-Slanted SabFitness Monogram (Reference Style) */}
      <div
        className={`${iconDimensions} rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-1 shadow-lg shadow-indigo-500/25 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-0.5"
        >
          <defs>
            <linearGradient id="sabGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          {/* 3 forward slanted athletic energy bars */}
          <rect x="6" y="8" width="4.5" height="16" rx="2.25" transform="skewX(-16)" fill="#ffffff" />
          <rect x="13.5" y="5" width="4.5" height="22" rx="2.25" transform="skewX(-16)" fill="#ffffff" />
          <rect x="21" y="9" width="4.5" height="14" rx="2.25" transform="skewX(-16)" fill="#ffffff" fillOpacity="0.85" />
        </svg>
      </div>

      {/* Wordmark and Tagline */}
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`${textSize} font-extrabold tracking-tight text-white leading-none`}
          >
            SabFitness
          </span>
          {showTagline && (
            <span className="text-[10px] text-slate-300 font-medium tracking-tight mt-1">
              Your fitness journey. Your goals.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
