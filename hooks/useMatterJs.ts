import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG } from '@/types/game';
import type { PowerUp, PowerUpState } from '@/types/powerups';
import { POWER_UPS } from '@/types/powerups';

const OBJECT_POOL_SIZE = 50;

interface ObjectPool {
  circles: CircleBody[];
  maxSize: number;
}

interface CircleBody extends Matter.Body {
  tier?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  hasBeenDropped?: boolean;
  isMerging?: boolean;
  isHeavyBall?: boolean;
  isVoidBall?: boolean;
  deletionsRemaining?: number;
  powerUpDropTime?: number;
  inDangerZone?: boolean;
  dangerZoneStartTime?: number;
  spawnTime?: number;
  powerUpStats?: {
    density: number;
    velocity: number;
    force: number;
    timeRemaining: number;
  };
}

interface DangerZone extends Matter.Body {
  isActive: boolean;
  timeRemaining: number;
}

export const useMatterJs = (
  containerRef: React.RefObject<HTMLDivElement>, 
  onDrop: () => void,
  onNewTier: (tier: number) => void,
  nextTier: number,
  powerUps: PowerUpState,
  onPowerUpUse: () => void,
  onGameOver: () => void
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
  const isCreatingDropBallRef = useRef(false);
  const DANGER_ZONE_HEIGHT = 100; // Height of danger zone from top
  const DANGER_ZONE_GRACE_PERIOD = 2000; // 2 seconds before danger zone detection starts
  const DANGER_ZONE_TIMEOUT = 3000; // 3 seconds in danger zone before game over
  const dangerZoneRef = useRef<DangerZone | null>(null);

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

  // Add this helper function to get active power-up
  const getActivePowerUp = useCallback((powerUpState: PowerUpState) => {
    return powerUpState.activePowerUpId ? POWER_UPS[powerUpState.activePowerUpId] : null;
  }, []);

  // Update current ball's appearance
  const updateCurrentBallAppearance = useCallback(() => {
    if (!currentCircleRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
    const visualRadius = (visualConfig.radius - 1);
    const activePowerUp = getActivePowerUp(powerUps);

    // Update the ball's appearance based on active power-up
    if (circle.render.sprite) {
      circle.render.sprite.texture = createCircleTexture(
        visualConfig.color,
        activePowerUp?.visual.strokeColor || visualConfig.strokeColor,
        activePowerUp?.visual.glowColor || visualConfig.glowColor,
        visualRadius * 2
      );
    }
  }, [powerUps, getActivePowerUp]);

  // Add effect to update appearance when power-ups change
  useEffect(() => {
    updateCurrentBallAppearance();
  }, [powerUps.activePowerUpId, updateCurrentBallAppearance]);

  // Update createCircle to use normal visuals
  const createCircle = useCallback((
    tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    x: number,
    y: number
  ) => {
    if (!renderRef.current || !engineRef.current) return null;

    const visualConfig = CIRCLE_CONFIG[tier];
    const collisionRadius = visualConfig.radius;
    const visualRadius = collisionRadius - 1;
    const activePowerUp = getActivePowerUp(powerUps);
    
    const texture = createCircleTexture(
      visualConfig.color,
      activePowerUp?.visual.strokeColor || visualConfig.strokeColor,
      activePowerUp?.visual.glowColor || visualConfig.glowColor,
      visualRadius * 2
    );

    // Create with physics properties from power-up or defaults
    const circle = Matter.Bodies.circle(x, y, collisionRadius, {
      density: activePowerUp?.physics.density || 0.015,
      friction: activePowerUp?.physics.friction || 0.01,
      frictionAir: activePowerUp?.physics.frictionAir || 0.0001,
      restitution: activePowerUp?.physics.restitution || 0.5,
      frictionStatic: activePowerUp?.physics.frictionStatic || 0.05,
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
    
    Matter.Body.setStatic(circle, false);
    Matter.Body.set(circle, {
      torque: 0,
      angularSpeed: 0,
      angularVelocity: 0
    });

    Matter.Composite.add(engineRef.current.world, circle);
    circle.spawnTime = Date.now();
    circle.inDangerZone = false;
    
    return circle;
  }, [powerUps, getActivePowerUp]);

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
    
    // Store current power-up state
    const currentPowerUpId = powerUps.activePowerUpId;
    
    // Temporarily clear active power-up to prevent it from being applied to merged ball
    powerUps.activePowerUpId = null;
    
    const newCircle = createCircle(newTier, midX, midY);
    
    // Restore original power-up state
    powerUps.activePowerUpId = currentPowerUpId;
    
    if (newCircle) {
      (newCircle as CircleBody).hasBeenDropped = true;
      // Give a small upward boost to the merged ball
      Matter.Body.setVelocity(newCircle, { x: 0, y: -2.5 });
    }

    onNewTier(newTier);
  }, [createCircle, onNewTier, powerUps]);

  // Add this before the useEffect that handles physics updates
  const applyGravityPowerUp = useCallback((circle: CircleBody, activePowerUp: PowerUp) => {
    if (!circle || !activePowerUp || activePowerUp.group !== 'GRAVITY') return;

    circle.isHeavyBall = true;
    circle.powerUpDropTime = Date.now();

    // Apply initial physics properties
    Matter.Body.set(circle, {
      density: activePowerUp.physics.density || 0.015,
      friction: activePowerUp.physics.friction || 0.01,
      frictionAir: activePowerUp.physics.frictionAir || 0.0001,
      restitution: activePowerUp.physics.restitution || 0.5,
      frictionStatic: activePowerUp.physics.frictionStatic || 0.05,
    });

    // Store power-up stats for UI display
    circle.powerUpStats = {
      density: activePowerUp.physics.density || 0,
      velocity: 0,
      force: activePowerUp.effects?.constantForce || 0,
      timeRemaining: activePowerUp.effects?.duration || 5000
    };
  }, []);

  // Update the physics update interval
  useEffect(() => {
    if (!engineRef.current || !containerRef.current) return;

    const forceInterval = setInterval(() => {
      if (engineRef.current) {
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        const currentTime = Date.now();

        bodies.forEach((body) => {
          const circle = body as CircleBody;
          if (circle.label?.startsWith('circle-') && circle.hasBeenDropped) {
            if (circle.isHeavyBall && circle.powerUpDropTime) {
              const elapsedTime = currentTime - circle.powerUpDropTime;
              const activePowerUp = getActivePowerUp(powerUps);
              
              if (activePowerUp && activePowerUp.group === 'GRAVITY') {
                const duration = activePowerUp.effects?.duration || 5000;
                
                if (elapsedTime > duration) {
                  // Reset physics properties
                  Matter.Body.set(circle, {
                    density: 0.015,
                    friction: 0.1,
                    frictionAir: 0.001,
                    restitution: 0.5,
                    frictionStatic: 0.05
                  });
                  circle.isHeavyBall = false;
                  circle.powerUpDropTime = undefined;
                  circle.powerUpStats = undefined;
                } else {
                  // Apply constant force if velocity is below cap
                  if (circle.velocity.y < 15) {
                    const force = activePowerUp.effects?.constantForce || 0.005;
                    Matter.Body.applyForce(circle, circle.position, { x: 0, y: force });
                  }
                  
                  // Update stats for UI display
                  if (circle.powerUpStats) {
                    circle.powerUpStats.velocity = circle.velocity.y;
                    circle.powerUpStats.timeRemaining = duration - elapsedTime;
                  }
                }
              }
            }
          }
        });
      }
    }, 16); // Run at ~60fps

    return () => clearInterval(forceInterval);
  }, [powerUps, getActivePowerUp]);

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
    engineRef.current.timing.timeScale = 1.0;       // Reduced from 1.5
    
    // Force an initial engine update
    Matter.Engine.update(engineRef.current, runner.delta);

    // Optimize engine settings for better performance
    engineRef.current.world.gravity.scale = 0.001;
    engineRef.current.timing.timeScale = 1.0;
    
    // Reduce solver iterations while maintaining stability
    engineRef.current.positionIterations = 6;
    engineRef.current.velocityIterations = 4;
    engineRef.current.constraintIterations = 2;

    // Add performance optimizations for the physics bodies
    const createOptimizedWalls = () => [
      // Bottom wall
      Matter.Bodies.rectangle(width / 2, height + 25, width + 20, 50, {
        isStatic: true,
        friction: 0.001,         // Reduced from 0.01 to 0.001
        frictionStatic: 0.001,   // Reduced from 0.01 to 0.001
        restitution: 0.5,
        slop: 0.05,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      }),
      // Left wall
      Matter.Bodies.rectangle(-10, height / 2, 20, height + 20, {
        isStatic: true,
        friction: 0.001,         // Reduced from 0.05 to 0.001
        restitution: 0.4,
        slop: 0.05,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      }),
      // Right wall
      Matter.Bodies.rectangle(width + 10, height / 2, 20, height + 20, {
        isStatic: true,
        friction: 0.001,         // Reduced from 0.05 to 0.001
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

        // Void ball collision handling
        if (bodyA.hasBeenDropped && bodyB.hasBeenDropped) {
          const voidBall = bodyA.isVoidBall ? bodyA : (bodyB.isVoidBall ? bodyB : null);
          const targetBall = bodyA.isVoidBall ? bodyB : (bodyB.isVoidBall ? bodyA : null);

          if (voidBall && targetBall && !targetBall.isVoidBall) {
            console.log('Void ball collision detected');
            console.log('Void ball deletions remaining:', voidBall.deletionsRemaining);
            
            if (typeof voidBall.deletionsRemaining === 'number' && voidBall.deletionsRemaining > 0) {
              Matter.Composite.remove(engineRef.current.world, targetBall);
              voidBall.deletionsRemaining--;
              console.log('Deletions remaining after collision:', voidBall.deletionsRemaining);
              
              Matter.Body.setVelocity(voidBall, {
                x: voidBall.velocity.x * 0.8,
                y: Math.min(voidBall.velocity.y, -8)
              });
              
              if (voidBall.deletionsRemaining <= 0) {
                console.log('Removing void ball - no deletions remaining');
                setTimeout(() => {
                  if (engineRef.current) {
                    Matter.Composite.remove(engineRef.current.world, voidBall);
                  }
                }, 100);
              }
            }
            return;
          }
        }

        // Normal merge logic
        if (!bodyA.isVoidBall && !bodyB.isVoidBall &&
            bodyA.hasBeenDropped && bodyB.hasBeenDropped && 
            !bodyA.isMerging && !bodyB.isMerging) {
          const tierA = bodyA.tier;
          const tierB = bodyB.tier;

          if (tierA === tierB && tierA !== undefined && tierA < 12) {
            collisionQueue.push([bodyA, bodyB]);
            requestAnimationFrame(processCollisionQueue);
          }
        }
      });
    };

    // Listen for both collisionStart and collisionActive
    Matter.Events.on(engineRef.current, 'collisionStart', collisionHandler);
    Matter.Events.on(engineRef.current, 'collisionActive', collisionHandler);

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

    const POWER_UP_DURATION = 5000; // 5 seconds in milliseconds

    // Update the force interval to handle super heavy balls more effectively
    const forceInterval = setInterval(() => {
      if (engineRef.current) {
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        const currentTime = Date.now();

        bodies.forEach((body) => {
          const circle = body as CircleBody;
          if (circle.label?.startsWith('circle-') && circle.hasBeenDropped) {
            
            // Check if power-up is active
            if (circle.powerUpDropTime) {
              const elapsedTime = currentTime - circle.powerUpDropTime;
              
              if (elapsedTime > POWER_UP_DURATION) {
                // Reset physics properties
                Matter.Body.set(circle, {
                  density: 0.015,
                  friction: 0.1,
                  frictionAir: 0.001,
                  restitution: 0.5,
                  frictionStatic: 0.2,
                  slop: 0.05
                });
                circle.isHeavyBall = false;
                circle.powerUpDropTime = undefined;
                
                // Update appearance
                if (circle.render.sprite) {
                  const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
                  circle.render.sprite.texture = createCircleTexture(
                    visualConfig.color,
                    visualConfig.strokeColor,
                    visualConfig.glowColor,
                    (visualConfig.radius - 1) * 2
                  );
                }
              } 
              // Apply continuous forces while power-up is active
              else if (circle.isHeavyBall) {
                if (circle.velocity.y < 15) { // Add velocity cap
                  const activePowerUp = getActivePowerUp(powerUps);
                  if (activePowerUp?.id === 'ULTRA_HEAVY_BALL') {
                    Matter.Body.applyForce(circle, 
                      circle.position, 
                      { x: 0, y: 0.18 }
                    );
                    
                    // Add periodic sideways forces for more dynamic movement
                    if (Math.random() < 0.1) { // 10% chance each frame
                      Matter.Body.applyForce(circle,
                        circle.position,
                        { 
                          x: (Math.random() - 0.5) * 0.02,
                          y: 0
                        }
                      );
                    }
                  } else if (activePowerUp?.id === 'SUPER_HEAVY_BALL') {
                    Matter.Body.applyForce(circle, 
                      circle.position, 
                      { x: 0, y: 0.06 }
                    );
                    
                    // Add periodic sideways forces for more dynamic movement
                    if (Math.random() < 0.1) { // 10% chance each frame
                      Matter.Body.applyForce(circle,
                        circle.position,
                        { 
                          x: (Math.random() - 0.5) * 0.01,
                          y: 0
                        }
                      );
                    }
                  } else if (activePowerUp?.id === 'HEAVY_BALL') {
                    Matter.Body.applyForce(circle, 
                      circle.position, 
                      { x: 0, y: 0.02 }
                    );
                  }
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
  }, [containerRef, createCircle, mergeBodies, powerUps]);

  const prepareNextSpawn = useCallback((mouseX?: number) => {
    if (!renderRef.current) return;
    const { width } = renderRef.current.canvas;
    
    const circleRadius = CIRCLE_CONFIG[nextTier as keyof typeof CIRCLE_CONFIG].radius;
    const padding = circleRadius + 0.5;
    
    nextSpawnXRef.current = mouseX !== undefined ? 
      Math.max(padding, Math.min(width - padding, mouseX)) : 
      width / 2;
    
    // Create the next ball with current power-up state
    isCreatingDropBallRef.current = false;
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
      const padding = radius + 0.5;
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
    const padding = radius + 0.5;
    
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
    // Don't allow dropping while animating
    if (isAnimatingRef.current || !currentCircleRef.current || !engineRef.current || !renderRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    const activePowerUp = getActivePowerUp(powerUps);
    
    // Apply power-up properties here, before dropping
    if (activePowerUp) {
      if (activePowerUp.group === 'GRAVITY') {
        applyGravityPowerUp(circle, activePowerUp);
      } else if (activePowerUp.id === 'VOID_BALL') {
        // Apply void ball properties here instead of in createCircle
        circle.isVoidBall = true;
        circle.deletionsRemaining = 3;
        console.log('Applied void ball properties on drop:', circle.deletionsRemaining);
      }
      onPowerUpUse();
    }

    circle.hasBeenDropped = true;
    Matter.Sleeping.set(circle, false);
    
    Matter.Body.set(circle, {
      sleepThreshold: 60,
      timeScale: 1.0
    });
    
    // Calculate initial drop velocity
    const baseDropVelocity = engineRef.current.gravity.y * (engineRef.current.timing.timeScale * 0.5);
    const initialDropVelocity = activePowerUp?.id === 'ULTRA_HEAVY_BALL'
      ? baseDropVelocity * 100
      : activePowerUp?.id === 'SUPER_HEAVY_BALL'
        ? baseDropVelocity * 50
        : activePowerUp?.id === 'HEAVY_BALL'
          ? baseDropVelocity * 20
          : baseDropVelocity;
    
    // Set initial velocity based on power-up type
    if (activePowerUp?.id === 'VOID_BALL') {
      const horizontalVelocity = (Math.random() - 0.5) * 8;
      const initialVelocity = activePowerUp.effects?.initialSpeed || 8;
      Matter.Body.setVelocity(circle, {
        x: horizontalVelocity,
        y: initialVelocity
      });
    } else {
      Matter.Body.setVelocity(circle, {
        x: 0,
        y: initialDropVelocity
      });
    }
    
    // Add immediate force based on power-up
    if (activePowerUp?.id === 'ULTRA_HEAVY_BALL') {
      Matter.Body.applyForce(circle, 
        circle.position, 
        { x: 0, y: 0.5 }
      );
    } else if (activePowerUp?.id === 'SUPER_HEAVY_BALL') {
      Matter.Body.applyForce(circle, 
        circle.position, 
        { x: 0, y: 0.2 }
      );
    } else if (activePowerUp?.id === 'HEAVY_BALL') {
      Matter.Body.applyForce(circle, 
        circle.position, 
        { x: 0, y: 0.05 }
      );
    }
    
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
    
    // Call prepareNextSpawn before bounce behavior
    prepareNextSpawn(mouseX);

    // Special handling for void ball bounce behavior
    if (activePowerUp?.id === 'VOID_BALL') {
      const addBounceForce = () => {
        if (circle && !circle.isMerging && circle.deletionsRemaining && circle.deletionsRemaining > 0) {
          Matter.Body.applyForce(circle, 
            circle.position, 
            { 
              x: (Math.random() - 0.5) * 0.02,
              y: -(activePowerUp.effects?.bounceForce || 0.03) - (Math.random() * 0.02)
            }
          );
        }
      };

      const bounceInterval = setInterval(() => {
        if (circle && !circle.isMerging && circle.deletionsRemaining && circle.deletionsRemaining > 0) {
          addBounceForce();
        } else {
          clearInterval(bounceInterval);
        }
      }, 300);

      setTimeout(() => clearInterval(bounceInterval), 10000);
    }
  }, [onDrop, prepareNextSpawn, powerUps, onPowerUpUse, getActivePowerUp, applyGravityPowerUp]);

  // Add new stress test function
  const spawnStressTestBalls = useCallback((count: number = 50) => {
    if (!renderRef.current || !engineRef.current) return;
    
    const { width, height } = renderRef.current.canvas;
    const spawnHeight = height * 0.2; // Spawn in top 20% of container
    
    // Spawn balls with slight delay to prevent instant physics overload
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Random position and tier
        const x = Math.random() * (width * 0.8) + (width * 0.1); // Keep away from walls
        const y = Math.random() * spawnHeight;
        const tier = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        
        const circle = createCircle(tier, x, y);
        if (circle) {
          circle.hasBeenDropped = true;
          // Add random initial velocity
          Matter.Body.setVelocity(circle, {
            x: (Math.random() - 0.5) * 2,
            y: Math.random() * 2
          });
        }
      }, i * 50); // 50ms delay between spawns
    }
  }, [createCircle]);

  // Add function to update danger zone appearance
  const updateDangerZoneAppearance = useCallback((isActive: boolean, timeRemaining: number) => {
    if (!dangerZoneRef.current || !renderRef.current) return;

    const zone = dangerZoneRef.current;
    zone.isActive = isActive;
    zone.timeRemaining = timeRemaining;

    // Update the danger zone's appearance
    zone.render.fillStyle = isActive 
      ? `rgba(255, 0, 0, ${0.1 + (0.2 * (1 - timeRemaining / DANGER_ZONE_TIMEOUT))})`
      : 'rgba(75, 85, 99, 0.1)'; // grey when inactive
    zone.render.strokeStyle = isActive
      ? `rgba(255, 0, 0, ${0.3 + (0.4 * (1 - timeRemaining / DANGER_ZONE_TIMEOUT))})`
      : 'rgba(75, 85, 99, 0.3)'; // grey when inactive
  }, []);

  // Modify the effect that creates the danger zone
  useEffect(() => {
    if (!containerRef.current || !renderRef.current || !engineRef.current) return;

    const { width } = containerRef.current.getBoundingClientRect();
    
    // Create danger zone without visualTimer
    const dangerZone = Matter.Bodies.rectangle(
      width / 2,
      DANGER_ZONE_HEIGHT / 2,
      width,
      DANGER_ZONE_HEIGHT,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: 'rgba(75, 85, 99, 0.1)', // Start with grey
          strokeStyle: 'rgba(75, 85, 99, 0.3)',
          lineWidth: 2
        },
        label: 'danger-zone'
      }
    ) as DangerZone;

    dangerZone.isActive = false;
    dangerZone.timeRemaining = DANGER_ZONE_TIMEOUT;
    dangerZoneRef.current = dangerZone;

    // Add afterRender event to draw the timer
    const renderTimer = () => {
      if (!renderRef.current || !dangerZone.isActive || dangerZone.timeRemaining <= 0) return;
      
      const ctx = renderRef.current.context as CanvasRenderingContext2D;
      const timePercent = dangerZone.timeRemaining / DANGER_ZONE_TIMEOUT;
      
      // Draw timer background
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(10, 10, 60, 20);
      
      // Draw timer bar
      ctx.fillStyle = dangerZone.isActive 
        ? `rgba(255, ${Math.floor(255 * timePercent)}, 0, 0.8)`
        : 'rgba(75, 85, 99, 0.8)';
      ctx.fillRect(12, 12, 56 * timePercent, 16);
      
      // Draw timer text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${(dangerZone.timeRemaining / 1000).toFixed(1)}s`,
        40,
        24
      );
      ctx.restore();
    };

    // Add the render event listener
    Matter.Events.on(renderRef.current, 'afterRender', renderTimer);

    Matter.Composite.add(engineRef.current.world, dangerZone);

    return () => {
      if (engineRef.current && dangerZoneRef.current) {
        if (renderRef.current) {
          Matter.Events.off(renderRef.current, 'afterRender', renderTimer);
        }
        Matter.Composite.remove(engineRef.current.world, dangerZoneRef.current);
      }
    };
  }, []);

  // Modify the danger zone collision detection
  useEffect(() => {
    if (!engineRef.current || !dangerZoneRef.current) return;

    const checkDangerZone = () => {
      const currentTime = Date.now();
      const bodies = Matter.Composite.allBodies(engineRef.current!.world);
      let isAnyCircleInDanger = false;
      let minTimeRemaining = DANGER_ZONE_TIMEOUT;
      
      bodies.forEach(body => {
        const circle = body as CircleBody;
        
        if (!circle.label?.startsWith('circle-') || !circle.hasBeenDropped) return;
        
        // Check if circle has been in play long enough
        if (!circle.spawnTime || currentTime - circle.spawnTime < DANGER_ZONE_GRACE_PERIOD) return;

        const isInDangerZone = circle.position.y < DANGER_ZONE_HEIGHT;
        
        if (isInDangerZone && !circle.inDangerZone) {
          circle.inDangerZone = true;
          circle.dangerZoneStartTime = currentTime;
        } else if (!isInDangerZone && circle.inDangerZone) {
          circle.inDangerZone = false;
          circle.dangerZoneStartTime = undefined;
        } else if (isInDangerZone && circle.inDangerZone && circle.dangerZoneStartTime) {
          const timeInZone = currentTime - circle.dangerZoneStartTime;
          const timeRemaining = DANGER_ZONE_TIMEOUT - timeInZone;
          
          if (timeRemaining <= 0) {
            onGameOver();
            Matter.Events.off(engineRef.current!, 'beforeUpdate', checkDangerZone);
            return;
          }
          
          isAnyCircleInDanger = true;
          minTimeRemaining = Math.min(minTimeRemaining, timeRemaining);
        }
      });

      // Update danger zone appearance
      updateDangerZoneAppearance(
        isAnyCircleInDanger,
        isAnyCircleInDanger ? minTimeRemaining : DANGER_ZONE_TIMEOUT
      );
    };

    Matter.Events.on(engineRef.current, 'beforeUpdate', checkDangerZone);

    return () => {
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'beforeUpdate', checkDangerZone);
      }
    };
  }, [onGameOver, updateDangerZoneAppearance]);

  return {
    engine: engineRef.current,
    startDrag,
    updateDrag,
    endDrag,
    spawnStressTestBalls,
    currentBall: currentCircleRef.current as CircleBody | null
  };
}; 

// Add this helper function for color interpolation
const interpolateColor = (color1: string, color2: string, progress: number) => {
  // Simple color interpolation for hex colors
  if (color1.startsWith('#') && color2.startsWith('#')) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return color1; // Fallback to original color if not hex
}; 