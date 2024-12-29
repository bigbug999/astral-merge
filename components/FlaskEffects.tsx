import { FlaskState } from '@/types/flasks';
import { FLASK_SIZES } from '@/types/flasks';
import { useEffect, useRef } from 'react';

interface FlaskEffectsProps {
  flaskState: FlaskState;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function FlaskEffects({ flaskState, containerRef }: FlaskEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Match canvas size to container
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, width, height);

    // Get current scale from flask state
    const scale = FLASK_SIZES[flaskState.size].physics.scale || 1;

    // Grid configuration
    const baseGridSize = 40; // Base size of grid cells
    const scaledGridSize = baseGridSize * scale;
    
    // Calculate grid dimensions to ensure lines touch edges
    const cols = Math.floor(width / scaledGridSize);
    const rows = Math.floor(height / scaledGridSize);

    // Calculate the actual grid width and height
    const gridWidth = width;
    const gridHeight = height;

    // Calculate cell size to fit perfectly
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; // Very subtle lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Slightly more visible dots
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = i * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridHeight);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let i = 0; i <= rows; i++) {
      const y = i * cellHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
      ctx.stroke();
    }

    // Draw intersection dots
    const dotSize = 2 * scale;
    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * cellWidth;
        const y = j * cellHeight;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [flaskState.size, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        opacity: 0.8,
        mixBlendMode: 'plus-lighter',
      }}
    />
  );
} 