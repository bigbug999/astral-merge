import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Flask, FlaskId } from '@/types/flasks';
import { FLASKS } from '@/types/flasks';
import { FlaskConicalIcon } from './icons/FlaskConicalIcon';
import { FlaskIcon } from './icons/FlaskIcon';
import { FeatherIcon } from './icons/FeatherIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShrinkIcon } from './icons/ShrinkIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  FlaskConicalIcon,
  FlaskIcon,
  FeatherIcon,
  SparklesIcon,
  ShrinkIcon,
};

interface FlaskDropdownProps {
  value: FlaskId | null;
  onChange: (value: FlaskId | null) => void;
}

export function FlaskDropdown({ value, onChange }: FlaskDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFlask = value ? FLASKS[value] : FLASKS.DEFAULT;
  const IconComponent = ICON_COMPONENTS[currentFlask.icon];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className="relative h-9">
      {/* Selected Option Button */}
      <button
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className={cn(
          "h-full px-2.5 rounded-lg border-2 flex items-center gap-2",
          "bg-zinc-800/30 backdrop-blur-md",
          "hover:bg-zinc-800/50 transition-all duration-200",
          isOpen 
            ? "border-zinc-600 shadow-lg" 
            : "border-zinc-700/50"
        )}
      >
        <IconComponent className="w-5 h-5 text-zinc-400" />
        <svg 
          className={cn(
            "w-4 h-4 text-zinc-400 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 w-[160px] mt-1 rounded-lg border-2 border-zinc-700/50 bg-zinc-800/95 backdrop-blur-md shadow-xl z-50"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {Object.values(FLASKS).map((flask) => {
            const OptionIcon = ICON_COMPONENTS[flask.icon];
            return (
              <button
                key={flask.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(flask.id === 'DEFAULT' ? null : flask.id);
                  setIsOpen(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className={cn(
                  "w-full px-3 py-1.5 flex items-center gap-2 text-left",
                  "hover:bg-zinc-700/50 transition-colors",
                  "group",
                  flask.id === 'DEFAULT' && "rounded-t-[6px]",
                  flask.id === 'SHRINK' && "rounded-b-[6px]",
                  flask.id === (value || 'DEFAULT') && "bg-zinc-700"
                )}
              >
                <OptionIcon className={cn(
                  "w-5 h-5",
                  flask.id === (value || 'DEFAULT') ? "text-zinc-100" : "text-zinc-400",
                  "group-hover:text-zinc-100"
                )} />
                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs",
                    flask.id === (value || 'DEFAULT') ? "text-zinc-100" : "text-zinc-400",
                    "group-hover:text-zinc-100"
                  )}>
                    {flask.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                    {flask.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 