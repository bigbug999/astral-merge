// Ultimate weight icon for Ultra Heavy Ball (Level 3)
export function UltraWeightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="5" r="3"/>
      <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
      {/* Additional details for ultra version */}
      <path d="M12 11v7" strokeWidth="1.5"/>
      <path d="M8 14h8" strokeWidth="1.5"/>
      <circle cx="12" cy="14" r="4" strokeWidth="1" opacity="0.5"/>
      <path d="M7 10.5L17 17.5" strokeWidth="1.5" opacity="0.7"/>
      <path d="M17 10.5L7 17.5" strokeWidth="1.5" opacity="0.7"/>
    </svg>
  );
} 