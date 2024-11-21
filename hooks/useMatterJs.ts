import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG } from '@/types/game';

export const useMatterJs = (
  containerRef: React.RefObject<HTMLDivElement>, 
  onDrop: () => void,
  onNewTier: (tier: number) => void,
  nextTier: number
) => {
  const engineRef = useRef(Matter.Engine.create({ 
    gravity: { y: 1.8 },
    positionIterations: 30,     // Increased from 20
    velocityIterations: 24,     // Increased from 16
    constraintIterations: 12,   // Increased from 10
    enableSleeping: false
  }));
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const currentCircleRef = useRef<Matter.Body | null>(null);
  const isDraggingRef = useRef(false);

  // Extend the Matter.Body type to include our custom properties
  type CircleBody = Matter.Body & {
    isMerging?: boolean;
    tier?: number;
    composite?: Matter.Composite;
  };

  const createCircle = useCallback((
    tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    x: number,
    y: number
  ) => {
    if (!renderRef.current || !engineRef.current) return null;

    const config = CIRCLE_CONFIG[tier];
    const baseDensity = 0.005;
    
    // Use fixed stroke width of 2px for all circles
    const strokeWidth = 2;
    const visibleRadius = config.radius - strokeWidth;
    
    let densityMultiplier;
    if (tier <= 4) {
      densityMultiplier = Math.pow(0.85, tier - 1);
    } else {
      densityMultiplier = Math.pow(0.85, 3) * Math.pow(0.6, tier - 4);
    }
    
    const circle = Matter.Bodies.circle(x, y, visibleRadius, {
      restitution: 0.2,
      friction: 0.05,
      density: baseDensity * densityMultiplier,
      frictionAir: 0.00001,
      slop: 0.01,
      collisionFilter: {
        group: 0,
        category: 0x0001,
        mask: 0xFFFFFFFF
      },
      render: {
        fillStyle: config.color,
        strokeStyle: config.strokeColor,
        lineWidth: strokeWidth // Fixed 2px stroke width
      },
      label: `circle-${tier}`,
      inertia: Infinity,
      inverseInertia: 0
    }) as CircleBody;

    // Scale up the collision body to match the original intended size
    const scaleRatio = config.radius / visibleRadius;
    Matter.Body.scale(circle, scaleRatio, scaleRatio);

    circle.isMerging = false;
    circle.tier = tier;

    Matter.Body.setStatic(circle, false);
    Matter.Body.set(circle, {
      torque: 0,
      angularSpeed: 0,
      angularVelocity: 0
    });

    Matter.Composite.add(engineRef.current.world, circle);
    return circle;
  }, []);

  const mergeBodies = useCallback((bodyA: CircleBody, bodyB: CircleBody) => {
    if (!engineRef.current || !renderRef.current) return;

    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    Matter.Composite.remove(engineRef.current.world, bodyA);
    Matter.Composite.remove(engineRef.current.world, bodyB);

    const newTier = Math.min((bodyA.tier || 1) + 1, 12) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    const newCircle = createCircle(newTier, midX, midY);
    
    if (newCircle) {
      Matter.Body.setVelocity(newCircle, {
        x: 0,
        y: -5
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
    
    const runner = Matter.Runner.create({
      isFixed: true,           // Enable fixed timestep
      delta: 1000 / 120,       // Run at 120Hz for smoother physics
    });
    runnerRef.current = runner;

    // Update engine settings with slightly reduced speed
    engineRef.current.world.gravity.scale = 0.001;  // Reduced from 0.002
    engineRef.current.timing.timeScale = 1.0;        // Reduced from 1.5
    
    // Force an initial engine update
    Matter.Engine.update(engineRef.current, runner.delta);

    // Create walls with zero slop
    const walls = [
      // Floor
      Matter.Bodies.rectangle(width / 2, height + 30, width, 60, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.1,
        slop: 0,
        render: { fillStyle: '#94a3b8' }
      }),
      // Left wall
      Matter.Bodies.rectangle(-30, height / 2, 60, height, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.1,
        slop: 0,
        render: { fillStyle: '#94a3b8' }
      }),
      // Right wall
      Matter.Bodies.rectangle(width + 30, height / 2, 60, height, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.1,
        slop: 0,
        render: { fillStyle: '#94a3b8' }
      })
    ];

    Matter.Composite.add(engineRef.current.world, walls);

    // Configure engine again before starting the runner
    engineRef.current.positionIterations = 40;
    engineRef.current.velocityIterations = 30;
    engineRef.current.constraintIterations = 20;

    Matter.Runner.run(runner, engineRef.current);
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
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engineRef.current);
      render.canvas.remove();
      runnerRef.current = null;
    };
  }, [containerRef, createCircle, mergeBodies]);

  const startDrag = useCallback((x: number) => {
    if (!renderRef.current) return;
    const { width } = renderRef.current.canvas;
    
    // Get the radius of the next circle
    const circleRadius = CIRCLE_CONFIG[nextTier as keyof typeof CIRCLE_CONFIG].radius;
    
    // Add padding equal to the circle's radius plus a small buffer
    const padding = circleRadius + 5;
    
    // Constrain initial spawn position to be within safe bounds
    const safeX = Math.max(
      padding, 
      Math.min(width - padding, x || width / 2)
    );
    
    // Create circle at safe position
    const circle = createCircle(
      nextTier as 1|2|3|4|5|6|7|8|9|10|11|12, 
      safeX, 
      50
    );
    
    if (circle) {
      circle.isStatic = true;
      currentCircleRef.current = circle;
      isDraggingRef.current = true;
    }
  }, [createCircle, nextTier]);

  const updateDrag = useCallback((x: number) => {
    if (!currentCircleRef.current || !isDraggingRef.current || !renderRef.current) return;
    
    const { width } = renderRef.current.canvas;
    const circle = currentCircleRef.current as CircleBody;
    const radius = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG || 1].radius;
    
    // Add padding equal to the circle's radius plus a small buffer
    const padding = radius + 5;
    
    // Constrain x position within safe bounds
    const constrainedX = Math.max(
      padding, 
      Math.min(width - padding, x)
    );
    
    Matter.Body.setPosition(currentCircleRef.current, {
      x: constrainedX,
      y: currentCircleRef.current.position.y,
    });
  }, []);

  const endDrag = useCallback(() => {
    if (!currentCircleRef.current || !isDraggingRef.current) return;
    
    currentCircleRef.current.isStatic = false;
    isDraggingRef.current = false;
    currentCircleRef.current = null;
    
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