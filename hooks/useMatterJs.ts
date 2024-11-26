import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG, PowerUpState, HEAVY_BALL_CONFIG } from '@/types/game';

const OBJECT_POOL_SIZE = 50;

interface ObjectPool {
  active: Set<CircleBody>;
  inactive: CircleBody[];
}

const createObjectPool = (engine: Matter.Engine): ObjectPool => {
  return {
    active: new Set(),
    inactive: []
  };
};

interface CircleBody extends Matter.Body {
  isMerging?: boolean;
  tier?: number;
  hasBeenDropped?: boolean;
  composite?: Matter.Composite;
  isHeavyBall?: boolean;
}

export const useMatterJs = (
  containerRef: React.RefObject<HTMLDivElement>, 
  onDrop: () => void,
  onNewTier: (tier: number) => void,
  nextTier: number,
  powerUps: PowerUpState
) => {
  const engineRef = useRef(Matter.Engine.create({ 
    gravity: { y: 1.5 },
    positionIterations: 6,
    velocityIterations: 4,
    constraintIterations: 2,
    enableSleeping: true,
    timing: {
      timeScale: 1.0,
      timestamp: 0,
    }
  }));
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const currentCircleRef = useRef<Matter.Body | null>(null);
  const isDraggingRef = useRef(false);
  const isFirstSpawnRef = useRef(true);
  const nextSpawnXRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const animationStartTimeRef = useRef<number | null>(null);
  const ANIMATION_DURATION = 200; // Reduced from 300ms to 200ms for initial drop
  const MERGE_ANIMATION_DURATION = 150; // Reduced from 200ms to 150ms for merging
  const objectPoolRef = useRef<ObjectPool | null>(null);
  const frameRateLimiterRef = useRef<number>(0);
  const TARGET_FPS = 60;
  const FRAME_TIME = 1000 / TARGET_FPS;

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
    
    // Configure physics properties based on power-up state
    const physicsConfig = powerUps.isHeavyBallActive ? {
      density: HEAVY_BALL_CONFIG.density,
      friction: HEAVY_BALL_CONFIG.friction,
      frictionAir: HEAVY_BALL_CONFIG.frictionAir,
      restitution: HEAVY_BALL_CONFIG.restitution
    } : {
      density: 0.001,
      friction: 0.02,
      frictionAir: 0.001,
      restitution: 0.3
    };
    
    const collisionRadius = config.radius;
    const visualRadius = collisionRadius - 1;
    
    // Create circle texture with glow
    const texture = createCircleTexture(
      config.color,
      powerUps.isHeavyBallActive ? HEAVY_BALL_CONFIG.strokeColor : config.strokeColor,
      powerUps.isHeavyBallActive ? HEAVY_BALL_CONFIG.glowColor : config.glowColor,
      visualRadius * 2
    );
    
    const circle = Matter.Bodies.circle(x, y, collisionRadius, {
      ...physicsConfig,
      frictionStatic: powerUps.isHeavyBallActive ? 0.01 : 0.2,
      slop: 0.05,
      sleepThreshold: Infinity,
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
      label: `circle-${tier}`
    }) as CircleBody;

    circle.isMerging = false;
    circle.tier = tier;
    circle.hasBeenDropped = false;
    circle.isHeavyBall = powerUps.isHeavyBallActive;

    Matter.Body.setStatic(circle, false);
    Matter.Body.set(circle, {
      torque: 0,
      angularSpeed: 0,
      angularVelocity: 0
    });

    Matter.Composite.add(engineRef.current.world, circle);
    return circle;
  }, [powerUps.isHeavyBallActive]);

  const mergeBodies = useCallback((bodyA: CircleBody, bodyB: CircleBody) => {
    if (!engineRef.current || !renderRef.current) return;

    // Prevent merging if either body is already merging
    if (bodyA.isMerging || bodyB.isMerging) return;
    
    // Mark both bodies as merging to prevent multiple merges
    bodyA.isMerging = true;
    bodyB.isMerging = true;

    // Optimize by pre-calculating positions and using RAF timestamp
    const startPosA = { x: bodyA.position.x, y: bodyA.position.y };
    const startPosB = { x: bodyB.position.x, y: bodyB.position.y };
    const midX = (startPosA.x + startPosB.x) / 2;
    const midY = (startPosA.y + startPosB.y) / 2;

    // Cache scale values
    const originalScale = 1;
    const targetScale = 1.15;
    const scaleDiff = targetScale - originalScale;

    // Make both circles static during animation
    Matter.Body.setStatic(bodyA, true);
    Matter.Body.setStatic(bodyB, true);

    let animationFrameId: number;
    const startTime = performance.now();

    const animateMerge = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / MERGE_ANIMATION_DURATION, 1);

      // Use a simpler easing function
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // First half of animation: move circles together and scale up
      if (progress <= 0.5) {
        const halfProgress = easeProgress * 2;
        
        // Optimize position calculations
        const newX_A = startPosA.x + (midX - startPosA.x) * halfProgress;
        const newY_A = startPosA.y + (midY - startPosA.y) * halfProgress;
        const newX_B = startPosB.x + (midX - startPosB.x) * halfProgress;
        const newY_B = startPosB.y + (midY - startPosB.y) * halfProgress;
        
        Matter.Body.setPosition(bodyA, { x: newX_A, y: newY_A });
        Matter.Body.setPosition(bodyB, { x: newX_B, y: newY_B });

        // Optimize scale calculations
        const scale = originalScale + scaleDiff * halfProgress;
        if (bodyA.render.sprite) bodyA.render.sprite.xScale = bodyA.render.sprite.yScale = scale;
        if (bodyB.render.sprite) bodyB.render.sprite.xScale = bodyB.render.sprite.yScale = scale;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateMerge);
      } else {
        // Cleanup and create new merged circle
        cancelAnimationFrame(animationFrameId);
        Matter.Composite.remove(engineRef.current.world, [bodyA, bodyB]);

        const newTier = Math.min((bodyA.tier || 1) + 1, 12) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        
        // Temporarily disable heavy ball power-up for the new merged ball
        const currentPowerUpState = powerUps.isHeavyBallActive;
        powerUps.isHeavyBallActive = false;
        const newCircle = createCircle(newTier, midX, midY);
        powerUps.isHeavyBallActive = currentPowerUpState;
        
        if (newCircle) {
          (newCircle as CircleBody).hasBeenDropped = true;
          
          if (newCircle.render.sprite) {
            newCircle.render.sprite.xScale = newCircle.render.sprite.yScale = targetScale;
          }

          // Optimize scale down animation
          const scaleDownStart = performance.now();
          const scaleDownDuration = 100;
          const scaleRange = targetScale - 1;

          const animateScaleDown = (timestamp: number) => {
            const scaleProgress = Math.min((timestamp - scaleDownStart) / scaleDownDuration, 1);
            // Simplified easing
            const easedScale = 1 + scaleRange * (1 - scaleProgress * scaleProgress);
            
            if (newCircle.render.sprite) {
              newCircle.render.sprite.xScale = newCircle.render.sprite.yScale = easedScale;
            }

            if (scaleProgress < 1) {
              requestAnimationFrame(animateScaleDown);
            } else {
              Matter.Body.setVelocity(newCircle, { x: 0, y: -2.5 });
            }
          };

          requestAnimationFrame(animateScaleDown);
        }

        onNewTier(newTier);
      }
    };

    requestAnimationFrame(animateMerge);
  }, [createCircle, onNewTier, powerUps]);

  const createDangerZone = (width: number) => {
    const dangerZoneHeight = 120;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = dangerZoneHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Create thinner stripes
    const stripeHeight = 2; // Reduced to 2px lines
    const stripeGap = 2;    // Reduced to 2px gaps
    const stripeAngle = -45;
    
    ctx.save();
    
    // Rotate context for angled stripes
    ctx.translate(0, 0);
    ctx.rotate((stripeAngle * Math.PI) / 180);
    
    // Calculate dimensions for rotated stripes
    const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(dangerZoneHeight, 2));
    const numStripes = Math.ceil(hypotenuse / (stripeHeight + stripeGap));
    
    // Draw more frequent stripes
    for (let i = -numStripes; i < numStripes * 2; i++) {
      const y = i * (stripeHeight + stripeGap);
      // Using slightly darker grey for better visibility of thin lines
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(75, 75, 75, 0.15)'; // Increased opacity slightly for thin lines
        ctx.fillRect(-hypotenuse, y, hypotenuse * 2, stripeHeight);
      }
    }
    
    ctx.restore();

    // Add bottom stroke
    ctx.beginPath();
    ctx.moveTo(0, dangerZoneHeight - 1);
    ctx.lineTo(width, dangerZoneHeight - 1);
    ctx.strokeStyle = 'rgba(75, 75, 75, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toDataURL();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    // Create the render
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
      isFixed: true,
      delta: 1000 / 120,
    });
    runnerRef.current = runner;

    // Update engine settings with slightly reduced speed
    engineRef.current.world.gravity.scale = 0.001;  // Reduced from 0.002
    engineRef.current.timing.timeScale = 1.0;        // Reduced from 1.5
    
    // Force an initial engine update
    Matter.Engine.update(engineRef.current, runner.delta);

    // Update the danger zone and walls to use zIndex instead of layer
    const dangerZone = Matter.Bodies.rectangle(width / 2, 60, width, 120, {
      isStatic: true,
      isSensor: true,
      render: {
        sprite: {
          texture: createDangerZone(width),
          xScale: 1,
          yScale: 1
        }
      },
      label: 'danger-zone'
    });

    // Optimize engine settings for better performance
    engineRef.current.world.gravity.scale = 0.001;
    engineRef.current.timing.timeScale = 1.0;
    
    // Reduce solver iterations while maintaining stability
    engineRef.current.positionIterations = 6;
    engineRef.current.velocityIterations = 4;
    engineRef.current.constraintIterations = 2;

    // Add performance optimizations for the physics bodies
    const createOptimizedWalls = () => [
      dangerZone,
      Matter.Bodies.rectangle(width / 2, height + 25, width + 60, 50, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.4,
        slop: 0.05,           // Increased slop for better performance
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      }),
      // Left wall
      Matter.Bodies.rectangle(-25, height / 2, 50, height + 60, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.4,
        slop: 0.05,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      }),
      // Right wall
      Matter.Bodies.rectangle(width + 25, height / 2, 50, height + 60, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.4,
        slop: 0.05,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      })
    ];

    const walls = createOptimizedWalls();
    Matter.Composite.add(engineRef.current.world, walls);

    // Add performance optimization for collision handling
    let collisionQueue: Array<[CircleBody, CircleBody]> = [];
    let isProcessingCollisions = false;

    const processCollisionQueue = () => {
      if (isProcessingCollisions || collisionQueue.length === 0) return;
      
      isProcessingCollisions = true;
      const [bodyA, bodyB] = collisionQueue.shift()!;
      
      mergeBodies(bodyA, bodyB);
      
      isProcessingCollisions = false;
      if (collisionQueue.length > 0) {
        requestAnimationFrame(processCollisionQueue);
      }
    };

    const collisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as CircleBody;
        const bodyB = pair.bodyB as CircleBody;
        
        if (!bodyA.label?.startsWith('circle-') || !bodyB.label?.startsWith('circle-')) {
          return;
        }

        if (bodyA.hasBeenDropped && 
            bodyB.hasBeenDropped && 
            !bodyA.isMerging && 
            !bodyB.isMerging) {
          
          const tierA = bodyA.tier;
          const tierB = bodyB.tier;

          if (tierA === tierB && tierA !== undefined && tierA < 12) {
            // Add to collision queue instead of processing immediately
            collisionQueue.push([bodyA, bodyB]);
            requestAnimationFrame(processCollisionQueue);
          }
        }
      });
    };

    // Listen for both collisionStart and collisionActive
    Matter.Events.on(engineRef.current, 'collisionStart', collisionHandler);
    Matter.Events.on(engineRef.current, 'collisionActive', collisionHandler);

    // Add collision detection for danger zone
    Matter.Events.on(engineRef.current, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as CircleBody;
        const bodyB = pair.bodyB as CircleBody;
        
        // Check if either body is the danger zone
        if (bodyA.label === 'danger-zone' || bodyB.label === 'danger-zone') {
          const circle = bodyA.label.startsWith('circle-') ? bodyA : 
                        bodyB.label.startsWith('circle-') ? bodyB : null;
                          
          if (circle && circle.hasBeenDropped) {
            // TODO: Handle game over condition
            console.log('Game Over - Circle touched danger zone!');
          }
        }
      });
    });

    // Add before update event handler to check for and wake up falling sleeping bodies
    Matter.Events.on(engineRef.current, 'beforeUpdate', () => {
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      
      bodies.forEach((body) => {
        const circle = body as CircleBody;
        
        // Only check circles that are sleeping and have been dropped
        if (circle.label?.startsWith('circle-') && 
            circle.isSleeping && 
            circle.hasBeenDropped) {
          
          // Check if there's any support below this circle
          const position = circle.position;
          const radius = circle.circleRadius || 0;
          
          // Create a small rectangle below the circle to check for collisions
          const detector = Matter.Bodies.rectangle(
            position.x,
            position.y + radius + 1, // Just below the circle
            radius * 0.5, // Narrow detector
            2, // Very thin
            { isSensor: true }
          );

          // Check for collisions with the detector
          const collisions = Matter.Query.collides(detector, bodies);
          
          // If no collisions (except with self) or only colliding with other sleeping bodies
          const hasSupport = collisions.some(collision => {
            const other = collision.bodyA === detector ? collision.bodyB : collision.bodyA;
            return other !== circle && 
                   !other.isSleeping && 
                   !other.label?.startsWith('danger-zone');
          });

          // Wake up the circle if it has no support
          if (!hasSupport) {
            Matter.Sleeping.set(circle, false);
            // Add a small downward velocity to ensure it starts moving
            Matter.Body.setVelocity(circle, {
              x: circle.velocity.x,
              y: Math.max(circle.velocity.y, 0.1)
            });
          }
        }
      });
    });

    // Create the beforeUpdate handler with the correct number of arguments
    const beforeUpdateHandler = () => {
      if (runnerRef.current) {
        // Add the time parameter (using the runner's delta)
        Matter.Runner.tick(runnerRef.current, engineRef.current, runnerRef.current.delta);
      }
    };

    // Add the event listener with the stored handler
    Matter.Events.on(engineRef.current, 'beforeUpdate', beforeUpdateHandler);

    Matter.Runner.run(runner, engineRef.current);
    Matter.Render.run(render);

    return () => {
      collisionQueue = [];
      // Clean up event listeners
      Matter.Events.off(engineRef.current, 'collisionStart', collisionHandler);
      Matter.Events.off(engineRef.current, 'collisionActive', collisionHandler);
      Matter.Events.off(engineRef.current, 'beforeUpdate', beforeUpdateHandler);
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
        
        // Modified easing function for smoother transition to physics
        const easeOutQuad = (x: number): number => {
          return 1 - (1 - x) * (1 - x);
        };
        
        const easedProgress = easeOutQuad(progress);
        const newY = startY + (totalDistance * easedProgress);
        
        Matter.Body.setPosition(circle, {
          x: nextSpawnXRef.current || width / 2,
          y: newY
        });
        
        if (progress < 1) {
          requestAnimationFrame(animateSlideDown);
        } else {
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
    if (!renderRef.current || !isDraggingRef.current) return;
    
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
    if (!isDraggingRef.current || isAnimatingRef.current) return;
    
    if (!currentCircleRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    circle.hasBeenDropped = true;
    
    Matter.Sleeping.set(circle, false);
    
    Matter.Body.set(circle, {
      sleepThreshold: 60,
      timeScale: 1.0
    });
    
    // Calculate initial drop velocity with a boost for heavy balls
    const baseDropVelocity = engineRef.current.gravity.y * (engineRef.current.timing.timeScale * 0.5);
    const initialDropVelocity = powerUps.isHeavyBallActive 
      ? baseDropVelocity * 2  // Double the initial velocity for heavy balls
      : baseDropVelocity;
    
    Matter.Body.setVelocity(circle, {
      x: 0,
      y: initialDropVelocity
    });
    
    // Ensure the body is not static and has proper physics properties
    circle.isStatic = false;
    Matter.Body.set(circle, {
      isSleeping: false,
      motion: 1, // Set motion above sleep threshold
      speed: Math.abs(initialDropVelocity) // Ensure speed is non-zero
    });
    
    isDraggingRef.current = false;
    currentCircleRef.current = null;
    
    // Add a small timeout to ensure the body stays awake during initial fall
    setTimeout(() => {
      if (circle && !circle.isSleeping) {
        Matter.Body.set(circle, {
          motion: circle.speed // Update motion based on current speed
        });
      }
    }, 50);
    
    onDrop();
    prepareNextSpawn(mouseX);
  }, [onDrop, prepareNextSpawn, powerUps.isHeavyBallActive]);

  return {
    engine: engineRef.current,
    render: renderRef.current,
    startDrag,
    updateDrag,
    endDrag,
    isDragging: isDraggingRef.current,
  };
}; 