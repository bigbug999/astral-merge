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
    gravity: { y: 2.2 },
    positionIterations: 8,
    velocityIterations: 6,
    constraintIterations: 2,
    enableSleeping: false
  }));
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const currentCircleRef = useRef<Matter.Body | null>(null);
  const isDraggingRef = useRef(false);
  const isFirstSpawnRef = useRef(true);
  const nextSpawnXRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const animationStartTimeRef = useRef<number | null>(null);
  const ANIMATION_DURATION = 500; // 500ms for the animation

  // Extend the Matter.Body type to include our custom properties
  type CircleBody = Matter.Body & {
    isMerging?: boolean;
    tier?: number;
    composite?: Matter.Composite;
    hasBeenDropped?: boolean;
  };

  // Add this helper function to create the circle texture with glow
  const createCircleTexture = (fillColor: string, strokeColor: string, glowColor: string, size: number) => {
    const canvas = document.createElement('canvas');
    const padding = 8; // Extra space for glow
    canvas.width = size + (padding * 2);
    canvas.height = size + (padding * 2);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Draw glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw circle with glow
    ctx.beginPath();
    ctx.arc(size/2 + padding, size/2 + padding, size/2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    return canvas.toDataURL();
  };

  const createCircle = useCallback((
    tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    x: number,
    y: number
  ) => {
    if (!renderRef.current || !engineRef.current) return null;

    const config = CIRCLE_CONFIG[tier];
    const baseDensity = 0.003;
    
    // Create visual radius with smaller gap (changed from -2 to -1)
    const collisionRadius = config.radius;
    const visualRadius = collisionRadius - 1; // Reduced visual gap
    
    // Create circle texture with glow
    const texture = createCircleTexture(
      config.color,
      config.strokeColor,
      config.color.replace('0.1', '0.3'),
      visualRadius * 2
    );
    
    let densityMultiplier;
    if (tier <= 4) {
      densityMultiplier = Math.pow(0.85, tier - 1);
    } else {
      densityMultiplier = Math.pow(0.85, 3) * Math.pow(0.6, tier - 4);
    }
    
    const circle = Matter.Bodies.circle(x, y, collisionRadius, {
      restitution: 0.4,
      friction: 0.001,
      density: baseDensity * densityMultiplier,
      frictionAir: 0.0001,
      frictionStatic: 0,
      slop: 0.05,
      collisionFilter: {
        group: 0,
        category: 0x0001,
        mask: 0xFFFFFFFF
      },
      render: {
        sprite: {
          texture: texture,
          xScale: 1,
          yScale: 1
        }
      },
      label: `circle-${tier}`,
      inertia: Infinity,
      inverseInertia: 0
    }) as CircleBody;

    circle.isMerging = false;
    circle.tier = tier;
    circle.hasBeenDropped = false;

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

    // Prevent merging if either body is already merging
    if (bodyA.isMerging || bodyB.isMerging) return;
    
    // Mark both bodies as merging to prevent multiple merges
    bodyA.isMerging = true;
    bodyB.isMerging = true;

    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    // Remove both bodies from the world
    Matter.Composite.remove(engineRef.current.world, bodyA);
    Matter.Composite.remove(engineRef.current.world, bodyB);

    const newTier = Math.min((bodyA.tier || 1) + 1, 12) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    const newCircle = createCircle(newTier, midX, midY);
    
    if (newCircle) {
      // Set the new circle as dropped immediately
      (newCircle as CircleBody).hasBeenDropped = true;
      
      // Give a small upward boost to the new circle
      Matter.Body.setVelocity(newCircle, {
        x: 0,
        y: -2 // Reduced from -5 for more controlled bouncing
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

    // Create walls with dark theme colors
    const walls = [
      // Floor
      Matter.Bodies.rectangle(width / 2, height + 30, width, 60, {
        isStatic: true,
        friction: 0.001,
        restitution: 0.4,
        slop: 0.05,
        frictionStatic: 0,
        render: { fillStyle: '#27272a' }
      }),
      // Left wall
      Matter.Bodies.rectangle(-30, height / 2, 60, height, {
        isStatic: true,
        friction: 0.001,
        restitution: 0.4,
        slop: 0.05,
        frictionStatic: 0,
        render: { fillStyle: '#27272a' }
      }),
      // Right wall
      Matter.Bodies.rectangle(width + 30, height / 2, 60, height, {
        isStatic: true,
        friction: 0.001,
        restitution: 0.4,
        slop: 0.05,
        frictionStatic: 0,
        render: { fillStyle: '#27272a' }
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
        
        // Only process collisions between circles
        if (!bodyA.label?.startsWith('circle-') || !bodyB.label?.startsWith('circle-')) {
          return;
        }

        // Only merge if both circles have been dropped and aren't already merging
        if (bodyA.hasBeenDropped && 
            bodyB.hasBeenDropped && 
            !bodyA.isMerging && 
            !bodyB.isMerging) {
          
          const tierA = bodyA.tier;
          const tierB = bodyB.tier;

          // Check if tiers match and are valid for merging
          if (tierA === tierB && tierA !== undefined && tierA < 12) {
            // Use requestAnimationFrame to handle the merge on the next frame
            requestAnimationFrame(() => {
              mergeBodies(bodyA, bodyB);
            });
          }
        }
      });
    };

    // Listen for both collisionStart and collisionActive
    Matter.Events.on(engineRef.current, 'collisionStart', collisionHandler);
    Matter.Events.on(engineRef.current, 'collisionActive', collisionHandler);

    return () => {
      // Clean up both event listeners
      Matter.Events.off(engineRef.current, 'collisionStart', collisionHandler);
      Matter.Events.off(engineRef.current, 'collisionActive', collisionHandler);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engineRef.current);
      render.canvas.remove();
      runnerRef.current = null;
    };
  }, [containerRef, createCircle, mergeBodies]);

  const prepareNextSpawn = useCallback((mouseX?: number) => {
    if (!renderRef.current) return;
    const { width } = renderRef.current.canvas;
    
    const circleRadius = CIRCLE_CONFIG[nextTier as keyof typeof CIRCLE_CONFIG].radius;
    const padding = circleRadius + 5;
    
    // Store initial spawn position
    nextSpawnXRef.current = mouseX !== undefined ? 
      Math.max(padding, Math.min(width - padding, mouseX)) : 
      width / 2;
    
    const circle = createCircle(
      nextTier as 1|2|3|4|5|6|7|8|9|10|11|12, 
      nextSpawnXRef.current,
      -circleRadius
    );
    
    if (circle) {
      circle.isStatic = true;
      currentCircleRef.current = circle;
      isDraggingRef.current = true;
      isAnimatingRef.current = true;
      animationStartTimeRef.current = performance.now();
      
      const startY = -circleRadius;
      const targetY = 30;
      const totalDistance = targetY - startY;
      
      const animateSlideDown = (timestamp: number) => {
        if (!circle || !isDraggingRef.current) return;
        
        if (!animationStartTimeRef.current) {
          animationStartTimeRef.current = timestamp;
        }
        
        const elapsed = timestamp - animationStartTimeRef.current;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        // Linear interpolation for Y position
        const newY = startY + (totalDistance * progress);
        
        // Use the latest X position from nextSpawnXRef
        Matter.Body.setPosition(circle, {
          x: nextSpawnXRef.current || width / 2,
          y: newY
        });
        
        if (progress < 1) {
          requestAnimationFrame(animateSlideDown);
        } else {
          // Animation complete
          isAnimatingRef.current = false;
          animationStartTimeRef.current = null;
        }
      };
      
      requestAnimationFrame(animateSlideDown);
    }
  }, [createCircle, nextTier]);

  const startDrag = useCallback((x: number) => {
    // Don't allow starting a new drag while animating
    if (isAnimatingRef.current) return;
    
    if (!renderRef.current) return;
    const { width } = renderRef.current.canvas;
    
    if (isFirstSpawnRef.current) {
      // First spawn logic - also moved closer to top
      const spawnX = width / 2;
      const spawnY = 30;
      
      const circle = createCircle(
        nextTier as 1|2|3|4|5|6|7|8|9|10|11|12, 
        spawnX,
        spawnY
      );
      
      if (circle) {
        circle.isStatic = true;
        currentCircleRef.current = circle;
        isDraggingRef.current = true;
        isFirstSpawnRef.current = false;
      }
    } else if (currentCircleRef.current) {
      // Update position only if not animating
      const radius = CIRCLE_CONFIG[nextTier as keyof typeof CIRCLE_CONFIG].radius;
      const padding = radius + 5;
      const constrainedX = Math.max(padding, Math.min(width - padding, x));
      nextSpawnXRef.current = constrainedX;
      
      Matter.Body.setPosition(currentCircleRef.current, {
        x: constrainedX,
        y: currentCircleRef.current.position.y
      });
    }
  }, [createCircle, nextTier]);

  const updateDrag = useCallback((x: number) => {
    if (!renderRef.current) return;
    
    const { width } = renderRef.current.canvas;
    const circle = currentCircleRef.current as CircleBody;
    if (!circle) return;
    
    const radius = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG || 1].radius;
    const padding = radius + 5;
    
    // Update X position even during animation
    const constrainedX = Math.max(
      padding, 
      Math.min(width - padding, x)
    );
    
    // Store the last valid mouse position
    nextSpawnXRef.current = constrainedX;
    
    // Only update the circle position directly if not animating
    if (!isAnimatingRef.current) {
      Matter.Body.setPosition(circle, {
        x: constrainedX,
        y: circle.position.y,
      });
    }
  }, []);

  const endDrag = useCallback((mouseX?: number) => {
    if (isAnimatingRef.current) return;
    
    if (!currentCircleRef.current || !isDraggingRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    circle.hasBeenDropped = true;
    circle.isStatic = false;
    isDraggingRef.current = false;
    currentCircleRef.current = null;
    
    onDrop();
    prepareNextSpawn(mouseX);
  }, [onDrop, prepareNextSpawn]);

  return {
    engine: engineRef.current,
    render: renderRef.current,
    startDrag,
    updateDrag,
    endDrag,
    isDragging: isDraggingRef.current,
  };
}; 