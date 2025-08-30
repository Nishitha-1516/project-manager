import React from 'react';

function Logo({ size = 40 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "#8B5CF6", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "#6366F1", stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <path d="M3 7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V17C21 18.6569 19.6569 20 18 20H6C4.34315 20 3 18.6569 3 17V7Z" fill="url(#grad1)" />
      <path d="M7 10.5L10.5 14L17.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default Logo;