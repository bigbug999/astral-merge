import { useState, useEffect } from 'react';
import { PowerUp, POWER_UPS, PowerUpState } from '@/types/powerups';
import { cn } from '@/lib/utils';
import { WeightIcon } from './icons/WeightIcon';
import { SuperWeightIcon } from './icons/SuperWeightIcon';
import { UltraWeightIcon } from './icons/UltraWeightIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';
import { FLASK_EFFECTS, FlaskEffectId } from '@/types/flasks';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { FlaskIcon } from './icons/FlaskIcon';
import { FeatherIcon } from './icons/FeatherIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { StormIcon } from './icons/StormIcon';
import { FlaskItem } from '@/types/flasks';

interface PowerUpSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (powerUp: PowerUp | FlaskItem) => void;
  availablePowerUps: PowerUp[];
  powerUps: PowerUpState;
}

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  WeightIcon,
  SuperWeightIcon,
  UltraWeightIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
  TestTubeIcon,
  FlaskIcon,
  FeatherIcon,
  SparklesIcon,
  StormIcon,
};

export function PowerUpSelectionModal({ isOpen, onClose, onSelect, availablePowerUps, powerUps }: PowerUpSelectionModalProps) {
  const [selectedItem, setSelectedItem] = useState<PowerUp | FlaskItem | null>(null);
  const [options, setOptions] = useState<(PowerUp | FlaskItem)[]>([]);

  // Generate options when modal opens
  useEffect(() => {
    if (isOpen) {
      // Get currently used flask effects from power-up slots
      const usedFlaskEffects = new Set(
        powerUps.slots
          .filter(slotId => slotId?.startsWith('FLASK_'))
          .map(slotId => slotId?.replace('FLASK_', ''))
      );

      // Get all available items (both power-ups and unused flasks)
      const availableFlaskEffects = Object.entries(FLASK_EFFECTS)
        .filter(([id]) => id !== 'DEFAULT' && !usedFlaskEffects.has(id))
        .map(([id, effect]) => ({
          id: id as FlaskEffectId,
          type: 'flask' as const,
          name: effect.name,
          description: effect.description,
          icon: effect.icon,
          maxUses: 1,
          activeUntil: null
        }));

      // Combine all available options
      const allAvailableOptions = [...availablePowerUps, ...availableFlaskEffects];

      // If we have less than 3 total options, show all of them
      if (allAvailableOptions.length <= 3) {
        setOptions(allAvailableOptions);
      } else {
        // Otherwise, randomly select exactly 3 options
        const shuffled = [...allAvailableOptions].sort(() => Math.random() - 0.5);
        setOptions(shuffled.slice(0, 3));
      }

      setSelectedItem(null);
    }
  }, [isOpen, availablePowerUps, powerUps.slots]);

  // Add type guard function
  const isFlaskItem = (item: PowerUp | FlaskItem): item is FlaskItem => {
    return 'type' in item && item.type === 'flask';
  };

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-800/90 p-6 rounded-lg shadow-xl border border-zinc-700 max-w-sm w-full mx-4">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6 text-center">Level Up! Choose a Power-Up or Flask</h2>
        
        <div className="grid grid-rows-3 gap-3 mb-6">
          {options.map((option) => {
            const IconComponent = ICON_COMPONENTS[option.icon];
            const isFlask = isFlaskItem(option);
            const powerUpLevel = !isFlask ? (option as PowerUp).level : null;

            return (
              <button
                key={isFlaskItem(option) ? `flask-${option.id}` : `powerup-${option.id}`}
                onClick={() => setSelectedItem(option)}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  selectedItem?.id === option.id
                    ? "bg-zinc-800 border-violet-500"
                    : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                )}
              >
                <div className="flex items-center gap-4">
                  {IconComponent && (
                    <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="text-left mb-2">
                      <div className="font-medium text-zinc-200 text-sm">{option.name}</div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {isFlask 
                          ? option.description.replace('Takes 2 slots. ', '').replace(', recharges on tier 7+ merges', '')
                          : option.description.replace('. Recharges every 3 merges', '')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="text-[10px] text-zinc-500 mr-1">Slots:</div>
                        <div className="flex gap-0.5">
                          {isFlask ? (
                            <>
                              <div className="h-2.5 w-2.5 rounded-[2px] bg-zinc-700/80 border border-dashed border-zinc-600/80 [border-dash-pattern:2_2]" />
                              <div className="h-2.5 w-2.5 rounded-[2px] bg-zinc-700/80 border border-dashed border-zinc-600/80 [border-dash-pattern:2_2]" />
                            </>
                          ) : (
                            <div className="h-2.5 w-2.5 rounded-[2px] bg-zinc-700/80 border border-dashed border-zinc-600/80 [border-dash-pattern:2_2]" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="text-[10px] text-zinc-500 mr-1">Recharges:</div>
                        {isFlask ? (
                          <div className="w-2 h-2 rounded-full bg-orange-500" title="Tier 7+ merges" />
                        ) : (
                          <div 
                            className={cn(
                              "w-2 h-2 rounded-full",
                              powerUpLevel === 1 ? "bg-green-500" :
                              powerUpLevel === 2 ? "bg-purple-500" :
                              "bg-yellow-500"
                            )}
                            title={`Tier ${powerUpLevel} merges`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="w-1/3 px-4 py-3 rounded-lg font-semibold transition-colors bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
          >
            Skip
          </button>
          
          <button
            onClick={handleSelect}
            disabled={!selectedItem}
            className={cn(
              "w-2/3 px-4 py-3 rounded-lg font-semibold transition-colors",
              selectedItem
                ? "bg-violet-500 hover:bg-violet-600 text-white"
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