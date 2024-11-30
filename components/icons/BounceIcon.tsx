export function BounceIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M12 21V19" />
      <path d="M12 3v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M18.364 18.364l-1.414-1.414" />
      <path d="M5.636 5.636l1.414 1.414" />
      <path d="M18.364 5.636l-1.414 1.414" />
      <path d="M5.636 18.364l1.414-1.414" />
    </svg>
  );
} 