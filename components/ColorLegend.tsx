import { useState } from 'react';
import { MYSTICAL_COLORS, TRANSITION_COLORS, WARM_COLORS, CELESTIAL_COLORS } from '@/types/game';

// Simple chevron icons
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={className}
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function ChevronUp({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={className}
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  );
}

export function ColorLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-sm mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-zinc-900/50 rounded-lg flex items-center justify-between text-sm hover:bg-zinc-900/70 transition-colors"
      >
        <h3 className="font-semibold text-zinc-200">Color Legend</h3>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-zinc-900/50 rounded-lg mt-2 space-y-4">
          <div className="space-y-4">
            {/* Mystical Colors */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-xs font-medium">Mystical Colors (Tiers 1-4)</h4>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(MYSTICAL_COLORS).map(([name, colors]) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 rounded-lg">
                    <div 
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: colors.color,
                        borderColor: colors.strokeColor,
                        boxShadow: `0 0 15px 5px ${colors.glowColor}`,
                        filter: 'blur(0px)',
                      }}
                    />
                    <span className="text-zinc-300 text-xs text-center">
                      {name.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transition Colors */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-xs font-medium">Transition Colors (Tiers 5-7)</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(TRANSITION_COLORS).map(([name, colors]) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 rounded-lg">
                    <div 
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: colors.color,
                        borderColor: colors.strokeColor,
                        boxShadow: `0 0 15px 5px ${colors.glowColor}`,
                        filter: 'blur(0px)',
                      }}
                    />
                    <span className="text-zinc-300 text-xs text-center">
                      {name.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warm Colors */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-xs font-medium">Warm Colors (Tiers 8-12)</h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(WARM_COLORS).map(([name, colors]) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 rounded-lg">
                    <div 
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: colors.color,
                        borderColor: colors.strokeColor,
                        boxShadow: `0 0 15px 5px ${colors.glowColor}`,
                        filter: 'blur(0px)',
                      }}
                    />
                    <span className="text-zinc-300 text-xs text-center">
                      {name.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Celestial Colors */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-xs font-medium">Celestial Colors (Tiers 13-17)</h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(CELESTIAL_COLORS).map(([name, colors]) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 rounded-lg">
                    <div 
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: colors.color,
                        borderColor: colors.strokeColor,
                        boxShadow: `0 0 15px 5px ${colors.glowColor}`,
                        filter: 'blur(0px)',
                      }}
                    />
                    <span className="text-zinc-300 text-xs text-center">
                      {name.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 