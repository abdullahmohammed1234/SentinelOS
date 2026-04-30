import React from 'react';

export default function GlowingChart({ data = [12,24,18,30,22,36] }:{data?: number[]}){
  const max = Math.max(...data);
  const points = data.map((v,i) => `${(i/(data.length-1))*100},${100 - (v/max*100)}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="#2ee6ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c84fff" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="url(#g1)" className="glow-path" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}
