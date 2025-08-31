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
        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "#8B5CF6", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "#4F46E5", stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#circleGradient)" />
      <path d="M9 10C9 8.89543 9.89543 8 11 8H13C14.1046 8 15 8.89543 15 10V16H9V10Z" fill="white" fillOpacity="0.2"/>
      <path d="M9.5 12.5L11.5 14.5L15.5 10.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default Logo;