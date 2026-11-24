import React from 'react';

export const NagarLogo = ({ size = 'md', showTagline = false, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${iconSizes[size]} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base outer shield / pin */}
          <path
            d="M50 14 C32 14 20 28 20 45 C20 66 50 88 50 88 C50 88 80 66 80 45 C80 28 68 14 50 14 Z"
            fill="url(#greenGrad)"
          />
          {/* Building silhouette */}
          <path
            d="M38 58 L38 42 L48 42 L48 35 L62 35 L62 58 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
          {/* Building windows */}
          <rect x="42" y="46" width="3" height="4" fill="#064E3B" rx="0.5"/>
          <rect x="52" y="40" width="3" height="4" fill="#064E3B" rx="0.5"/>
          <rect x="52" y="47" width="3" height="4" fill="#064E3B" rx="0.5"/>
          {/* Central AI Network Node */}
          <circle cx="50" cy="50" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="34" cy="36" r="3" fill="#34D399" />
          <circle cx="66" cy="36" r="3" fill="#34D399" />
          <circle cx="50" cy="24" r="3" fill="#34D399" />
          {/* Neural lines */}
          <path d="M50 24 L50 45 M34 36 L46 48 M66 36 L54 48" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
          
          <defs>
            <linearGradient id="greenGrad" x1="20" y1="14" x2="80" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#064E3B" />
              <stop offset="0.6" stopColor="#047857" />
              <stop offset="1" stopColor="#0D9488" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight ${textSizes[size]} text-slate-900 dark:text-white`}>
            Nagar<span className="text-emerald-600 dark:text-emerald-400">AI</span>
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Civic OS
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Smarter Neighborhoods. Faster Resolutions.
          </span>
        )}
      </div>
    </div>
  );
};
