export function BounceIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M7 14l-5 5m0 0l5 5m-5-5h12a4 4 0 004-4V3m0 0l-5 5m5-5l-5-5" 
      />
    </svg>
  );
} 