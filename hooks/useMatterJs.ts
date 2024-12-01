import { useEffect, useRef, useCallback, useMemo } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG } from '@/types/game';
import type { PowerUp, PowerUpState } from '@/types/powerups';
import { POWER_UPS, POWER_UP_CONFIG } from '@/types/powerups';
import type { TierType } from '@/types/game';
import type { FlaskState } from '@/types/flasks';
import { FLASKS } from '@/types/flasks';

const OBJECT_POOL_SIZE = 50;

interface ObjectPool {
  circles: CircleBody[];
  maxSize: number;
}

interface MatterBody extends Matter.Body {
  events?: Record<string, any>;
  constraints?: Matter.Constraint[];
  parts: Matter.Body[];
}

interface CircleBody extends MatterBody {
  tier?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  hasBeenDropped?: boolean;
  isMerging?: boolean;
  isHeavyBall?: boolean;
  isVoidBall?: boolean;
  isSuperVoid?: boolean;
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

interface ExtendedBodyDefinition extends Matter.IBodyDefinition {
  chamfer?: {
    radius: number;
  };
}

interface CollisionPair extends Matter.Pair {
  isActive: boolean;
  restitution: number;
  friction: number;
  bodyA: CircleBody;
  bodyB: CircleBody;
}

// Add this debug helper at the top of the file
const logWorldState = (engine: Matter.Engine, context: string) => {
  const bodies = Matter.Composite.allBodies(engine.world);
  const activeCircles = bodies.filter(b => b.label?.startsWith('circle-'));
  const staticBodies = bodies.filter(b => b.isStatic);
  const otherBodies = bodies.filter(b => !b.label?.startsWith('circle-') && !b.isStatic);
  
  console.log(`=== World State (${context}) ===`);
  console.log(`Total bodies: ${bodies.length}`);
  console.log(`Active circles: ${activeCircles.length}`);
  console.log(`Static bodies: ${staticBodies.length}`);
  console.log(`Other bodies: ${otherBodies.length}`);
  console.log(`Constraints: ${engine.world.constraints.length}`);
  console.log(`Composites: ${engine.world.composites.length}`);
  if (otherBodies.length > 0) {
    console.log('Other bodies labels:', otherBodies.map(b => b.label));
  }
};

// Add these helper functions near the top of the file
const isMobileDevice = () => {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(userAgent);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  return isMobileUA || isSmallScreen;
};

export const useMatterJs = (
  containerRef: React.RefObject<HTMLDivElement>, 
  onDrop: () => void,
  onNewTier: (tier: number) => void,
  nextTier: number,
  powerUps: PowerUpState,
  onPowerUpUse: () => void,
  onGameOver: () => void,
  flaskState: FlaskState,
  onPowerUpEarned?: (level: 1 | 2 | 3) => void
) => {
  // Add device detection
  const isMobile = useMemo(() => isMobileDevice(), []);

  // Update engine creation with increased speed for mobile
  const engineRef = useRef(Matter.Engine.create({ 
    gravity: { y: isMobile ? 4.66 : 1.75 }, // Increased from 3.5 to 4.66 (~33% faster)
    positionIterations: 8,
    velocityIterations: 6,
    constraintIterations: 3,
    enableSleeping: true,
    timing: {
      timeScale: isMobile ? 2.4 : 0.9, // Increased from 1.8 to 2.4 (~33% faster)
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

  // Add FPS tracking refs
  const fpsRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const FPS_UPDATE_INTERVAL = 500; // Update FPS every 500ms

  // Add FPS calculation effect
  useEffect(() => {
    const calculateFPS = () => {
      const currentTime = Date.now();
      frameCountRef.current++;

      if (currentTime - lastTimeRef.current >= FPS_UPDATE_INTERVAL) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        console.log(`FPS: ${fpsRef.current}`);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
    };

    Matter.Events.on(engineRef.current!, 'afterUpdate', calculateFPS);

    return () => {
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'afterUpdate', calculateFPS);
      }
    };
  }, []);

  // Add performance optimizations
  useEffect(() => {
    if (!engineRef.current) return;

    // Optimize collision broadphase
    const grid = Matter.Grid.create();
    const gridOptions = {
      bucketWidth: 80,
      bucketHeight: 80
    };
    
    engineRef.current.grid = grid;
    Object.assign(engineRef.current.grid, gridOptions);

    // Enable body sleeping for static bodies
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(body => {
      if (body.isStatic) {
        body.isSleeping = true;
      }
    });
  }, []);

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

  // Add helper function to apply void power-up properties
  const applyVoidPowerUp = useCallback((circle: CircleBody, powerUp: PowerUp) => {
    if (!circle) return;
    
    circle.isVoidBall = true;
    circle.isSuperVoid = powerUp.level > 1;
    
    let config;
    if (powerUp.id === 'SUPER_VOID_BALL') {
      config = POWER_UP_CONFIG.VOID.SUPER;
    } else if (powerUp.id === 'ULTRA_VOID_BALL') {
      config = POWER_UP_CONFIG.VOID.ULTRA;
    } else {
      config = POWER_UP_CONFIG.VOID.BASIC;
    }
    
    circle.deletionsRemaining = config.DELETIONS;
    
    // Apply physics properties
    Matter.Body.set(circle, {
      density: powerUp.physics.density || circle.density,
      friction: powerUp.physics.friction || circle.friction,
      frictionAir: powerUp.physics.frictionAir || circle.frictionAir,
      restitution: powerUp.physics.restitution || circle.restitution,
      frictionStatic: powerUp.physics.frictionStatic || circle.frictionStatic
    });
  }, []);

  // Update createCircle to apply flask physics
  const createCircle = useCallback((
    tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    x: number,
    y: number
  ) => {
    if (!renderRef.current || !engineRef.current) return null;

    const visualConfig = CIRCLE_CONFIG[tier];
    const collisionRadius = visualConfig.radius;
    const visualRadius = collisionRadius - 1;
    
    // Create texture with default visuals (no power-up effects)
    const texture = createCircleTexture(
      visualConfig.color,
      visualConfig.strokeColor,
      visualConfig.glowColor,
      visualRadius * 2
    );

    // Get active flask and its physics properties
    const activeFlask = flaskState.activeFlaskId ? FLASKS[flaskState.activeFlaskId] : null;
    
    // Set up options including flask physics if active
    const circleOptions: ExtendedBodyDefinition = {
      density: tier === 1 ? 0.025 : 0.02,
      friction: activeFlask?.physics.friction ?? (isMobile ? 0.013 : 0.005), // Increased from 0.01
      frictionAir: activeFlask?.physics.frictionAir ?? (isMobile ? 0.00053 : 0.0002), // Increased from 0.0004
      restitution: activeFlask?.physics.restitution ?? 0.3,
      frictionStatic: isMobile ? 0.053 : 0.02, // Increased from 0.04
      slop: isMobile ? 0.053 : 0.02, // Increased from 0.04
      sleepThreshold: tier >= 10 ? 30 : (tier >= 8 ? 60 : Infinity),
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
    };

    // Add chamfer for larger circles
    if (tier >= 8) {
      circleOptions.chamfer = { radius: collisionRadius * 0.1 };
    }

    // Create circle with all options
    const circle = Matter.Bodies.circle(x, y, collisionRadius, circleOptions) as CircleBody;

    // Set basic circle properties
    circle.isMerging = false;
    circle.tier = tier;
    circle.hasBeenDropped = false;
    circle.spawnTime = Date.now();
    circle.inDangerZone = false;
    
    Matter.Body.setStatic(circle, false);
    Matter.Body.set(circle, {
      torque: 0,
      angularSpeed: 0,
      angularVelocity: 0
    });

    // Cache bounds for larger circles
    if (tier >= 8) {
      circle.bounds = Matter.Bounds.create([
        { x: x - collisionRadius, y: y - collisionRadius },
        { x: x + collisionRadius, y: y + collisionRadius }
      ]);
    }

    // Add to world after all properties are set
    Matter.Composite.add(engineRef.current.world, circle);
    
    return circle;
  }, [flaskState.activeFlaskId, isMobile]);

  // Add a ref to track wall bodies
  const wallBodiesRef = useRef<Matter.Body[]>([]);

  // Define cleanupBody first
  const cleanupBody = useCallback((body: CircleBody | Matter.Body) => {
    if (!engineRef.current) return;
    
    // Skip if body is already removed or is danger zone
    if (!Matter.Composite.get(engineRef.current.world, body.id, body.type) ||
        body.label === 'danger-zone') {
        console.log('Body already removed or is danger zone:', body.label);
        return;
    }
    
    console.log(`Cleaning up body: ${body.label}`);
    logWorldState(engineRef.current, 'Before cleanup');
    
    // Remove from any composites first
    engineRef.current.world.composites.forEach(composite => {
      Matter.Composite.remove(composite, body);
    });
    
    // Remove from world
    Matter.World.remove(engineRef.current.world, body, true); // true forces immediate removal
    
    // Only clean up circle-specific properties if it's a circle
    if (body.label?.startsWith('circle-')) {
      const circleBody = body as CircleBody;
      // Store reference to sprite texture before nullifying
      const spriteTexture = circleBody.render.sprite?.texture;
      
      // Clear all properties first
      Object.keys(circleBody).forEach(key => {
        (circleBody as any)[key] = null;
      });
      
      // Then clean up texture if it exists
      if (spriteTexture) {
        URL.revokeObjectURL(spriteTexture);
      }
    }
    
    // For static bodies (walls)
    if (body.isStatic) {
      // Remove from wallBodiesRef if it's there
      if (wallBodiesRef.current) {
        const index = wallBodiesRef.current.indexOf(body);
        if (index > -1) {
          wallBodiesRef.current.splice(index, 1);
        }
      }
    }
    
    logWorldState(engineRef.current, 'After cleanup');
  }, []);

  // Then define createOptimizedWalls
  const createOptimizedWalls = useCallback(() => {
    if (!renderRef.current || !engineRef.current) return [];

    // Remove existing walls first
    const existingWalls = Matter.Composite.allBodies(engineRef.current.world)
        .filter(body => body.isStatic && body.label?.includes('wall-'));
    
    console.log('Removing existing walls:', existingWalls.map(w => w.label));
    existingWalls.forEach(wall => {
        Matter.Composite.remove(engineRef.current!.world, wall);
    });
    
    const { width, height } = renderRef.current.canvas;
    const wallThickness = 60;
    const wallOptions = {
        isStatic: true,
        restitution: 0.5,
        friction: 0.0,
        frictionStatic: 0.0,
        collisionFilter: {
            category: 0x0004,
            mask: 0xFFFFFFFF
        },
        render: {
            visible: false
        }
    };

    const walls = [
        Matter.Bodies.rectangle(width / 2, height + (wallThickness / 2), width, wallThickness, {
            ...wallOptions,
            label: 'wall-bottom'
        }),
        Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
            ...wallOptions,
            label: 'wall-left'
        }),
        Matter.Bodies.rectangle(width + (wallThickness / 2), height / 2, wallThickness, height * 2, {
            ...wallOptions,
            label: 'wall-right'
        })
    ];

    // Store new walls reference
    wallBodiesRef.current = walls;
    
    console.log('Created new walls:', walls.map(w => w.label));
    return walls;
  }, []);

  // Add cleanup for walls in component unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        console.log('Starting cleanup...');
        
        // Clean up all circle bodies
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        bodies.forEach(body => {
          cleanupBody(body);
        });

        // Clean up walls specifically
        if (wallBodiesRef.current) {
          wallBodiesRef.current.forEach(wall => {
            Matter.Composite.remove(engineRef.current!.world, wall);
          });
          wallBodiesRef.current = [];
        }

        // Clean up danger zone
        if (dangerZoneRef.current) {
          Matter.Composite.remove(engineRef.current.world, dangerZoneRef.current);
          dangerZoneRef.current = null;
        }

        console.log('Clearing engine...');
        Matter.Engine.clear(engineRef.current);
        
        // Clear all refs
        renderRef.current = null;
        runnerRef.current = null;
        currentCircleRef.current = null;
        objectPoolRef.current = null;
        
        console.log('Cleanup complete');
        logWorldState(engineRef.current, 'After complete cleanup');
      }
    };
  }, [cleanupBody]);

  // Add periodic garbage collection
  useEffect(() => {
    const gcInterval = setInterval(() => {
      if (engineRef.current) {
        logWorldState(engineRef.current, 'Before GC');
        
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        const canvas = renderRef.current?.canvas;
        
        bodies.forEach(body => {
          const circle = body as CircleBody;
          // Clean up bodies that are far off screen
          if (canvas && (
            circle.position.y > canvas.height + 200 || // Too far below
            circle.position.y < -200 || // Too far above
            circle.position.x < -200 || // Too far left
            circle.position.x > canvas.width + 200 // Too far right
          )) {
            cleanupBody(circle);
          }
        });
        
        logWorldState(engineRef.current, 'After GC');
      }
    }, 5000); // Run every 5 seconds

    return () => clearInterval(gcInterval);
  }, [cleanupBody]);

  // Add collision queue management
  const collisionQueueRef = useRef<Array<[CircleBody, CircleBody]>>([]);
  const isProcessingCollisionRef = useRef(false);

  // Update mergeBodies with additional safety checks
  const mergeBodies = useCallback((bodyA: CircleBody, bodyB: CircleBody) => {
    if (!engineRef.current || !renderRef.current) return;

    // Additional safety checks
    if (!bodyA?.position || !bodyB?.position) {
      console.log('Invalid bodies for merge:', { bodyA, bodyB });
      return;
    }

    // Verify bodies still exist in the world
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    if (!bodies.includes(bodyA) || !bodies.includes(bodyB)) {
      console.log('Bodies no longer in world');
      return;
    }

    console.log(`Merging bodies - A: Tier ${bodyA.tier}, B: Tier ${bodyB.tier}`);
    logWorldState(engineRef.current, 'Before merge');

    // Prevent merging if either body is already merging
    if (bodyA.isMerging || bodyB.isMerging) {
      console.log('Bodies already merging');
      return;
    }

    // Calculate midpoint BEFORE cleaning up bodies
    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;
    const newTier = Math.min((bodyA.tier || 1) + 1, 12) as TierType;
    
    // Mark as merging to prevent multiple merges
    bodyA.isMerging = true;
    bodyB.isMerging = true;

    // Store current power-up state
    const currentPowerUpId = powerUps.activePowerUpId;
    
    // Temporarily clear active power-up to prevent it from being applied to merged ball
    powerUps.activePowerUpId = null;
    
    // Clean up old bodies AFTER calculating new position
    cleanupBody(bodyA);
    cleanupBody(bodyB);
    
    // Create new merged circle
    const newCircle = createCircle(newTier, midX, midY);
    
    // Restore original power-up state
    powerUps.activePowerUpId = currentPowerUpId;
    
    if (newCircle) {
      console.log(`Created new merged circle: Tier ${newTier}`);
      (newCircle as CircleBody).hasBeenDropped = true;
      
      // Reduce the upward boost and add slight random horizontal movement
      const randomHorizontal = (Math.random() - 0.5) * 0.5;
      Matter.Body.setVelocity(newCircle, { 
        x: randomHorizontal, 
        y: -1.5  // Reduced from -2.5
      });
      
      // Add a small delay before enabling collisions
      setTimeout(() => {
        if (newCircle && !newCircle.isMerging) {
          Matter.Body.set(newCircle, {
            isSleeping: false,
            collisionFilter: {
              group: 0,
              category: 0x0001,
              mask: 0xFFFFFFFF
            }
          });
        }
      }, 50);

      // Handle power-up rewards
      if (newTier === 5) {
        // Reward basic power-ups (one of each in the basic tier)
        Object.entries(POWER_UPS).forEach(([id, powerUp]) => {
          if (powerUp.level === 1) {
            powerUps.powerUps[id] = Math.min(
              (powerUps.powerUps[id] || 0) + 1,
              powerUp.maxUses
            );
          }
        });
        onPowerUpEarned?.(1);  // Basic power-ups earned
      } else if (newTier === 6) {
        // Reward super power-ups
        Object.entries(POWER_UPS).forEach(([id, powerUp]) => {
          if (powerUp.level === 2) {
            powerUps.powerUps[id] = Math.min(
              (powerUps.powerUps[id] || 0) + 1,
              powerUp.maxUses
            );
          }
        });
        onPowerUpEarned?.(2);  // Super power-ups earned
      } else if (newTier === 7) {
        // Reward ultra power-ups
        Object.entries(POWER_UPS).forEach(([id, powerUp]) => {
          if (powerUp.level === 3) {
            powerUps.powerUps[id] = Math.min(
              (powerUps.powerUps[id] || 0) + 1,
              powerUp.maxUses
            );
          }
        });
        onPowerUpEarned?.(3);  // Ultra power-ups earned
      }
    }

    onNewTier(newTier);
    logWorldState(engineRef.current, 'After merge');
  }, [createCircle, onNewTier, powerUps, onPowerUpEarned, cleanupBody]);

  // Update collision handling
  const processCollisionQueue = useCallback(() => {
    if (isProcessingCollisionRef.current || !collisionQueueRef.current.length) return;
    
    isProcessingCollisionRef.current = true;
    
    while (collisionQueueRef.current.length > 0) {
      const [bodyA, bodyB] = collisionQueueRef.current[0];
      
      // Safety check that bodies still exist and are valid
      if (bodyA?.position && bodyB?.position && 
          !bodyA.isMerging && !bodyB.isMerging && 
          engineRef.current) {
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        if (bodies.includes(bodyA) && bodies.includes(bodyB)) {
          mergeBodies(bodyA, bodyB);
        }
      }
      
      collisionQueueRef.current.shift();
    }
    
    isProcessingCollisionRef.current = false;
  }, [mergeBodies]);

  // Update collision handler
  const collisionHandler = useCallback((event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach((pair) => {
      const bodyA = pair.bodyA as CircleBody;
      const bodyB = pair.bodyB as CircleBody;
      
      if (!bodyA?.label?.startsWith('circle-') || !bodyB?.label?.startsWith('circle-')) {
        return;
      }

      // Normal merge logic (only if neither ball is a void ball)
      if (!bodyA.isVoidBall && !bodyB.isVoidBall &&
          bodyA.hasBeenDropped && bodyB.hasBeenDropped && 
          !bodyA.isMerging && !bodyB.isMerging) {
        const tierA = bodyA.tier;
        const tierB = bodyB.tier;

        if (tierA === tierB && tierA !== undefined && tierA < 12) {
          // Add to queue instead of processing immediately
          collisionQueueRef.current.push([bodyA, bodyB]);
          requestAnimationFrame(processCollisionQueue);
        }
      }
    });
  }, [processCollisionQueue]);

  // Update collision effect
  useEffect(() => {
    if (!engineRef.current) return;

    Matter.Events.on(engineRef.current, 'collisionStart', collisionHandler);

    return () => {
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'collisionStart', collisionHandler);
      }
    };
  }, [collisionHandler]);

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
                const duration = activePowerUp.effects?.duration || POWER_UP_CONFIG.GRAVITY.HEAVY.DURATION;
                
                if (elapsedTime > duration) {
                  // Reset physics properties to defaults
                  Matter.Body.set(circle, {
                    density: POWER_UP_CONFIG.GRAVITY.HEAVY.DENSITY,
                    friction: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION,
                    frictionAir: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_AIR,
                    restitution: POWER_UP_CONFIG.GRAVITY.HEAVY.RESTITUTION,
                    frictionStatic: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_STATIC
                  });
                  circle.isHeavyBall = false;
                  circle.powerUpDropTime = undefined;
                  circle.powerUpStats = undefined;
                } else {
                  // Apply constant force if velocity is below cap
                  if (circle.velocity.y < 30) { // Increased velocity cap
                    const force = activePowerUp.effects?.constantForce || POWER_UP_CONFIG.GRAVITY.HEAVY.CONSTANT_FORCE;
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
    }, 16); // Keep at 60fps

    return () => clearInterval(forceInterval);
  }, [powerUps, getActivePowerUp]);

  useEffect(() => {
    if (!containerRef.current || !engineRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();

    renderRef.current = Matter.Render.create({
      element: containerRef.current,
      engine: engineRef.current,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent'
      }
    });

    // Add collision handling for walls
    Matter.Events.on(engineRef.current, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as CircleBody;
        const bodyB = pair.bodyB as CircleBody;
        
        // Check if either body is a super void ball
        const superVoidBall = bodyA.isSuperVoid ? bodyA : (bodyB.isSuperVoid ? bodyB : null);
        const wall = bodyA.isStatic ? bodyA : (bodyB.isStatic ? bodyB : null);
        
        if (superVoidBall && wall) {
          // If it hits the bottom wall, remove it
          if (wall.position.y > height - 100) {
            if (engineRef.current) {
              Matter.Composite.remove(engineRef.current.world, superVoidBall);
            }
          } else {
            // For side walls, maintain vertical velocity and zero out horizontal
            Matter.Body.setVelocity(superVoidBall, {
              x: 0,
              y: POWER_UP_CONFIG.VOID.SUPER.INITIAL_SPEED
            });
          }
        }
      });
    });

    // Add continuous collision handling for walls
    Matter.Events.on(engineRef.current, 'collisionActive', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as CircleBody;
        const bodyB = pair.bodyB as CircleBody;
        
        // Check if either body is a super/ultra void ball
        const voidBall = (bodyA.isVoidBall && bodyA.isSuperVoid) ? bodyA : 
                         ((bodyB.isVoidBall && bodyB.isSuperVoid) ? bodyB : null);
        const wall = bodyA.isStatic ? bodyA : (bodyB.isStatic ? bodyB : null);
        
        if (voidBall && wall) {
          // Maintain vertical velocity during wall contact
          const speed = voidBall.deletionsRemaining && voidBall.deletionsRemaining > 0 ? 
            (voidBall.isSuperVoid ? POWER_UP_CONFIG.VOID.SUPER.INITIAL_SPEED : POWER_UP_CONFIG.VOID.ULTRA.INITIAL_SPEED) : 0;
          
          Matter.Body.setVelocity(voidBall, {
            x: 0,
            y: speed
          });
        }
      });
    });

    const runner = Matter.Runner.create({
      isFixed: true,
      delta: 1000 / 120,
    });
    runnerRef.current = runner;

    // Update engine settings with slightly reduced speed
    engineRef.current.world.gravity.scale = 0.0009;  // Middle ground between 0.0008 and 0.001
    engineRef.current.timing.timeScale = 0.9;        // Middle ground between 0.8 and 1.0
    
    // Force an initial engine update
    Matter.Engine.update(engineRef.current, runner.delta);

    // Optimize engine settings for better performance
    engineRef.current.world.gravity.scale = 0.0009;
    engineRef.current.timing.timeScale = 0.9;
    
    // Optimize solver iterations for stability
    engineRef.current.positionIterations = 8;
    engineRef.current.velocityIterations = 6;
    engineRef.current.constraintIterations = 3;

    // Add performance optimizations for the physics bodies
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
          // Check if either ball is a void ball
          const voidBall = bodyA.isVoidBall ? bodyA : (bodyB.isVoidBall ? bodyB : null);
          const targetBall = bodyA.isVoidBall ? bodyB : (bodyB.isVoidBall ? bodyA : null);

          if (voidBall && targetBall && !targetBall.isVoidBall) {
            if (typeof voidBall.deletionsRemaining === 'number' && voidBall.deletionsRemaining > 0) {
              // Remove the target ball
              Matter.Composite.remove(engineRef.current.world, targetBall);
              voidBall.deletionsRemaining--;
              
              // Only apply bounce and velocity changes for basic void balls
              if (!voidBall.isSuperVoid) {
                Matter.Body.setVelocity(voidBall, {
                  x: voidBall.velocity.x * POWER_UP_CONFIG.VOID.BASIC.VELOCITY_DAMPING,
                  y: Math.min(voidBall.velocity.y, POWER_UP_CONFIG.VOID.BASIC.MIN_BOUNCE_Y)
                });
              } else {
                // For super and ultra void balls, maintain downward velocity
                Matter.Body.setVelocity(voidBall, {
                  x: 0,
                  y: voidBall.isSuperVoid ? POWER_UP_CONFIG.VOID.SUPER.INITIAL_SPEED : POWER_UP_CONFIG.VOID.ULTRA.INITIAL_SPEED
                });
              }
              
              // Remove void ball if no deletions remaining
              if (voidBall.deletionsRemaining <= 0) {
                setTimeout(() => {
                  if (engineRef.current) {
                    cleanupBody(voidBall);
                  }
                }, 100);
              }
            }
            return;
          }
        }

        // Normal merge logic (only if neither ball is a void ball)
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
                // Reset physics properties to defaults from POWER_UP_CONFIG
                Matter.Body.set(circle, {
                  density: POWER_UP_CONFIG.GRAVITY.HEAVY.DENSITY,
                  friction: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION,
                  frictionAir: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_AIR,
                  restitution: POWER_UP_CONFIG.GRAVITY.HEAVY.RESTITUTION,
                  frictionStatic: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_STATIC,
                  slop: 0.02
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
                if (circle.velocity.y < 30) { // Increased velocity cap
                  const activePowerUp = getActivePowerUp(powerUps);
                  if (activePowerUp?.id === 'ULTRA_HEAVY_BALL') {
                    Matter.Body.applyForce(circle, 
                      circle.position, 
                      { x: 0, y: isMobile ? 0.48 : 0.18 } // Increased from 0.36
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
                      { x: 0, y: isMobile ? 0.16 : 0.06 } // Increased from 0.12
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
                      { x: 0, y: isMobile ? 0.053 : 0.02 } // Increased from 0.04
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
    Matter.Render.run(renderRef.current);

    return () => {
      collisionQueue = [];
      // Clean up both event listeners
      Matter.Events.off(engineRef.current, 'collisionStart', collisionHandler);
      Matter.Events.off(engineRef.current, 'collisionActive', collisionHandler);
      
      // Add null check before stopping the renderer
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
      }
      
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      
      Matter.Engine.clear(engineRef.current);
      renderRef.current?.canvas.remove();
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
    if (!renderRef.current || !currentCircleRef.current) return;
    
    const { width } = renderRef.current.canvas;
    const circle = currentCircleRef.current as CircleBody;
    
    const radius = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG || 1].radius;
    const padding = radius + 0.5;
    
    // Update X position regardless of drag state
    const constrainedX = Math.max(
        padding, 
        Math.min(width - padding, x)
    );
    
    // Store the last valid mouse position
    nextSpawnXRef.current = constrainedX;
    
    // Only update the circle position if not animating
    if (!isAnimatingRef.current) {
        Matter.Body.setPosition(circle, {
            x: constrainedX,
            y: circle.position.y,
        });
    }
  }, []);

  // Update endDrag to apply both visuals and physics when dropping
  const endDrag = useCallback((mouseX?: number) => {
    if (isAnimatingRef.current || !currentCircleRef.current || !engineRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    const activePowerUp = getActivePowerUp(powerUps);
    
    // Apply power-up properties and visuals only when dropping
    if (activePowerUp) {
      // Apply visuals
      const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
      const visualRadius = (visualConfig.radius - 1);
      
      if (circle.render.sprite) {
        circle.render.sprite.texture = createCircleTexture(
          visualConfig.color,
          activePowerUp.visual.strokeColor,
          activePowerUp.visual.glowColor,
          visualRadius * 2
        );
      }

      // Apply physics properties
      if (activePowerUp.group === 'GRAVITY') {
        applyGravityPowerUp(circle, activePowerUp);
      } else if (activePowerUp.group === 'VOID') {
        applyVoidPowerUp(circle, activePowerUp);
      }
      onPowerUpUse();
    }

    circle.hasBeenDropped = true;
    Matter.Sleeping.set(circle, false);
    
    // Calculate initial drop velocity with special case for low gravity
    const baseDropVelocity = engineRef.current.gravity.y * (engineRef.current.timing.timeScale * 0.65);
    let initialDropVelocity = activePowerUp 
      ? baseDropVelocity * (activePowerUp.effects?.forceMultiplier || 1)
      : baseDropVelocity;

    // Add higher initial velocity for low gravity flask
    if (flaskState.activeFlaskId === 'LOW_GRAVITY') {
      initialDropVelocity *= isMobile ? 8 : 6; // Increased from 6x to 8x for mobile
    }
    
    // Set initial velocity based on power-up type
    if (activePowerUp?.id === 'VOID_BALL' || activePowerUp?.id === 'SUPER_VOID_BALL' || activePowerUp?.id === 'ULTRA_VOID_BALL') {
      let config;
      if (activePowerUp.id === 'SUPER_VOID_BALL') {
        config = POWER_UP_CONFIG.VOID.SUPER;
      } else if (activePowerUp.id === 'ULTRA_VOID_BALL') {
        config = POWER_UP_CONFIG.VOID.ULTRA;
      } else {
        config = POWER_UP_CONFIG.VOID.BASIC;
      }
      
      const horizontalVelocity = (Math.random() - 0.5) * config.INITIAL_SPEED;
      Matter.Body.setVelocity(circle, {
        x: (activePowerUp.id === 'SUPER_VOID_BALL' || activePowerUp.id === 'ULTRA_VOID_BALL') ? 0 : horizontalVelocity,
        y: config.INITIAL_SPEED
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
    
    // Important: Reset current circle and prepare next spawn after power-up has been used
    currentCircleRef.current = null;
    isDraggingRef.current = false;
    
    // Call prepareNextSpawn after power-up effects have been cleared
    setTimeout(() => {
      prepareNextSpawn(mouseX);
    }, 0);

    // Special handling for void ball bounce behavior
    if (activePowerUp?.id === 'VOID_BALL' && !activePowerUp?.id.includes('SUPER') && !activePowerUp?.id.includes('ULTRA')) {
      const addBounceForce = () => {
        if (circle && !circle.isMerging && circle.deletionsRemaining && circle.deletionsRemaining > 0) {
          // Get the canvas width for boundary checking
          const { width } = renderRef.current!.canvas;
          const radius = circle.circleRadius || 0;
          
          // Calculate horizontal force based on position
          let horizontalForce = (Math.random() - 0.5) * POWER_UP_CONFIG.VOID.BASIC.HORIZONTAL_FORCE;
          
          // If near edges, apply force towards center
          if (circle.position.x < width * 0.2) { // Left 20% of screen
            horizontalForce = Math.abs(horizontalForce); // Force rightward
          } else if (circle.position.x > width * 0.8) { // Right 20% of screen
            horizontalForce = -Math.abs(horizontalForce); // Force leftward
          }
          
          // Apply bounce force with edge correction
          Matter.Body.applyForce(circle, 
            circle.position, 
            { 
              x: horizontalForce,
              y: -(POWER_UP_CONFIG.VOID.BASIC.BOUNCE_FORCE + (Math.random() * 0.02))
            }
          );

          // If very close to edges, nudge back towards center
          const edgeBuffer = radius * POWER_UP_CONFIG.VOID.BASIC.EDGE_BUFFER;
          if (circle.position.x < edgeBuffer) {
            Matter.Body.setPosition(circle, {
              x: edgeBuffer,
              y: circle.position.y
            });
            Matter.Body.setVelocity(circle, {
              x: Math.abs(circle.velocity.x),
              y: circle.velocity.y
            });
          } else if (circle.position.x > width - edgeBuffer) {
            Matter.Body.setPosition(circle, {
              x: width - edgeBuffer,
              y: circle.position.y
            });
            Matter.Body.setVelocity(circle, {
              x: -Math.abs(circle.velocity.x),
              y: circle.velocity.y
            });
          }
        }
      };

      const bounceInterval = setInterval(() => {
        if (circle && !circle.isMerging && circle.deletionsRemaining && circle.deletionsRemaining > 0) {
          addBounceForce();
        } else {
          clearInterval(bounceInterval);
        }
      }, POWER_UP_CONFIG.VOID.BASIC.BOUNCE_INTERVAL);

      setTimeout(() => clearInterval(bounceInterval), POWER_UP_CONFIG.VOID.BASIC.BOUNCE_DURATION);
    }
  }, [onDrop, prepareNextSpawn, powerUps, onPowerUpUse, getActivePowerUp, applyGravityPowerUp, applyVoidPowerUp, flaskState.activeFlaskId]);

  // Add helper function to get random tier for stress test
  const getRandomStressTestTier = (): TierType => {
    // Weighted distribution favoring smaller tiers but allowing larger ones
    const weights = {
      1: 30,  // 30% chance
      2: 25,  // 25% chance
      3: 15,  // 15% chance
      4: 10,  // 10% chance
      5: 8,   // 8% chance
      6: 5,   // 5% chance
      7: 3,   // 3% chance
      8: 2,   // 2% chance
      9: 1,   // 1% chance
      10: 0.5, // 0.5% chance
      11: 0.3, // 0.3% chance
      12: 0.2  // 0.2% chance
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [tier, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return Number(tier) as TierType;
      }
    }
    
    return 1;
  };

  // Update spawnStressTestBalls function
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
        const tier = getRandomStressTestTier();
        
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

        // Check if ball has exited from the top
        if (circle.position.y < -50) { // Delete if ball is well above the container
          Matter.Composite.remove(engineRef.current!.world, circle);
          return;
        }

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
      if (dangerZoneRef.current) {
        updateDangerZoneAppearance(isAnyCircleInDanger, minTimeRemaining);
      }
    };

    Matter.Events.on(engineRef.current, 'beforeUpdate', checkDangerZone);

    return () => {
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'beforeUpdate', checkDangerZone);
      }
    };
  }, [onGameOver, updateDangerZoneAppearance]);

  // Update collision detection for super void balls
  useEffect(() => {
    const checkCollisions = () => {
      if (!engineRef.current) return;
      
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      console.log(`Total bodies in world: ${bodies.length}`);
      
      const voidBalls = bodies.filter(body => {
        const circle = body as CircleBody;
        return circle.isVoidBall && circle.deletionsRemaining && circle.deletionsRemaining > 0;
      }) as CircleBody[];
      
      if (voidBalls.length > 0) {
        console.log(`Active void balls: ${voidBalls.length}`);
      }

      voidBalls.forEach(voidBall => {
        // Check if ball is either Super or Ultra void ball
        if (voidBall.isSuperVoid) {
          const bounds = Matter.Bounds.create([
            { x: voidBall.position.x - voidBall.circleRadius!, y: voidBall.position.y - voidBall.circleRadius! },
            { x: voidBall.position.x + voidBall.circleRadius!, y: voidBall.position.y + voidBall.circleRadius! }
          ]);
          
          const overlappingBodies = Matter.Query.region(bodies, bounds);
          overlappingBodies.forEach(otherBody => {
            const other = otherBody as CircleBody;
            const currentTime = Date.now();
            
            // Add spawn protection check
            const isProtected = other.spawnTime && 
              (currentTime - other.spawnTime < POWER_UP_CONFIG.SPAWN_PROTECTION_TIME);

            // Check if this is an Ultra void ball
            const isUltraVoid = voidBall.deletionsRemaining === POWER_UP_CONFIG.VOID.ULTRA.DELETIONS;

            if (other !== voidBall && 
                other.label?.startsWith('circle-') && 
                !other.isVoidBall && 
                !other.isMerging &&
                !isProtected && 
                Matter.Bounds.overlaps(voidBall.bounds, other.bounds)) {
              
              cleanupBody(other);
              voidBall.deletionsRemaining!--;
              
              // Only remove the void ball if it's not an Ultra void ball and has no deletions remaining
              if (voidBall.deletionsRemaining! <= 0 && !isUltraVoid) {
                setTimeout(() => {
                  if (engineRef.current) {
                    cleanupBody(voidBall);
                  }
                }, 100);
              }
            }
          });
        }
      });
    };

    Matter.Events.on(engineRef.current!, 'beforeUpdate', checkCollisions);

    return () => {
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'beforeUpdate', checkCollisions);
      }
    };
  }, [cleanupBody]);

  // Add optimization for collision pairs
  useEffect(() => {
    if (!engineRef.current) return;

    const optimizeCollisions = () => {
      const pairs = engineRef.current!.pairs.list as CollisionPair[];
      
      // Process only active collision pairs
      pairs.forEach((pair: CollisionPair) => {
        const { bodyA, bodyB } = pair;

        // Skip collision processing for sleeping or static bodies
        if ((bodyA.isSleeping && bodyB.isSleeping) || 
            (bodyA.isStatic || bodyB.isStatic)) {
          pair.isActive = false;
        }

        // Optimize collision response for large bodies
        if (bodyA.tier && bodyB.tier && (bodyA.tier >= 8 || bodyB.tier >= 8)) {
          pair.restitution = 0.2; // Reduce bouncing for large bodies
          pair.friction = 0.01;   // Reduce friction for large bodies
        }
      });
    };

    Matter.Events.on(engineRef.current, 'beforeUpdate', optimizeCollisions);

    return () => {
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'beforeUpdate', optimizeCollisions);
      }
    };
  }, []);

  // Add logging to component cleanup
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        console.log(`Cleaning up ${bodies.length} bodies on unmount`);
        bodies.forEach(body => {
          cleanupBody(body);
        });
        console.log('Engine cleared');
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, [cleanupBody]);

  // Add resize handling to properly recreate walls
  const handleResize = useCallback(() => {
    if (!engineRef.current || !renderRef.current || !containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    console.log('Handling resize - updating walls');
    logWorldState(engineRef.current, 'Before resize');
    
    // Update render bounds
    renderRef.current.bounds.max.x = width;
    renderRef.current.bounds.max.y = height;
    renderRef.current.options.width = width;
    renderRef.current.options.height = height;
    renderRef.current.canvas.width = width;
    renderRef.current.canvas.height = height;
    
    // Recreate walls with new dimensions
    const newWalls = createOptimizedWalls();
    Matter.Composite.add(engineRef.current.world, newWalls);
    
    logWorldState(engineRef.current, 'After resize');
  }, [createOptimizedWalls]);

  // Update the monitoring effect to better handle the danger zone
  useEffect(() => {
    const monitorInterval = setInterval(() => {
        if (!engineRef.current?.world) return;

        try {
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            
            // Debug log to understand what bodies we have
            const staticBodiesDebug = bodies.filter(body => body.isStatic).map(body => ({
                label: body.label,
                isCurrentBall: body === currentCircleRef.current,
                isDangerZone: body === dangerZoneRef.current,
                isWall: body.label?.includes('wall-')
            }));
            
            if (staticBodiesDebug.length > 0) {
                console.log('Static bodies debug:', staticBodiesDebug);
            }

            // Only look for wall bodies, with more explicit checks
            const wallBodies = bodies.filter(body => {
                const isWall = body.label?.includes('wall-');
                const isCurrentBall = body === currentCircleRef.current;
                const isDangerZone = body === dangerZoneRef.current;
                const isInOriginalWalls = wallBodiesRef.current?.includes(body);

                // Debug individual body if it's static
                if (body.isStatic) {
                    console.log('Static body check:', {
                        label: body.label,
                        isWall,
                        isCurrentBall,
                        isDangerZone,
                        isInOriginalWalls
                    });
                }

                return body.isStatic && 
                       isWall && 
                       !isCurrentBall && 
                       !isDangerZone;
            });
            
            if (wallBodies.length > 3) {
                console.warn('Extra wall bodies detected:', {
                    totalWalls: wallBodies.length,
                    originalWalls: wallBodiesRef.current?.length || 0,
                    labels: wallBodies.map(b => b.label)
                });
                
                // Only remove walls that aren't in our original set
                wallBodies.forEach(body => {
                    if (!wallBodiesRef.current?.includes(body)) {
                        console.log('Removing extra wall:', {
                            label: body.label,
                            id: body.id,
                            isInOriginalWalls: wallBodiesRef.current?.includes(body)
                        });
                        
                        if (Matter.Composite.get(engineRef.current!.world, body.id, body.type)) {
                            Matter.Composite.remove(engineRef.current!.world, body);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error in wall body monitoring:', error);
        }
    }, 1000);

    return () => clearInterval(monitorInterval);
  }, []);

  // Update the flask physics effect
  useEffect(() => {
    if (!engineRef.current) return;

    const flask = flaskState.activeFlaskId ? FLASKS[flaskState.activeFlaskId] : null;
    
    // Reset to default physics
    engineRef.current.gravity.y = 1.75;
    engineRef.current.timing.timeScale = 0.9;

    // Apply flask physics if active
    if (flask?.physics) {
      if (flask.physics.gravity !== undefined) {
        engineRef.current.gravity.y = flask.physics.gravity;
        
        // For low gravity, add some special handling
        if (flask.id === 'LOW_GRAVITY') {
          // Apply to all existing bodies
          const bodies = Matter.Composite.allBodies(engineRef.current.world);
          bodies.forEach(body => {
            if (!body.isStatic && body.label?.startsWith('circle-')) {
              // Just reduce vertical velocity
              Matter.Body.setVelocity(body, {
                x: body.velocity.x,
                y: body.velocity.y * 0.3
              });
            }
          });

          // Add continuous force monitoring for low gravity
          const lowGravityInterval = setInterval(() => {
            if (engineRef.current && flaskState.activeFlaskId === 'LOW_GRAVITY') {
              const bodies = Matter.Composite.allBodies(engineRef.current.world);
              
              // Find the bottom wall position more accurately
              const bottomWall = bodies.find(body => body.label === 'wall-bottom');
              if (!bottomWall) return;
              
              // Use the top edge of the bottom wall as the floor
              const floorY = bottomWall.bounds.min.y;

              bodies.forEach(body => {
                if (!body.isStatic && body.label?.startsWith('circle-')) {
                  // Higher speed cap for more dramatic bounces
                  if (body.velocity.y > 3) {
                    Matter.Body.setVelocity(body, {
                      x: body.velocity.x,
                      y: 3
                    });
                  }
                  
                  // Add bounce boost when hitting the ground
                  if (body.velocity.y > 0 && body.position.y > floorY) {
                    Matter.Body.setVelocity(body, {
                      x: body.velocity.x,
                      y: body.velocity.y * -0.98
                    });
                  }
                }
              });
            }
          }, 16);

          return () => clearInterval(lowGravityInterval);
        }
      }

      if (flask.physics.timeScale !== undefined) {
        engineRef.current.timing.timeScale = flask.physics.timeScale;
      }

      // Apply to all existing bodies
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      bodies.forEach(body => {
        if (!body.isStatic && body.label?.startsWith('circle-')) {
          Matter.Body.set(body, {
            friction: flask.physics.friction ?? body.friction,
            frictionAir: flask.physics.frictionAir ?? body.frictionAir,
            restitution: flask.physics.restitution ?? body.restitution
          });
        }
      });
    } else {
      // Reset all balls to default physics when no flask is active
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      bodies.forEach(body => {
        if (!body.isStatic && body.label?.startsWith('circle-')) {
          Matter.Body.set(body, {
            friction: 0.005,
            frictionAir: 0.0002,
            restitution: 0.3
          });
        }
      });
    }
  }, [flaskState.activeFlaskId]);

  return {
    engine: engineRef.current,
    startDrag,
    updateDrag,
    endDrag,
    spawnStressTestBalls,
    currentBall: currentCircleRef.current as CircleBody | null,
    debug: {
      fps: fpsRef.current,
      isMobile
    }
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