export function SparklesIcon({ className = "" }: { className?: string }) {
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
        d="M12 3l2.5 5 5.5 1.5-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-1.5z" 
      />
    </svg>
  );
} 