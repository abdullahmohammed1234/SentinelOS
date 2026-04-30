import React from 'react';

export default function LoadingScreen({ message = 'Initializing Sentinel OS' }: { message?: string }){
  return (
    <div className="fut-loading">
      <div className="flex flex-col items-center gap-4">
        <div className="fut-loader-ring" />
        <div className="text-center">
          <div className="text-white font-semibold">{message}</div>
          <div className="text-xs text-slate-400 mt-1">Preparing secure runtime...</div>
        </div>
      </div>
    </div>
  );
}
