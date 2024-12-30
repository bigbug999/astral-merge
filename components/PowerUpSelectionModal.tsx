import { useState } from 'react';
import { PowerUp, POWER_UPS } from '@/types/powerups';
import { cn } from '@/lib/utils';
import { WeightIcon } from './icons/WeightIcon';
import { SuperWeightIcon } from './icons/SuperWeightIcon';
import { UltraWeightIcon } from './icons/UltraWeightIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';

interface PowerUpSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (powerUp: PowerUp) => void;
  availablePowerUps: PowerUp[];
}

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  WeightIcon,
  SuperWeightIcon,
  UltraWeightIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
};

export function PowerUpSelectionModal({ isOpen, onClose, onSelect, availablePowerUps }: PowerUpSelectionModalProps) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUp | null>(null);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedPowerUp) {
      onSelect(selectedPowerUp);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-800/90 p-6 rounded-lg shadow-xl border border-zinc-700 max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6 text-center">Level Up! Choose a Power-Up</h2>
        
        <div className="flex justify-center gap-4 mb-6">
          {availablePowerUps.map((powerUp) => {
            const IconComponent = ICON_COMPONENTS[powerUp.icon];
            return (
              <button
                key={powerUp.id}
                onClick={() => setSelectedPowerUp(powerUp)}
                className={cn(
                  "w-[160px] p-4 rounded-lg border transition-all",
                  selectedPowerUp?.id === powerUp.id
                    ? "bg-zinc-800 border-violet-500"
                    : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  {IconComponent && (
                    <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-medium text-zinc-200">{powerUp.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">{powerUp.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedPowerUp}
            className={cn(
              "px-6 py-2 rounded-lg transition-colors",
              selectedPowerUp
                ? "bg-violet-600 text-white hover:bg-violet-500"
                : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
            )}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
} 