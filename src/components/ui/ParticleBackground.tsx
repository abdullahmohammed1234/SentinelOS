import React, { useRef, useEffect } from 'react';

const colors = ['#2ee6ff', '#64d2ff', '#c84fff', '#3ee6a6'];

export default function ParticleBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles: any[] = [];

    function rand(min:number, max:number){return Math.random() * (max - min) + min}

    for (let i = 0; i < 28; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.5, 2.1),
        vx: rand(-0.12, 0.32),
        vy: rand(-0.08, 0.08),
        c: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let raf = 0;
    function loop(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){
        p.x += p.vx; p.y += p.vy;
        if(p.x > w+20) p.x = -20;
        if(p.x < -20) p.x = w+20;
        if(p.y > h+20) p.y = -20;
        if(p.y < -20) p.y = h+20;

        ctx.beginPath();
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.11;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.c;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    }

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    loop();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="particle-canvas" />;
}
