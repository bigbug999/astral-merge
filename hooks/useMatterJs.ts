import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG, PowerUpState, HEAVY_BALL_CONFIG, SUPER_HEAVY_BALL_CONFIG } from '@/types/game';

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

    // Get physics properties based on power-up state
    const physicsConfig = powerUps.isSuperHeavyBallActive 
      ? {
          density: 0.5,            // Much heavier
          friction: 0.0001,        // Almost no friction
          frictionAir: 0.00001,    // Almost no air resistance
          restitution: 0.01,       // Almost no bounce
          frictionStatic: 0.0001,  // No static friction
          slop: 1,                 // Very forgiving collisions
          torque: 0,               // No rotation
          inertia: Infinity,       // Resist rotation
        }
      : powerUps.isHeavyBallActive 
        ? {
            density: 0.1,          // Increased from 0.025 to 0.1
            friction: 0.0005,      // Reduced friction
            frictionAir: 0.00005,  // Reduced air friction
            restitution: 0.1,      // Less bouncy
            frictionStatic: 0.001, // Lower static friction
            slop: 0.5,            // More forgiving collisions
            torque: 0,            // Reduced rotation
            inertia: 1000,        // Some rotation resistance
          }
        : {
            density: 0.015,
            friction: 0.1,
            frictionAir: 0.001,
            restitution: 0.5,
          };

    // Get visual properties from CIRCLE_CONFIG
    const visualConfig = CIRCLE_CONFIG[tier];
    const collisionRadius = visualConfig.radius;
    const visualRadius = collisionRadius - 1;
    
    // Create circle texture with glow
    const texture = createCircleTexture(
      visualConfig.color,
      powerUps.isSuperHeavyBallActive
        ? SUPER_HEAVY_BALL_CONFIG.strokeColor
        : powerUps.isHeavyBallActive 
          ? HEAVY_BALL_CONFIG.strokeColor 
          : visualConfig.strokeColor,
      powerUps.isSuperHeavyBallActive
        ? SUPER_HEAVY_BALL_CONFIG.glowColor
        : powerUps.isHeavyBallActive 
          ? HEAVY_BALL_CONFIG.glowColor 
          : visualConfig.glowColor,
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
  }, [powerUps.isHeavyBallActive, powerUps.isSuperHeavyBallActive]);

  const mergeBodies = useCallback((bodyA: CircleBody, bodyB: CircleBody) => {
    if (!engineRef.current || !renderRef.current) return;

    // Prevent merging if either body is already merging
    if (bodyA.isMerging || bodyB.isMerging) return;
    
    // Mark both bodies as merging to prevent multiple merges
    bodyA.isMerging = true;
    bodyB.isMerging = true;

    // Calculate midpoint for new circle spawn
    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    // Remove old circles immediately
    Matter.Composite.remove(engineRef.current.world, [bodyA, bodyB]);

    // Create new merged circle
    const newTier = Math.min((bodyA.tier || 1) + 1, 12) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    
    // Store current power-up states
    const currentPowerUps = {
      isHeavyBallActive: powerUps.isHeavyBallActive,
      isSuperHeavyBallActive: powerUps.isSuperHeavyBallActive
    };

    // Temporarily disable all power-ups for the new merged ball
    powerUps.isHeavyBallActive = false;
    powerUps.isSuperHeavyBallActive = false;
    
    const newCircle = createCircle(newTier, midX, midY);
    
    // Restore power-up states
    powerUps.isHeavyBallActive = currentPowerUps.isHeavyBallActive;
    powerUps.isSuperHeavyBallActive = currentPowerUps.isSuperHeavyBallActive;
    
    if (newCircle) {
      (newCircle as CircleBody).hasBeenDropped = true;
      Matter.Body.setVelocity(newCircle, { x: 0, y: -2.5 });
    }

    onNewTier(newTier);
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
        friction: 0.01,
        frictionStatic: 0.01,
        restitution: 0.5,
        slop: 0.05,
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
    const beforeUpdateHandler = () => {
      if (engineRef.current && containerRef.current) {
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
      }
    };

    if (engineRef.current) {
      Matter.Events.on(engineRef.current, 'beforeUpdate', beforeUpdateHandler);
    }

    // Add continuous force for super heavy balls
    const forceInterval = setInterval(() => {
      if (engineRef.current) {
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        bodies.forEach((body) => {
          const circle = body as CircleBody;
          if (circle.label?.startsWith('circle-') && 
              circle.hasBeenDropped) {
            
            if (circle.isHeavyBall) {
              if (powerUps.isSuperHeavyBallActive) {
                // Super heavy ball forces (existing code)
                Matter.Body.applyForce(circle, 
                  circle.position, 
                  { x: 0, y: 0.01 }
                );
                // ... rest of super heavy logic ...
              } else if (powerUps.isHeavyBallActive) {
                // Regular heavy ball forces
                Matter.Body.applyForce(circle, 
                  circle.position, 
                  { x: 0, y: 0.003 }  // Constant but lighter downward force
                );
                
                // Lighter random horizontal force to prevent stacking
                if (circle.velocity.y < 0.2) {
                  Matter.Body.applyForce(circle, 
                    circle.position, 
                    { 
                      x: (Math.random() - 0.5) * 0.0002,
                      y: 0
                    }
                  );
                }
              }
            }
          }
        });
      }
    }, 16); // Run at ~60fps

    Matter.Runner.run(runner, engineRef.current);
    Matter.Render.run(render);

    return () => {
      collisionQueue = [];
      // Clean up both event listeners
      Matter.Events.off(engineRef.current, 'collisionStart', collisionHandler);
      Matter.Events.off(engineRef.current, 'collisionActive', collisionHandler);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engineRef.current);
      render.canvas.remove();
      runnerRef.current = null;
      // Add to cleanup
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'beforeUpdate', beforeUpdateHandler);
      }
      clearInterval(forceInterval);
    };
  }, [containerRef, createCircle, mergeBodies, powerUps.isSuperHeavyBallActive]);

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
    
    // Calculate initial drop velocity with adjusted boosts
    const baseDropVelocity = engineRef.current.gravity.y * (engineRef.current.timing.timeScale * 0.5);
    const initialDropVelocity = powerUps.isSuperHeavyBallActive 
      ? baseDropVelocity * 20    // 20x velocity for super heavy balls
      : powerUps.isHeavyBallActive 
        ? baseDropVelocity * 8   // Increased from 2x to 8x for heavy balls
        : baseDropVelocity;
    
    Matter.Body.setVelocity(circle, {
      x: 0,
      y: initialDropVelocity
    });
    
    // Add immediate force based on power-up
    if (powerUps.isSuperHeavyBallActive) {
      Matter.Body.applyForce(circle, 
        circle.position, 
        { x: 0, y: 0.2 }        // Strong force for super heavy
      );
    } else if (powerUps.isHeavyBallActive) {
      Matter.Body.applyForce(circle, 
        circle.position, 
        { x: 0, y: 0.05 }       // Medium force for heavy
      );
    }
    
    // Ensure the body is not static and has proper physics properties
    circle.isStatic = false;
    Matter.Body.set(circle, {
      isSleeping: false,
      motion: 1,
      speed: Math.abs(initialDropVelocity)
    });
    
    isDraggingRef.current = false;
    currentCircleRef.current = null;
    
    setTimeout(() => {
      if (circle && !circle.isSleeping) {
        Matter.Body.set(circle, {
          motion: circle.speed
        });
      }
    }, 50);
    
    onDrop();
    prepareNextSpawn(mouseX);

    // For super heavy balls, add periodic force pulses
    if (powerUps.isSuperHeavyBallActive) {
      const pulseDuration = 500; // Duration of force pulses in ms
      const pulseCount = 3;      // Number of pulses
      
      for (let i = 0; i < pulseCount; i++) {
        setTimeout(() => {
          if (circle && !circle.isMerging) {
            Matter.Body.applyForce(circle, 
              circle.position, 
              { 
                x: 0,
                y: 0.05 * (1 - (i / pulseCount))  // Decreasing force over time
              }
            );
          }
        }, i * pulseDuration);
      }
    }
  }, [onDrop, prepareNextSpawn, powerUps.isHeavyBallActive, powerUps.isSuperHeavyBallActive]);

  return {
    engine: engineRef.current,
    render: renderRef.current,
    startDrag,
    updateDrag,
    endDrag,
    isDragging: isDraggingRef.current,
  };
}; 