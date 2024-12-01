export function ChemistryFlaskIcon({ className = "" }: { className?: string }) {
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
        d="M9 3h6m-6 0v4L4 19h16L15 7V3M9 3h6m-6 8h6" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M7 15a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2z" 
      />
    </svg>
  );
} 