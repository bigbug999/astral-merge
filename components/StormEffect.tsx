import { useEffect, useRef } from 'react';

interface StormEffectProps {
  x: number;
  y: number;
  radius: number;
  duration: number;
  onComplete: () => void;
}

export default function StormEffect({ x, y, radius, duration, onComplete }: StormEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{
      x: number;
      y: number;
      angle: number;
      speed: number;
      size: number;
    }> = [];

    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add new particles
      if (particles.length < 50) {
        particles.push({
          x,
          y,
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 2 + 1,
          size: Math.random() * 3 + 1
        });
      }

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        
        const distance = Math.sqrt(
          Math.pow(particle.x - x, 2) + Math.pow(particle.y - y, 2)
        );
        
        if (distance > radius) {
          particles.splice(index, 1);
          return;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(75, 0, 130, ${1 - distance / radius})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [x, y, radius, duration, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none"
      style={{
        width: radius * 2,
        height: radius * 2,
        left: x - radius,
        top: y - radius
      }}
      width={radius * 2}
      height={radius * 2}
    />
  );
} 