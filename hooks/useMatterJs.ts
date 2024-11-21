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
    gravity: { y: 1.5 },
    positionIterations: 16,
    velocityIterations: 12,
    constraintIterations: 6,
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
  const ANIMATION_DURATION = 200; // Reduced from 300ms to 200ms for initial drop
  const MERGE_ANIMATION_DURATION = 150; // Reduced from 200ms to 150ms for merging

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
    const baseDensity = 0.001;
    
    // Calculate density multiplier based on tier
    let densityMultiplier;
    if (tier <= 4) {
      densityMultiplier = Math.pow(0.85, tier - 1);
    } else {
      densityMultiplier = Math.pow(0.85, 3) * Math.pow(0.6, tier - 4);
    }
    
    const collisionRadius = config.radius;
    const visualRadius = collisionRadius - 1;
    
    // Create circle texture with glow
    const texture = createCircleTexture(
      config.color,
      config.strokeColor,
      config.color.replace('0.1', '0.3'),
      visualRadius * 2
    );
    
    const circle = Matter.Bodies.circle(x, y, collisionRadius, {
      restitution: 0.5,
      friction: 0.01,
      density: baseDensity * densityMultiplier,
      frictionAir: 0.0005,
      frictionStatic: 0.05,
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
    return circle;
  }, []);

  const mergeBodies = useCallback((bodyA: CircleBody, bodyB: CircleBody) => {
    if (!engineRef.current || !renderRef.current) return;

    // Prevent merging if either body is already merging
    if (bodyA.isMerging || bodyB.isMerging) return;
    
    // Mark both bodies as merging to prevent multiple merges
    bodyA.isMerging = true;
    bodyB.isMerging = true;

    const startPosA = { x: bodyA.position.x, y: bodyA.position.y };
    const startPosB = { x: bodyB.position.x, y: bodyB.position.y };
    const midX = (startPosA.x + startPosB.x) / 2;
    const midY = (startPosA.y + startPosB.y) / 2;

    // Make both circles static during animation
    Matter.Body.setStatic(bodyA, true);
    Matter.Body.setStatic(bodyB, true);

    // Store original scales
    const originalScale = 1;
    const targetScale = 1.15; // Slightly reduced from 1.2 for snappier feel

    const startTime = performance.now();

    const animateMerge = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / MERGE_ANIMATION_DURATION, 1);

      // Easing function for smooth animation
      const easeInOutQuad = (t: number) => 
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      const easedProgress = easeInOutQuad(progress);

      // First half of animation: move circles together and scale up
      if (progress <= 0.5) {
        const halfProgress = easedProgress * 2;
        
        // Move circles towards center
        Matter.Body.setPosition(bodyA, {
          x: startPosA.x + (midX - startPosA.x) * halfProgress,
          y: startPosA.y + (midY - startPosA.y) * halfProgress
        });
        
        Matter.Body.setPosition(bodyB, {
          x: startPosB.x + (midX - startPosB.x) * halfProgress,
          y: startPosB.y + (midY - startPosB.y) * halfProgress
        });

        // Scale up
        const scale = originalScale + (targetScale - originalScale) * halfProgress;
        if (bodyA.render.sprite) bodyA.render.sprite.xScale = bodyA.render.sprite.yScale = scale;
        if (bodyB.render.sprite) bodyB.render.sprite.xScale = bodyB.render.sprite.yScale = scale;
      }

      if (progress < 1) {
        requestAnimationFrame(animateMerge);
      } else {
        // Animation complete - create new merged circle
        Matter.Composite.remove(engineRef.current.world, bodyA);
        Matter.Composite.remove(engineRef.current.world, bodyB);

        const newTier = Math.min((bodyA.tier || 1) + 1, 12) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
        const newCircle = createCircle(newTier, midX, midY);
        
        if (newCircle) {
          // Set the new circle as dropped immediately
          (newCircle as CircleBody).hasBeenDropped = true;
          
          // Start with larger scale and animate down
          if (newCircle.render.sprite) {
            newCircle.render.sprite.xScale = newCircle.render.sprite.yScale = targetScale;
          }

          // Animate the new circle scaling down to normal size
          const scaleDownStart = performance.now();
          const scaleDownDuration = 100; // Reduced from 150ms to 100ms

          const animateScaleDown = (currentTime: number) => {
            const scaleProgress = Math.min((currentTime - scaleDownStart) / scaleDownDuration, 1);
            const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
            const easedScaleProgress = easeOutQuad(scaleProgress);
            
            if (newCircle.render.sprite) {
              const scale = targetScale + (1 - targetScale) * easedScaleProgress;
              newCircle.render.sprite.xScale = newCircle.render.sprite.yScale = scale;
            }

            if (scaleProgress < 1) {
              requestAnimationFrame(animateScaleDown);
            } else {
              // Give a small upward boost after scaling down
              Matter.Body.setVelocity(newCircle, {
                x: 0,
                y: -2.5 // Slightly increased from -2 for snappier bounce
              });
            }
          };

          requestAnimationFrame(animateScaleDown);
        }
        
        onNewTier(newTier);
      }
    };

    requestAnimationFrame(animateMerge);
  }, [createCircle, onNewTier]);

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

    const walls = [
      dangerZone,
      Matter.Bodies.rectangle(width / 2, height + 25, width + 60, 50, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.4,
        slop: 0.01,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      }),
      // Left wall - moved slightly left and taller
      Matter.Bodies.rectangle(-25, height / 2, 50, height + 60, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.4,
        slop: 0.01,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      }),
      // Right wall - moved slightly right and taller
      Matter.Bodies.rectangle(width + 25, height / 2, 50, height + 60, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.4,
        slop: 0.01,
        chamfer: { radius: 2 },
        render: { 
          fillStyle: '#27272a'
        }
      })
    ];

    Matter.Composite.add(engineRef.current.world, walls);

    // Update engine settings
    engineRef.current.world.gravity.scale = 0.001;
    engineRef.current.timing.timeScale = 1.0;
    
    // Increase solver iterations for better physics
    engineRef.current.positionIterations = 12;
    engineRef.current.velocityIterations = 8;
    engineRef.current.constraintIterations = 4;

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
    // Only process endDrag if we're actually dragging and not animating
    if (!isDraggingRef.current || isAnimatingRef.current) return;
    
    if (!currentCircleRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    circle.hasBeenDropped = true;
    
    // Calculate the initial drop velocity based on the gravity and animation
    const initialDropVelocity = engineRef.current.gravity.y * (engineRef.current.timing.timeScale * 0.5);
    
    // Set initial velocity to match animation
    Matter.Body.setVelocity(circle, {
      x: 0,
      y: initialDropVelocity
    });
    
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