import { useEffect, useState } from 'react';
import Matter from 'matter-js';
import { PowerUp, PowerUpState, POWER_UPS } from '@/types/powerups';

interface PowerUpStats {
  density: number;
  velocity: number;
  force: number;
  timeRemaining: number;
}

interface CircleBody extends Matter.Body {
  powerUpStats?: PowerUpStats;
}

interface PowerUpDebugUIProps {
  currentBall: CircleBody | null;
  powerUps: PowerUpState;
  debug?: {
    fps: number;
  };
}

const DEFAULT_STATS = {
  density: 0.015,
  friction: 0.01,
  frictionAir: 0.0001,
  restitution: 0.5,
  frictionStatic: 0.05,
  forceMultiplier: 1,
  constantForce: 0
};

export function PowerUpDebugUI({ currentBall, powerUps, debug }: PowerUpDebugUIProps) {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (currentBall) {
        const activePowerUpId = powerUps.activePowerUpId;
        const activePowerUp = activePowerUpId ? POWER_UPS[activePowerUpId] : null;

        setStats({
          density: activePowerUp?.physics.density || DEFAULT_STATS.density,
          friction: activePowerUp?.physics.friction || DEFAULT_STATS.friction,
          frictionAir: activePowerUp?.physics.frictionAir || DEFAULT_STATS.frictionAir,
          restitution: activePowerUp?.physics.restitution || DEFAULT_STATS.restitution,
          frictionStatic: activePowerUp?.physics.frictionStatic || DEFAULT_STATS.frictionStatic,
          forceMultiplier: activePowerUp?.effects?.forceMultiplier || DEFAULT_STATS.forceMultiplier,
          constantForce: activePowerUp?.effects?.constantForce || DEFAULT_STATS.constantForce
        });
      } else {
        setStats(DEFAULT_STATS);
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [currentBall, powerUps]);

  return (
    <div className="flex items-start gap-2">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-2 text-xs w-[384px]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-zinc-400 font-medium">Ball Modifiers</h3>
          <span className={`text-zinc-300 font-mono ${(debug?.fps || 0) < 45 ? 'text-red-400' : ''}`}>
            {debug?.fps || '--'} FPS
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Density:</span>
              <span className="text-zinc-300 font-mono">×{(stats.density / DEFAULT_STATS.density).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Friction:</span>
              <span className="text-zinc-300 font-mono">×{(stats.friction / DEFAULT_STATS.friction).toFixed(1)}</span>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Air Fric:</span>
              <span className="text-zinc-300 font-mono">×{(stats.frictionAir / DEFAULT_STATS.frictionAir).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Bounce:</span>
              <span className="text-zinc-300 font-mono">×{(stats.restitution / DEFAULT_STATS.restitution).toFixed(1)}</span>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Force:</span>
              <span className="text-zinc-300 font-mono">×{stats.forceMultiplier.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pull:</span>
              <span className="text-zinc-300 font-mono">+{stats.constantForce.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 