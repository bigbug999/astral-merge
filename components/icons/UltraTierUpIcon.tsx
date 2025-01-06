export function UltraTierUpIcon({ className }: { className?: string }) {
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
      <path d="m18 15-6-6-6 6"/>
      <path d="m18 10-6-6-6 6" opacity="0.5"/>
      <path d="m18 5-6-6-6 6" opacity="0.25"/>
    </svg>
  );
} 