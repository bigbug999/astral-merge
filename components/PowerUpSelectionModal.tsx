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
import { CIRCLE_CONFIG, TierType } from '@/types/game';

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

// Add type-safe array of tiers
const VALID_TIERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
type ValidTier = (typeof VALID_TIERS)[number];

export function PowerUpSelectionModal({ isOpen, onClose, onSelect, availablePowerUps, powerUps }: PowerUpSelectionModalProps) {
  const [selectedItem, setSelectedItem] = useState<PowerUp | FlaskItem | null>(null);
  const [options, setOptions] = useState<(PowerUp | FlaskItem)[]>([]);
  const [rerollsLeft, setRerollsLeft] = useState(3);

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

  // Add reroll handler
  const handleReroll = () => {
    if (rerollsLeft > 0) {
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

      // Randomly select exactly 3 options
      const shuffled = [...allAvailableOptions].sort(() => Math.random() - 0.5);
      setOptions(shuffled.slice(0, 3));
      setSelectedItem(null);
      setRerollsLeft(prev => prev - 1);
    }
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
      <div className="bg-zinc-800/90 p-6 rounded-lg shadow-xl border border-zinc-700 w-[min(400px,calc(100vw-32px))]">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6">Level Up! Choose a Power-Up or Flask</h2>
        
        <div className="grid grid-rows-3 gap-3 mb-6">
          {options.map((option) => {
            const IconComponent = ICON_COMPONENTS[option.icon];
            const isFlask = isFlaskItem(option);
            const powerUpLevel = !isFlask && 'level' in option ? option.level : null;

            return (
              <button
                key={isFlaskItem(option) ? `flask-${option.id}` : `powerup-${option.id}`}
                onClick={() => setSelectedItem(option)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  selectedItem?.id === option.id
                    ? "bg-zinc-800 border-white"
                    : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                )}
              >
                <div className="flex items-center gap-2">
                  {IconComponent && (
                    <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-left mb-2">
                      <div className="font-medium text-zinc-200 text-sm">{option.name}</div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {isFlask 
                          ? option.description.replace('Takes 2 slots. ', '').replace(', recharges on tier 7+ merges', '')
                          : option.description.replace(
                              powerUpLevel === 1 ? ', recharges on tier 5 merges' :
                              powerUpLevel === 2 ? ', recharges on tier 6 merges' :
                              ', recharges on tier 7 merges',
                              ''
                            )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="text-[10px] text-zinc-500 mr-1">Slots:</div>
                        <div className="w-14 flex">
                          <div className="flex gap-1 mx-auto">
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
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="text-[10px] text-zinc-500 mr-1">Recharges:</div>
                        <div className="flex gap-1">
                          {VALID_TIERS.map((tier) => {
                            const isRechargeLevel = isFlask 
                              ? tier === 7 
                              : powerUpLevel !== null && tier === (
                                  powerUpLevel === 1 ? 5 : 
                                  powerUpLevel === 2 ? 6 : 
                                  7
                                );

                            return (
                              <div 
                                key={tier}
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: CIRCLE_CONFIG[tier].color,
                                  border: `1px solid ${CIRCLE_CONFIG[tier].strokeColor}`,
                                  boxShadow: isRechargeLevel ? `0 0 4px ${CIRCLE_CONFIG[tier].glowColor}` : 'none',
                                  opacity: isRechargeLevel ? 1 : 0.3,
                                  ...(isRechargeLevel && {
                                    outline: '1px solid rgba(255, 255, 255, 0.5)',
                                    outlineOffset: '1px'
                                  })
                                }}
                                title={`Tier ${tier}${isRechargeLevel ? ' (Recharge Level)' : ''}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="w-1/2 px-4 py-3 rounded-lg font-semibold transition-colors bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
            >
              Skip
            </button>
            
            <button
              onClick={handleReroll}
              disabled={rerollsLeft <= 0}
              className={cn(
                "w-1/2 px-4 py-3 rounded-lg font-semibold transition-colors",
                rerollsLeft > 0
                  ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              Reroll ({rerollsLeft})
            </button>
          </div>

          <button
            onClick={handleSelect}
            disabled={!selectedItem}
            className={cn(
              "w-full px-4 py-3 rounded-lg font-semibold transition-colors border-2",
              selectedItem
                ? "bg-black hover:bg-zinc-900 text-white border-white/20"
                : "bg-zinc-800 text-zinc-600 border-transparent cursor-not-allowed"
            )}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
} 