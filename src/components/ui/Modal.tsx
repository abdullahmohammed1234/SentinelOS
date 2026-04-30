import React from 'react';

export default function Modal({ open, onClose, children, title }: { open: boolean, onClose: () => void, children?: React.ReactNode, title?: string }){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 glass-panel p-6 z-50">
        {title && <h3 className="text-lg font-bold neon-text-magenta">{title}</h3>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
