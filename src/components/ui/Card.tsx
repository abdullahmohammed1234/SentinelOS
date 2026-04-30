import React from 'react';

export default function Card({ children, className = '', title }: { children?: React.ReactNode, className?: string, title?: string }){
  return (
    <div className={"glass-panel p-4 " + className}>
      {title && <div className="text-sm font-semibold mb-3 neon-text-cyan">{title}</div>}
      <div>{children}</div>
    </div>
  );
}
