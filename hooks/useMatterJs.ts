import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG } from '@/types/game';

export const useMatterJs = (
  containerRef: React.RefObject<HTMLDivElement>, 
  onDrop: () => void,
  onNewTier: (tier: number) => void
) => {
  const engineRef = useRef(Matter.Engine.create({ gravity: { y: 1 } }));
  const renderRef = useRef<Matter.Render | null>(null);
  const currentCircleRef = useRef<Matter.Body | null>(null);
  const isDraggingRef = useRef(false);

  // Extend the Matter.Body type to include our custom properties
  type CircleBody = Matter.Body & {
    isMerging?: boolean;
    tier?: number;
  };

  const createCircle = useCallback((tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, x: number, y: number) => {
    if (!renderRef.current) return null;

    const config = CIRCLE_CONFIG[tier];
    const circle = Matter.Bodies.circle(x, y, config.radius, {
      restitution: 0.6,
      friction: 0.001,
      density: 0.008,
      frictionAir: 0.0001,
      render: {
        fillStyle: config.color,
        strokeStyle: config.strokeColor,
        lineWidth: Math.max(3, config.radius * 0.1)
      },
      label: `circle-${tier}`,
    }) as CircleBody;

    circle.isMerging = false;
    circle.tier = tier;

    Matter.Composite.add(engineRef.current.world, circle);
    return circle;
  }, []);

  const mergeBodies = useCallback((bodyA: CircleBody, bodyB: CircleBody) => {
    if (!engineRef.current || !renderRef.current) return;

    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    Matter.Composite.remove(engineRef.current.world, bodyA);
    Matter.Composite.remove(engineRef.current.world, bodyB);

    const newTier = Math.min((bodyA.tier || 1) + 1, 9) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const newCircle = createCircle(newTier, midX, midY);
    
    // Apply upward force to the new circle
    if (newCircle) {
      Matter.Body.setVelocity(newCircle, {
        x: 0,
        y: -5 // Negative value for upward movement
      });
    }
    
    onNewTier(newTier);
  }, [createCircle, onNewTier]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const render = Matter.Render.create({
      element: container,
      engine: engineRef.current,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
      }
    });
    renderRef.current = render;

    // Create walls with different friction properties
    const walls = [
      // Floor - very slippery
      Matter.Bodies.rectangle(width / 2, height + 30, width, 60, {
        isStatic: true,
        friction: 0.0001,      // Extremely low friction
        restitution: 0.1,      // Low bounce for the floor
        render: { fillStyle: '#94a3b8' }
      }),
      // Left wall - normal friction
      Matter.Bodies.rectangle(-30, height / 2, 60, height, {
        isStatic: true,
        friction: 0.1,         // Normal friction for walls
        render: { fillStyle: '#94a3b8' }
      }),
      // Right wall - normal friction
      Matter.Bodies.rectangle(width + 30, height / 2, 60, height, {
        isStatic: true,
        friction: 0.1,         // Normal friction for walls
        render: { fillStyle: '#94a3b8' }
      }),
    ];

    Matter.Composite.add(engineRef.current.world, walls);

    Matter.Runner.run(engineRef.current);
    Matter.Render.run(render);

    // Collision handling
    const collisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as CircleBody;
        const bodyB = pair.bodyB as CircleBody;
        
        if (bodyA.label?.startsWith('circle-') && 
            bodyB.label?.startsWith('circle-') && 
            !bodyA.isMerging && 
            !bodyB.isMerging) {
          
          const tierA = bodyA.tier;
          const tierB = bodyB.tier;

          if (tierA === tierB && tierA && tierA < 9) {
            bodyA.isMerging = true;
            bodyB.isMerging = true;

            requestAnimationFrame(() => {
              mergeBodies(bodyA, bodyB);
            });
          }
        }
      });
    };

    Matter.Events.on(engineRef.current, 'collisionStart', collisionHandler);

    return () => {
      Matter.Events.off(engineRef.current, 'collisionStart', collisionHandler);
      Matter.Render.stop(render);
      Matter.Engine.clear(engineRef.current);
      render.canvas.remove();
    };
  }, [containerRef, createCircle, mergeBodies]);

  const startDrag = useCallback((x: number) => {
    if (!renderRef.current) return;
    const { width } = renderRef.current.canvas;
    
    // Create circle at the top with no gravity
    const circle = createCircle(1, x || width / 2, 50);
    if (circle) {
      circle.isStatic = true; // Make it static while dragging
      currentCircleRef.current = circle;
      isDraggingRef.current = true;
    }
  }, [createCircle]);

  const updateDrag = useCallback((x: number) => {
    if (!currentCircleRef.current || !isDraggingRef.current || !renderRef.current) return;
    
    const { width } = renderRef.current.canvas;
    // Constrain x position within container bounds
    const constrainedX = Math.max(30, Math.min(width - 30, x));
    
    Matter.Body.setPosition(currentCircleRef.current, {
      x: constrainedX,
      y: currentCircleRef.current.position.y,
    });
  }, []);

  const endDrag = useCallback(() => {
    if (!currentCircleRef.current || !isDraggingRef.current) return;
    
    // Make the circle dynamic and let it fall
    currentCircleRef.current.isStatic = false;
    isDraggingRef.current = false;
    currentCircleRef.current = null;
    
    // Notify parent component that drop has occurred
    onDrop();
  }, [onDrop]);

  return {
    engine: engineRef.current,
    render: renderRef.current,
    startDrag,
    updateDrag,
    endDrag,
    isDragging: isDraggingRef.current,
  };
}; 