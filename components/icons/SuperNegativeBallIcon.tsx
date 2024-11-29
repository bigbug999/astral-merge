import { SVGProps } from 'react';

export function SuperNegativeBallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      
      {/* Inner details */}
      <circle cx="12" cy="12" r="6" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6" y1="12" x2="18" y2="12" />
      
      {/* Additional energy lines */}
      <path d="M16 8L8 16" />
      <path d="M8 8L16 16" />
    </svg>
  );
} 