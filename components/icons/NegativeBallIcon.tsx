export function NegativeBallIcon({ className = "" }: { className?: string }) {
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
      {/* Circle with minus sign */}
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
      
      {/* Small explosion marks */}
      <line x1="3" y1="3" x2="5" y2="5" />
      <line x1="19" y1="19" x2="21" y2="21" />
      <line x1="19" y1="5" x2="21" y2="3" />
      <line x1="3" y1="21" x2="5" y2="19" />
    </svg>
  );
} 