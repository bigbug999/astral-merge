import { SVGProps } from 'react';

export function SuperTierUpIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path d="m15 11.25-3-3m0 0-3 3m3-3v7.5" />
      <path d="m15 8.25-3-3m0 0-3 3" />
    </svg>
  );
} 