import { useEffect, useState } from 'react';
import Matter from 'matter-js';
import { PowerUp, PowerUpState, POWER_UPS } from '@/types/powerups';
import { PowerUpStats, CircleBody } from '@/types/physics';

interface PowerUpDebugUIProps {
  currentBall: CircleBody | null;
  powerUps: PowerUpState;
  debug?: {
    fps: number;
    slop: number;
  };
}

const DEFAULT_STATS = {
  density: 0.015,
  friction: 0.01,
  frictionAir: 0.0001,
  restitution: 0.5,
  frictionStatic: 0.05,
  forceMultiplier: 1,
  constantForce: 0,
  slop: 0.05
};

export function PowerUpDebugUI({ currentBall, powerUps, debug }: PowerUpDebugUIProps) {
  const [stats, setStats] = useState(DEFAULT_STATS);

  const handleSlopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlop = parseFloat(e.target.value);
    
    setStats(prev => ({ ...prev, slop: newSlop }));
    
    window.matterEngine?.setSlop?.(newSlop);
  };

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (currentBall) {
        const activePowerUpId = powerUps.activePowerUpId;
        const activePowerUp = activePowerUpId ? POWER_UPS[activePowerUpId] : null;

        setStats(prev => ({
          ...prev,
          density: activePowerUp?.physics.density || DEFAULT_STATS.density,
          friction: activePowerUp?.physics.friction || DEFAULT_STATS.friction,
          frictionAir: activePowerUp?.physics.frictionAir || DEFAULT_STATS.frictionAir,
          restitution: activePowerUp?.physics.restitution || DEFAULT_STATS.restitution,
          frictionStatic: activePowerUp?.physics.frictionStatic || DEFAULT_STATS.frictionStatic,
          forceMultiplier: activePowerUp?.effects?.forceMultiplier || DEFAULT_STATS.forceMultiplier,
          constantForce: activePowerUp?.effects?.constantForce || DEFAULT_STATS.constantForce,
          slop: prev.slop
        }));
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [currentBall, powerUps]);

  useEffect(() => {
    if (debug?.slop !== undefined) {
      setStats(prev => ({ ...prev, slop: debug.slop }));
    }
  }, [debug?.slop]);

  return (
    <div className="flex items-start gap-2">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-2 text-xs w-[384px]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-zinc-400 font-medium">Debug</h3>
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
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-zinc-500">Slop:</span>
            <span className="text-zinc-300 font-mono">{stats.slop.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={stats.slop}
            onChange={handleSlopChange}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
              [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 
              [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:border-none
              [&::-moz-range-thumb]:cursor-pointer
              hover:[&::-webkit-slider-thumb]:bg-violet-400
              hover:[&::-moz-range-thumb]:bg-violet-400"
          />
        </div>
      </div>
    </div>
  );
} 