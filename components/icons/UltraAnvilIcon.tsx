export function UltraAnvilIcon({ className = '' }: { className?: string }) {
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
      {/* Base anvil shape */}
      <path d="M3 14h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" />
      <path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
      
      {/* Ultra effect elements */}
      <path d="M8 10h8" strokeWidth="3" />
      <path d="M8 6h8" strokeWidth="3" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
      <path d="M9 4l-2-2" />
      <path d="M15 4l2-2" />
      <path d="M3 14l-2-2" />
      <path d="M21 14l2-2" />
    </svg>
  );
} 