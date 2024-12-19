import { FlaskState } from '@/types/flasks';

interface FlaskEffectsProps {
  flaskState: FlaskState;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function FlaskEffects({ flaskState, containerRef }: FlaskEffectsProps) {
  // We're not using visual effects anymore, just return null
  return null;
} 