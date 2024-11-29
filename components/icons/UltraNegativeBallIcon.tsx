import { SVGProps } from 'react';

export function UltraNegativeBallIcon(props: SVGProps<SVGSVGElement>) {
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
      
      {/* Middle circle */}
      <circle cx="12" cy="12" r="6" />
      
      {/* Inner circle */}
      <circle cx="12" cy="12" r="3" />
      
      {/* Cross lines */}
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
      
      {/* Diagonal lines */}
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
      
      {/* Energy arcs */}
      <path d="M12 2C14 4 14 8 12 10" />
      <path d="M12 14C14 16 14 20 12 22" />
      <path d="M22 12C20 14 16 14 14 12" />
      <path d="M10 12C8 14 4 14 2 12" />
    </svg>
  );
} 