export function AnvilIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 5h10M4 8h16M4 11h16M6 14h12M8 17h8M10 20h4M12 5V3" />
      <rect x="3" y="8" width="18" height="12" rx="2" />
    </svg>
  );
} 