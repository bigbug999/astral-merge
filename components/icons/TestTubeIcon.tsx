import { SVGProps } from 'react';

export function TestTubeIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M9 3h6" />
      <path d="M10 3v4c0 1.5-.43 2.93-1.2 4.14l-4.6 7.38c-1.1 1.76.2 4.48 2.3 4.48h11c2.1 0 3.4-2.72 2.3-4.48l-4.6-7.38C14.43 9.93 14 8.5 14 7V3" />
      <path d="M8 14h8" />
    </svg>
  );
} 