import React from 'react';

export default function Button({ children, onClick, className = '', type = 'button' }: { children?: React.ReactNode, onClick?: () => void, className?: string, type?: 'button'|'submit'|'reset'}){
  return (
    <button type={type} onClick={onClick} className={"fut-btn primary micro-hover " + className}>
      <div className="bg-anim" aria-hidden />
      <span style={{position:'relative',zIndex:2}}>{children}</span>
    </button>
  );
}
