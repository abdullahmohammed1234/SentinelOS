import React from 'react';

export default function Skeleton({width='100%', height=12, className=''}:{width?: string|number, height?: number, className?: string}){
  return (
    <div className={"skeleton " + className} style={{width, height, borderRadius:6}} />
  );
}
