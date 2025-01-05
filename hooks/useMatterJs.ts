import { useEffect, useRef, useCallback, useMemo } from 'react';
import Matter from 'matter-js';
import { CIRCLE_CONFIG } from '@/types/game';
import type { PowerUp, PowerUpState } from '@/types/powerups';
import { POWER_UPS, POWER_UP_CONFIG } from '@/types/powerups';
import type { TierType } from '@/types/game';
import type { FlaskState, FlaskPhysics } from '@/types/flasks';  // Add FlaskPhysics
import { FLASK_SIZES, FLASK_EFFECTS } from '@/types/flasks';
import { 
  FlaskSizeId,
  FlaskEffectId 
} from '@/types/flasks';

// Near the top of the file, add:
declare global {
  interface Window {
    matterEngine?: Matter.Engine & {
      setSlop: (value: number) => void;
    };
  }
}

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

interface DangerZone extends Matter.Body {
  isActive: boolean;
  timeRemaining: number;
}

interface ExtendedBodyDefinition extends Matter.IBodyDefinition {
  chamfer?: {
    radius: number;
  };
  render?: ExtendedRenderOptions;
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

// Near the top of file, add a constant for default slop
const DEFAULT_SLOP = 0.5; // Changed from 0.05 to 0.5

// Add these interface extensions near the top of the file with the other interfaces
interface ExtendedSpriteOptions extends Matter.IBodyRenderOptionsSprite {
  opacity?: number;
}

interface ExtendedRenderOptions extends Matter.IBodyRenderOptions {
  sprite?: ExtendedSpriteOptions;
  opacity?: number;
  width?: number;   // Add width property
  height?: number;  // Add height property
}

// Add this interface near the top with the other interfaces
interface ExtendedRendererOptions extends Matter.IRendererOptions {
  sleepOpacity?: number;
  background?: string;
}

// Add CircleBody interface
interface CircleBody extends Matter.Body {
  tier: TierType;  // Change from optional to required
  isMerging?: boolean;
  isScaled?: boolean;
  isSpawnedBall?: boolean;
  hasBeenDropped?: boolean;
  spawnTime?: number;
  inDangerZone?: boolean;
  dropTime?: number;
  dangerZoneStartTime?: number;
  isVoidBall?: boolean;
  isSuperVoid?: boolean;
  deletionsRemaining?: number;
  isHeavyBall?: boolean;
  powerUpDropTime?: number;
  powerUpStats?: {
    density: number;
    velocity: number;
    force: number;
    timeRemaining: number;
    slop: number;
  };
  circleRadius?: number;
  render: Matter.IBodyRenderOptions & {
    sprite?: {
      texture: string;
      xScale: number;
      yScale: number;
      opacity: number;
    };
  };
  originalTier?: TierType;  // Add this line
}

// Add these interfaces near the top
interface StormField {
  position: Matter.Vector;
  strength: number;
  radius: number;
  timeRemaining: number;
}

// Add this type to ensure power-up effects are properly typed
interface StormPowerUpEffects {
  strength: number;
  radius: number;
  duration: number;
}

// Add this type guard
const hasTurbulence = (physics: FlaskPhysics): physics is FlaskPhysics & { turbulence: TurbulenceConfig } => {
  return 'turbulence' in physics;
};

// Add the turbulence interface
interface TurbulenceConfig {
  strength: number;
  frequency: number;
  radius: number;
  verticalBias: number;
}

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

  // Add ref to track current slop value
  const currentSlopRef = useRef(DEFAULT_SLOP);

  // Update engine creation
  const engineRef = useRef(Matter.Engine.create({ 
    gravity: { y: 1.75 },
    positionIterations: Math.round(12 - (DEFAULT_SLOP * 20)), // Set initial iterations based on default slop
    velocityIterations: Math.max(2, Math.floor((12 - (DEFAULT_SLOP * 20)) * 0.8)),
    constraintIterations: 2,
    enableSleeping: true,
    timing: {
      timeScale: 1.35,
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

  // Add to your existing state
  const stormFields = useRef<StormField[]>([]);

  // Add this function to handle storm field creation
  const createStormField = useCallback((x: number, y: number, power: PowerUp) => {
    if (!power.effects) {
      console.warn('Power-up effects are undefined');
      return;
    }

    const effects = power.effects as StormPowerUpEffects;
    
    const stormField: StormField = {
      position: Matter.Vector.create(x, y),
      strength: effects.strength || 0.003, // Provide default values
      radius: effects.radius || 50,
      timeRemaining: effects.duration || 5000
    };
    
    stormFields.current.push(stormField);
  }, []);

  // Add storm field update logic in your update function
  const updateStormFields = useCallback((delta: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    stormFields.current = stormFields.current.filter(field => {
      field.timeRemaining -= delta;
      
      if (field.timeRemaining <= 0) return false;

      const bodies = Matter.Composite.allBodies(engine.world);
      bodies.forEach(body => {
        if (body.isStatic) return;

        const distance = Matter.Vector.magnitude(
          Matter.Vector.sub(field.position, body.position)
        );

        if (distance < field.radius) {
          const angle = Math.random() * Math.PI * 2;
          const force = {
            x: Math.cos(angle) * field.strength,
            y: Math.sin(angle) * field.strength
          };
          
          Matter.Body.applyForce(
            body,
            body.position,
            force
          );
        }
      });

      return true;
    });
  }, []);

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
    const padding = 16; // Increased padding for glow
    canvas.width = size + (padding * 2);
    canvas.height = size + (padding * 2);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    const centerX = size/2 + padding;
    const centerY = size/2 + padding;
    const radius = size/2 - 1;

    // Clear any previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a clipping path for the glow (slightly larger than the circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.clip();

    // Draw outer glow using multiple shadows
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw a ring instead of a filled circle for the glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Restore context to remove clipping
    ctx.restore();

    // Draw the main circle fill
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw the circle stroke
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    return canvas.toDataURL();
  };

  // Add this helper function to get active power-up
  const getActivePowerUp = useCallback((powerUpState: PowerUpState): PowerUp | null => {
    return powerUpState.activePowerUpId ? POWER_UPS[powerUpState.activePowerUpId] : null;
  }, []);

  // Update current ball's appearance
  const updateCurrentBallAppearance = useCallback(() => {
    if (!currentCircleRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
    const sizeConfig = FLASK_SIZES[flaskState.size];
    const effectConfig = FLASK_EFFECTS[flaskState.effect];
    const activePowerUp = getActivePowerUp(powerUps);
    
    // Use size configuration for scaling
    const scale = circle.isScaled || flaskState.size !== 'DEFAULT' ? sizeConfig.physics.scale : 1;
    const visualRadius = (visualConfig.radius - 1) * scale;
    
    // Update the ball's appearance based on active power-up, maintaining scale
    if (circle.render.sprite) {
      circle.render.sprite.texture = createCircleTexture(
        visualConfig.color,
        activePowerUp?.visual.strokeColor || visualConfig.strokeColor,
        activePowerUp?.visual.glowColor || visualConfig.glowColor,
        visualRadius * 2  // Use scaled radius
      );
    }
  }, [powerUps, getActivePowerUp, flaskState.size, flaskState.effect]);

  // Add effect to update appearance when power-ups change
  useEffect(() => {
    updateCurrentBallAppearance();
  }, [powerUps.activePowerUpId, updateCurrentBallAppearance]);

  // Add helper function to apply void power-up properties
  const applyVoidPowerUp = useCallback((circle: CircleBody, powerUp: PowerUp) => {
    if (!circle) return;
    
    circle.isVoidBall = true;
    circle.isSuperVoid = powerUp.id === 'SUPER_VOID_BALL' || powerUp.id === 'ULTRA_VOID_BALL';
    
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
      frictionStatic: powerUp.physics.frictionStatic || circle.frictionStatic,
      isSensor: config.IS_SENSOR // This will be true for SUPER and ULTRA
    });
  }, []);

  // Update createCircle to apply flask physics
  const createCircle = useCallback((
    tier: TierType,  // Use TierType instead of union type
    x: number,
    y: number,
    isStressTest: boolean = false,
    forceScale?: boolean
  ) => {
    if (!renderRef.current || !engineRef.current) return null;

    const visualConfig = CIRCLE_CONFIG[tier];
    const sizeConfig = FLASK_SIZES[flaskState.size];
    const effectConfig = FLASK_EFFECTS[flaskState.effect];
    
    // Apply scaling based on size configuration
    const shouldScale = forceScale || flaskState.size !== 'DEFAULT';
    const scale = shouldScale ? sizeConfig.physics.scale : 1;
    const collisionRadius = visualConfig.radius * scale;
    
    const baseVisualRadius = visualConfig.radius - 1;
    const visualRadius = baseVisualRadius * scale;
    
    const texture = createCircleTexture(
      visualConfig.color,
      visualConfig.strokeColor,
      visualConfig.glowColor,
      visualRadius * 2
    );

    // Combine physics from both size and effect
    const circleOptions: ExtendedBodyDefinition = {
      density: tier === 1 ? 0.05 : (effectConfig.physics.density ?? 0.02),
      friction: tier === 1 ? 0.001 : (effectConfig.physics.friction ?? (isMobile ? 0.01 : 0.005)),
      frictionAir: tier === 1 ? 0.0001 : (effectConfig.physics.frictionAir ?? (isMobile ? 0.0004 : 0.0002)),
      restitution: effectConfig.physics.restitution ?? 0.3,
      frictionStatic: tier === 1 ? 0.001 : (isMobile ? 0.04 : 0.02),
      sleepThreshold: tier >= 10 ? 30 : (tier >= 8 ? 60 : Infinity),
      collisionFilter: {
        group: 0,
        category: isStressTest ? 0x0001 : 0x0002,
        mask: isStressTest ? 0xFFFFFFFF : 0x0004
      },
      render: {
        sprite: {
          texture: texture,
          xScale: 1,
          yScale: 1,
          opacity: 1
        },
        opacity: 1,
        width: collisionRadius * 2 + 32,
        height: collisionRadius * 2 + 32
      },
      label: `circle-${tier}`
    };

    // Create circle with scaled radius
    const circle = Matter.Bodies.circle(x, y, collisionRadius, circleOptions) as CircleBody;
    
    // Mark the circle as scaled if scaling was applied
    circle.isScaled = shouldScale;
    
    // Set basic circle properties
    circle.isMerging = false;
    circle.tier = tier;  // This will now be correctly typed
    circle.hasBeenDropped = false;
    circle.spawnTime = Date.now();
    circle.inDangerZone = false;
    
    Matter.Body.setStatic(circle, false);
    Matter.Body.set(circle, {
      torque: 0,
      angularSpeed: 0,
      angularVelocity: 0
    });

    // Add to world after all properties are set
    Matter.Composite.add(engineRef.current.world, circle);
    
    return circle;
  }, [flaskState.size, flaskState.effect, isMobile, createCircleTexture]);

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
  }, [/* dependencies */]); // Add missing dependency array

  // Then define createOptimizedWalls
  const createOptimizedWalls = useCallback(() => {
    if (!renderRef.current || !engineRef.current) return [];

    // Remove existing walls first
    const existingWalls = Matter.Composite.allBodies(engineRef.current.world)
        .filter(body => body.isStatic && body.label?.includes('wall-'));
    
    existingWalls.forEach(wall => {
        Matter.Composite.remove(engineRef.current!.world, wall);
    });
    
    const { width, height } = renderRef.current.canvas;
    const wallThickness = 60;
    const extraHeight = height * 0.5; // Add 50% more height above the visible container
    
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
        // Add ceiling wall higher up
        Matter.Bodies.rectangle(width / 2, -extraHeight - wallThickness / 2, width, wallThickness, {
            ...wallOptions,
            label: 'wall-top'
        }),
        // Bottom wall stays the same
        Matter.Bodies.rectangle(width / 2, height + (wallThickness / 2), width, wallThickness, {
            ...wallOptions,
            label: 'wall-bottom'
        }),
        // Extend side walls to reach the higher ceiling
        Matter.Bodies.rectangle(-wallThickness / 2, (height - extraHeight) / 2, wallThickness, height + extraHeight, {
            ...wallOptions,
            label: 'wall-left'
        }),
        Matter.Bodies.rectangle(width + (wallThickness / 2), (height - extraHeight) / 2, wallThickness, height + extraHeight, {
            ...wallOptions,
            label: 'wall-right'
        })
    ];

    // Store new walls reference
    wallBodiesRef.current = walls;
    
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
          // Only clean up bodies that are far below or to the sides
          // Remove the top boundary check to prevent deleting balls above the visible area
          if (canvas && (
            circle.position.y > canvas.height + 200 || // Too far below
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
    
    // Create new merged circle with forced scaling if either original was scaled
    const shouldForceScale = bodyA.isScaled || bodyB.isScaled;
    const newCircle = createCircle(newTier, midX, midY, false, shouldForceScale);
    
    if (newCircle) {
      console.log(`Created new merged circle: Tier ${newTier}, Scaled: ${newCircle.isScaled}`);
      newCircle.hasBeenDropped = true;
      
      // Add stronger upward boost for low gravity flask
      const randomHorizontal = (Math.random() - 0.5) * 0.5;
      
      if (flaskState.effect === 'LOW_GRAVITY') {
        Matter.Body.setVelocity(newCircle, { 
          x: randomHorizontal * 1.5,
          y: -3
        });
      } else {
        Matter.Body.setVelocity(newCircle, { 
          x: randomHorizontal,
          y: -1.5
        });
      }

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

      // Award power-ups based on specific tiers
      if (onPowerUpEarned) {
        if (newTier === 5) {
          // Tier 5 earns level 1 power-ups
          onPowerUpEarned(1);
        } else if (newTier === 6) {
          // Tier 6 earns level 2 power-ups
          onPowerUpEarned(2);
        } else if (newTier === 7) {
          // Tier 7 earns level 3 power-ups
          onPowerUpEarned(3);
        }
      }
    }

    onNewTier(newTier);
    logWorldState(engineRef.current, 'After merge');
  }, [createCircle, onNewTier, powerUps, onPowerUpEarned, cleanupBody, flaskState.effect]);

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
      
      // Skip if either body isn't a circle
      if (!bodyA?.label?.startsWith('circle-') || !bodyB?.label?.startsWith('circle-')) {
        return;
      }

      // Skip collision handling if either ball is a spawned ball that hasn't been dropped
      if ((bodyA.isSpawnedBall && !bodyA.hasBeenDropped) || 
          (bodyB.isSpawnedBall && !bodyB.hasBeenDropped)) {
        return;
      }

      // Normal merge logic (only if neither ball is a void ball)
      if (!bodyA.isVoidBall && !bodyB.isVoidBall &&
          bodyA.hasBeenDropped && bodyB.hasBeenDropped && 
          !bodyA.isMerging && !bodyB.isMerging) {
        const tierA = bodyA.tier;
        const tierB = bodyB.tier;

        if (tierA === tierB && tierA !== undefined && tierA < 12) {
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
      timeRemaining: activePowerUp.effects?.duration || 5000,
      slop: currentSlopRef.current // Add current slop value
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
                  // Get current size configuration
                  const shouldKeepScaled = flaskState.size !== 'DEFAULT';
                  const scale = shouldKeepScaled ? FLASK_SIZES[flaskState.size].physics.scale : 1;
                  
                  // Reset physics properties to defaults
                  Matter.Body.set(circle, {
                    density: POWER_UP_CONFIG.GRAVITY.HEAVY.DENSITY,
                    friction: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION,
                    frictionAir: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_AIR,
                    restitution: POWER_UP_CONFIG.GRAVITY.HEAVY.RESTITUTION,
                    frictionStatic: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_STATIC
                  });

                  // Update visual appearance while maintaining scale if needed
                  const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
                  const visualRadius = (visualConfig.radius - 1) * scale;
                  
                  // Reset to default appearance but maintain scale
                  if (circle.render.sprite) {
                    circle.render.sprite.texture = createCircleTexture(
                      visualConfig.color,
                      visualConfig.strokeColor,
                      visualConfig.glowColor,
                      visualRadius * 2
                    );
                  }

                  // Maintain the scale flag if size is not default
                  circle.isScaled = shouldKeepScaled;
                  circle.isHeavyBall = false;
                  circle.powerUpDropTime = undefined;
                  circle.powerUpStats = undefined;
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
        background: 'transparent',
        showSleeping: false,
        sleepOpacity: 1, // Now TypeScript knows about this property
      } as ExtendedRendererOptions
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

    // Create runner with fixed timestep settings
    const runner = Matter.Runner.create({
      isFixed: true,
      delta: 1000 / 120, // Fixed 120Hz timestep - good balance between smoothness and performance
      enabled: true
    });

    runnerRef.current = runner;

    // Start the runner with the engine
    Matter.Runner.run(runner, engineRef.current);

    // Add render run back since it's still needed
    Matter.Render.run(renderRef.current);

    // Optimize engine settings for better performance
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
        
        // Skip collision handling if either ball is a spawned ball
        if (bodyA.isSpawnedBall || bodyB.isSpawnedBall) {
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

    // Update the force interval to handle power-up expiration better
    const forceInterval = setInterval(() => {
      if (!engineRef.current) return;
      const currentTime = Date.now();
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      
      bodies.forEach((body) => {
        const circle = body as CircleBody;
        if (circle.label?.startsWith('circle-') && circle.hasBeenDropped) {
          if (circle.powerUpDropTime) {
            const elapsedTime = currentTime - circle.powerUpDropTime;
            const activePowerUp = getActivePowerUp(powerUps);
            
            if (activePowerUp && activePowerUp.group === 'GRAVITY') {
              const duration = activePowerUp.effects?.duration || POWER_UP_CONFIG.GRAVITY.HEAVY.DURATION;
              
              if (elapsedTime > duration) {
                // Get current size configuration
                const shouldKeepScaled = flaskState.size !== 'DEFAULT';
                const scale = shouldKeepScaled ? FLASK_SIZES[flaskState.size].physics.scale : 1;
                
                // Reset physics properties to defaults
                Matter.Body.set(circle, {
                  density: POWER_UP_CONFIG.GRAVITY.HEAVY.DENSITY,
                  friction: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION,
                  frictionAir: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_AIR,
                  restitution: POWER_UP_CONFIG.GRAVITY.HEAVY.RESTITUTION,
                  frictionStatic: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_STATIC
                });

                // Update visual appearance while maintaining scale if needed
                const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
                const visualRadius = (visualConfig.radius - 1) * scale;
                
                // Reset to default appearance but maintain scale
                if (circle.render.sprite) {
                  circle.render.sprite.texture = createCircleTexture(
                    visualConfig.color,
                    visualConfig.strokeColor,
                    visualConfig.glowColor,
                    visualRadius * 2
                  );
                }

                // Maintain the scale flag if size is not default
                circle.isScaled = shouldKeepScaled;
                circle.isHeavyBall = false;
                circle.powerUpDropTime = undefined;
                circle.powerUpStats = undefined;
              }
            }
          }
        }
      });
    }, 100);

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
    if (!renderRef.current || isCreatingDropBallRef.current) return;
    
    isCreatingDropBallRef.current = true;
    const { width } = renderRef.current.canvas;
    
    const circleRadius = CIRCLE_CONFIG[nextTier as keyof typeof CIRCLE_CONFIG].radius;
    const padding = circleRadius + 0.5;
    
    const spawnX = mouseX !== undefined ? 
      Math.max(padding, Math.min(width - padding, mouseX)) : 
      width / 2;
    
    const circle = createCircle(
      nextTier as 1|2|3|4|5|6|7|8|9|10|11|12, 
      spawnX,
      -circleRadius
    );
    
    if (circle) {
      circle.isStatic = true;
      currentCircleRef.current = circle;
      isDraggingRef.current = true;
      isAnimatingRef.current = true;
      animationStartTimeRef.current = performance.now();
      
      const startY = -circleRadius;
      const BASE_SPAWN_Y = 75; // Base spawn height for tier 1
      const tier1Radius = CIRCLE_CONFIG[1].radius;
      // Adjust targetY so bottom edge aligns with tier 1 bottom edge
      const targetY = BASE_SPAWN_Y - (circleRadius - tier1Radius);
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
          x: spawnX,
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
    
    isCreatingDropBallRef.current = false;
  }, [createCircle, nextTier]);

  // Update the startDrag function
  const startDrag = useCallback((x: number) => {
    // Don't allow starting a new drag while animating
    if (isAnimatingRef.current) return;
    
    if (!renderRef.current) return;
    const { width } = renderRef.current.canvas;
    
    if (isFirstSpawnRef.current) {
      // First spawn logic
      prepareNextSpawn(width / 2);
      isFirstSpawnRef.current = false;
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
  }, [prepareNextSpawn, nextTier]);

  // Update the updateDrag function
  const updateDrag = useCallback((x: number) => {
    // Don't update position if animating or not dragging
    if (isAnimatingRef.current || !isDraggingRef.current) {
      return;
    }

    nextSpawnXRef.current = x;
    
    if (currentCircleRef.current) {
      Matter.Body.setPosition(currentCircleRef.current, {
        x: x,
        y: currentCircleRef.current.position.y
      });
    }
  }, []);

  // Move revertTierChanges before endDrag
  const revertTierChanges = useCallback((circle: CircleBody) => {
    if (!circle.originalTier || circle.originalTier === circle.tier) return;

    const originalTier = circle.originalTier as TierType;
    circle.tier = originalTier;
    
    // Revert size and appearance
    const circleConfig = CIRCLE_CONFIG[originalTier];
    const scale = circleConfig.radius / (circle.circleRadius || 1);
    
    Matter.Body.scale(circle, scale, scale);
    circle.circleRadius = circleConfig.radius;
    
    // Revert visual appearance
    if (circle.render.sprite) {
      circle.render.sprite.texture = createCircleTexture(
        CIRCLE_CONFIG[originalTier].color,
        circleConfig.strokeColor,
        circleConfig.glowColor,
        circleConfig.radius * 2
      );
    }
    
    // Clear the stored original tier
    delete circle.originalTier;
  }, []);

  // Then define endDrag
  const endDrag = useCallback((mouseX: number) => {
    if (!currentCircleRef.current || !engineRef.current || isAnimatingRef.current) return;
    
    const circle = currentCircleRef.current as CircleBody;
    
    // If power-up was deselected before dropping, revert any tier changes
    if (!powerUps.activePowerUpId && circle.originalTier) {
      revertTierChanges(circle);
    }
    
    // Enable collisions with everything when dropped
    Matter.Body.set(circle, {
      collisionFilter: {
        group: 0,
        category: 0x0001,
        mask: 0xFFFFFFFF
      }
    });
    
    circle.isSpawnedBall = false;
    circle.hasBeenDropped = true;
    
    const activePowerUp = getActivePowerUp(powerUps);
    
    // Apply power-up properties and visuals only when dropping
    if (activePowerUp) {
      // Get current scale from flask or existing scale
      const scale = flaskState.size !== 'DEFAULT' ? FLASK_SIZES[flaskState.size].physics.scale : 1;
      
      // Apply visuals with correct scaling
      const visualConfig = CIRCLE_CONFIG[circle.tier as keyof typeof CIRCLE_CONFIG];
      const visualRadius = (visualConfig.radius - 1) * scale;
      
      if (circle.render.sprite) {
        circle.render.sprite.texture = createCircleTexture(
          visualConfig.color,
          activePowerUp.visual.strokeColor,
          activePowerUp.visual.glowColor,
          visualRadius * 2
        );
      }

      // Apply physics properties based on power-up type
      if (activePowerUp.group === 'VOID') {
        applyVoidPowerUp(circle, activePowerUp);
        circle.isScaled = scale !== 1;
      } else if (activePowerUp.group === 'GRAVITY') {
        applyGravityPowerUp(circle, activePowerUp);
        circle.isScaled = scale !== 1;
      }
      
      onPowerUpUse();
    }

    // Make the ball dynamic and apply initial physics
    circle.isStatic = false;
    Matter.Sleeping.set(circle, false);
    
    // Calculate initial drop velocity
    const baseDropVelocity = engineRef.current.gravity.y * (engineRef.current.timing.timeScale * 0.65);
    let initialDropVelocity = activePowerUp 
      ? baseDropVelocity * (activePowerUp.effects?.forceMultiplier || 1)
      : baseDropVelocity;

    // Add higher initial velocity for low gravity flask
    if (flaskState.effect === 'LOW_GRAVITY') {
      initialDropVelocity *= 6;
    }
    
    // Set initial velocity based on power-up type
    if (activePowerUp?.id.includes('VOID_BALL')) {
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
    
    // Apply immediate force for heavy balls
    if (activePowerUp?.id === 'ULTRA_HEAVY_BALL') {
      Matter.Body.applyForce(circle, circle.position, { x: 0, y: 0.5 });
    } else if (activePowerUp?.id === 'SUPER_HEAVY_BALL') {
      Matter.Body.applyForce(circle, circle.position, { x: 0, y: 0.2 });
    } else if (activePowerUp?.id === 'HEAVY_BALL') {
      Matter.Body.applyForce(circle, circle.position, { x: 0, y: 0.05 });
    }

    Matter.Body.set(circle, {
      isSleeping: false,
      motion: 1,
      speed: Math.abs(initialDropVelocity)
    });

    // Reset refs and prepare next spawn
    isDraggingRef.current = false;
    currentCircleRef.current = null;
    
    onDrop();
    
    // Prepare next spawn with a slight delay
    setTimeout(() => {
      if (!isAnimatingRef.current) {
        prepareNextSpawn(mouseX);
      }
    }, 50);

  }, [onDrop, prepareNextSpawn, powerUps, onPowerUpUse, getActivePowerUp, applyGravityPowerUp, applyVoidPowerUp, flaskState.effect, revertTierChanges]);

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
        
        const circle = createCircle(tier, x, y, true);  // Pass true for isStressTest
        if (circle) {
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
    if (!engineRef.current) return;

    const checkDangerZone = () => {
        const currentTime = Date.now();
        const bodies = Matter.Composite.allBodies(engineRef.current!.world);
        let isAnyCircleInDanger = false;
        let minTimeRemaining = DANGER_ZONE_TIMEOUT;
        
        bodies.forEach(body => {
            const circle = body as CircleBody;
            
            if (!circle.label?.startsWith('circle-') || !circle.hasBeenDropped) return;
            
            // Only start grace period when ball is dropped, not when spawned
            if (!circle.dropTime) {
                if (circle.hasBeenDropped) {
                    circle.dropTime = currentTime;
                }
                return;
            }

            // Check if circle has been dropped long enough
            if (currentTime - circle.dropTime < DANGER_ZONE_GRACE_PERIOD) return;

            // Only consider balls within the visible container
            const isAboveContainer = circle.position.y < 0;
            const isInDangerZone = circle.position.y < DANGER_ZONE_HEIGHT && !isAboveContainer;
            
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
}, [onGameOver]);

  // Update collision detection for super void balls
  useEffect(() => {
    const checkCollisions = () => {
      if (!engineRef.current) return;
      
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      
      const voidBalls = bodies.filter(body => {
        const circle = body as CircleBody;
        return circle.isVoidBall && circle.deletionsRemaining && circle.deletionsRemaining > 0;
      }) as CircleBody[];

      voidBalls.forEach(voidBall => {
        // Only handle super/ultra void balls here
        if (!voidBall.isSuperVoid) return;

        // Set velocity to maintain constant downward motion
        const speed = voidBall.deletionsRemaining === POWER_UP_CONFIG.VOID.ULTRA.DELETIONS
          ? POWER_UP_CONFIG.VOID.ULTRA.INITIAL_SPEED
          : POWER_UP_CONFIG.VOID.SUPER.INITIAL_SPEED;

        Matter.Body.setVelocity(voidBall, {
          x: 0,
          y: speed
        });

        const bounds = Matter.Bounds.create([
          { x: voidBall.position.x - voidBall.circleRadius!, y: voidBall.position.y - voidBall.circleRadius! },
          { x: voidBall.position.x + voidBall.circleRadius!, y: voidBall.position.y + voidBall.circleRadius! }
        ]);
        
        const overlappingBodies = Matter.Query.region(bodies, bounds);
        overlappingBodies.forEach(otherBody => {
          const other = otherBody as CircleBody;
          const currentTime = Date.now();
          
          const isProtected = other.spawnTime && 
            (currentTime - other.spawnTime < POWER_UP_CONFIG.SPAWN_PROTECTION_TIME);

          const isUltraVoid = voidBall.deletionsRemaining === POWER_UP_CONFIG.VOID.ULTRA.DELETIONS;

          if (other !== voidBall && 
              other.label?.startsWith('circle-') && 
              !other.isVoidBall && 
              !other.isMerging &&
              !isProtected && 
              Matter.Bounds.overlaps(voidBall.bounds, other.bounds)) {
            
            cleanupBody(other);
            voidBall.deletionsRemaining!--;
            
            if (voidBall.deletionsRemaining! <= 0 && !isUltraVoid) {
              setTimeout(() => {
                if (engineRef.current) {
                  cleanupBody(voidBall);
                }
              }, 100);
            }
          }
        });
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

  // Update the initial render creation
  useEffect(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    const render = Matter.Render.create({
      element: containerRef.current,
      engine: engineRef.current,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: pixelRatio,
      } as ExtendedRendererOptions
    });

    // Set canvas size accounting for pixel ratio
    render.canvas.width = width * pixelRatio;
    render.canvas.height = height * pixelRatio;
    
    // Set canvas CSS size
    render.canvas.style.width = `${width}px`;
    render.canvas.style.height = `${height}px`;
    
    // Scale the rendering context
    render.context.scale(pixelRatio, pixelRatio);
    
    renderRef.current = render;
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      render.canvas.remove();
      renderRef.current = null;
    };
  }, []);

  // Update handleResize to properly handle pixel ratio
  const handleResize = useCallback(() => {
    if (!engineRef.current || !renderRef.current || !containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Update render bounds
    renderRef.current.bounds.max.x = width;
    renderRef.current.bounds.max.y = height;
    renderRef.current.options.width = width;
    renderRef.current.options.height = height;
    renderRef.current.options.pixelRatio = pixelRatio;
    
    // Update canvas size accounting for pixel ratio
    renderRef.current.canvas.width = width * pixelRatio;
    renderRef.current.canvas.height = height * pixelRatio;
    
    // Update canvas CSS size
    renderRef.current.canvas.style.width = `${width}px`;
    renderRef.current.canvas.style.height = `${height}px`;
    
    // Reset the scale transform
    renderRef.current.context.setTransform(1, 0, 0, 1, 0, 0);
    // Apply the new scale transform
    renderRef.current.context.scale(pixelRatio, pixelRatio);
    
    // Recreate walls with new dimensions
    const newWalls = createOptimizedWalls();
    Matter.Composite.add(engineRef.current.world, newWalls);
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

            // Update wall body check to include top wall
            const wallBodies = bodies.filter(body => {
                const isWall = body.label?.includes('wall-');
                const isCurrentBall = body === currentCircleRef.current;
                const isDangerZone = body === dangerZoneRef.current;
                const isInOriginalWalls = wallBodiesRef.current?.includes(body);

                return body.isStatic && 
                       isWall && 
                       !isCurrentBall && 
                       !isDangerZone;
            });

            // Update maximum wall count to 4 (including ceiling)
            if (wallBodies.length > 4) {
                console.warn('Extra wall bodies detected:', {
                    totalWalls: wallBodies.length,
                    originalWalls: wallBodiesRef.current?.length || 0,
                    labels: wallBodies.map(b => b.label)
                });
                
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
    }, 1000); // Check every second

    return () => clearInterval(monitorInterval);
  }, []);

  // Update the flask physics effect
  useEffect(() => {
    if (!engineRef.current) return;

    // Get the effect configuration
    const effectConfig = FLASK_EFFECTS[flaskState.effect];
    
    // Reset to default physics first
    engineRef.current.gravity.y = FLASK_EFFECTS.DEFAULT.physics.gravity || 1.75;
    engineRef.current.timing.timeScale = FLASK_EFFECTS.DEFAULT.physics.timeScale || 1.35;

    // Apply effect physics if not default
    if (flaskState.effect !== 'DEFAULT' && effectConfig?.physics) {
      if (effectConfig.physics.gravity !== undefined) {
        engineRef.current.gravity.y = effectConfig.physics.gravity;
      }
      if (effectConfig.physics.timeScale !== undefined) {
        engineRef.current.timing.timeScale = effectConfig.physics.timeScale;
      }

      // Special handling for low gravity effect
      if (flaskState.effect === 'LOW_GRAVITY') {
        // Increase timeScale for faster movement
        engineRef.current.timing.timeScale = 2.4;

        const lowGravityCollisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
          event.pairs.forEach((pair) => {
            const bodyA = pair.bodyA as CircleBody;
            const bodyB = pair.bodyB as CircleBody;
            
            if (bodyA.label?.startsWith('circle-') && bodyB.label?.startsWith('circle-')) {
              const collisionAngle = Math.atan2(
                bodyB.position.y - bodyA.position.y,
                bodyB.position.x - bodyA.position.x
              );

              const bounceForce = 0.06;
              
              Matter.Body.setVelocity(bodyA, {
                x: bodyA.velocity.x - Math.cos(collisionAngle) * bounceForce,
                y: bodyA.velocity.y - Math.sin(collisionAngle) * bounceForce
              });
              
              Matter.Body.setVelocity(bodyB, {
                x: bodyB.velocity.x + Math.cos(collisionAngle) * bounceForce,
                y: bodyB.velocity.y + Math.sin(collisionAngle) * bounceForce
              });

              const randomAngle = Math.random() * Math.PI * 2;
              const randomForce = 0.03;

              Matter.Body.applyForce(bodyA, bodyA.position, {
                x: Math.cos(randomAngle) * randomForce,
                y: Math.sin(randomAngle) * randomForce
              });

              Matter.Body.applyForce(bodyB, bodyB.position, {
                x: Math.cos(randomAngle + Math.PI) * randomForce,
                y: Math.sin(randomAngle + Math.PI) * randomForce
              });
            }
          });
        };

        Matter.Events.on(engineRef.current, 'collisionStart', lowGravityCollisionHandler);

        return () => {
          if (engineRef.current) {
            Matter.Events.off(engineRef.current, 'collisionStart', lowGravityCollisionHandler);
          }
        };
      }
    }
  }, [flaskState.effect]);

  // Keep only this effect that properly sets up the engine with setSlop
  useEffect(() => {
    if (engineRef.current) {
      // Create the setSlop function
      const setEngineSlop = (slopValue: number) => {
        if (!engineRef.current) return;
        
        // Store the slop value
        currentSlopRef.current = slopValue;
        
        // Convert slop (0-100) to iterations (2-12)
        // Use an inverse logarithmic scale to make the slider more responsive at lower values
        const normalizedSlop = Math.log(slopValue + 1) / Math.log(101); // log scale normalization
        const iterations = Math.max(2, Math.round(12 - (normalizedSlop * 10)));
        
        engineRef.current.positionIterations = iterations;
        engineRef.current.velocityIterations = Math.max(2, Math.floor(iterations * 0.8));
      };

      // Create the enhanced engine with setSlop method
      const enhancedEngine = Object.assign(engineRef.current, {
        setSlop: setEngineSlop
      });

      // Set initial slop value
      setEngineSlop(DEFAULT_SLOP);

      // Assign the enhanced engine to window
      window.matterEngine = enhancedEngine;

      return () => {
        window.matterEngine = undefined;
      };
    }
  }, []); // Empty dependency array since we only want this to run once

  useEffect(() => {
    // ... existing animation setup code ...

    const updateAnimation = () => {
      if (!isAnimatingRef.current || !animationStartTimeRef.current) return;

      const currentTime = Date.now();
      const elapsed = currentTime - animationStartTimeRef.current;
      
      if (elapsed >= ANIMATION_DURATION) {
        // Reset animation state when complete
        isAnimatingRef.current = false;
        animationStartTimeRef.current = null;
        
        // Prepare next spawn only after animation is complete
        prepareNextSpawn();
      }
      // ... rest of animation update code ...
    };

    // ... rest of effect code ...
  }, [prepareNextSpawn]);

  // Add this effect to handle physics changes
  useEffect(() => {
    if (!engineRef.current) return;

    // Get the effect configuration
    const effectConfig = FLASK_EFFECTS[flaskState.effect];
    
    // Reset to default physics
    engineRef.current.gravity.y = FLASK_EFFECTS.DEFAULT.physics.gravity || 1.75;
    engineRef.current.timing.timeScale = FLASK_EFFECTS.DEFAULT.physics.timeScale || 1.35;

    // Apply effect physics if not default
    if (flaskState.effect !== 'DEFAULT' && effectConfig?.physics) {
      if (effectConfig.physics.gravity !== undefined) {
        engineRef.current.gravity.y = effectConfig.physics.gravity;
      }
      if (effectConfig.physics.timeScale !== undefined) {
        engineRef.current.timing.timeScale = effectConfig.physics.timeScale;
      }

      // Special handling for low gravity effect
      if (flaskState.effect === 'LOW_GRAVITY') {
        // Increase timeScale for faster movement
        engineRef.current.timing.timeScale = 2.4;

        const lowGravityCollisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
          event.pairs.forEach((pair) => {
            const bodyA = pair.bodyA as CircleBody;
            const bodyB = pair.bodyB as CircleBody;
            
            if (bodyA.label?.startsWith('circle-') && bodyB.label?.startsWith('circle-')) {
              const collisionAngle = Math.atan2(
                bodyB.position.y - bodyA.position.y,
                bodyB.position.x - bodyA.position.x
              );

              const bounceForce = 0.06;
              
              Matter.Body.setVelocity(bodyA, {
                x: bodyA.velocity.x - Math.cos(collisionAngle) * bounceForce,
                y: bodyA.velocity.y - Math.sin(collisionAngle) * bounceForce
              });
              
              Matter.Body.setVelocity(bodyB, {
                x: bodyB.velocity.x + Math.cos(collisionAngle) * bounceForce,
                y: bodyB.velocity.y + Math.sin(collisionAngle) * bounceForce
              });

              const randomAngle = Math.random() * Math.PI * 2;
              const randomForce = 0.03;

              Matter.Body.applyForce(bodyA, bodyA.position, {
                x: Math.cos(randomAngle) * randomForce,
                y: Math.sin(randomAngle) * randomForce
              });

              Matter.Body.applyForce(bodyB, bodyB.position, {
                x: Math.cos(randomAngle + Math.PI) * randomForce,
                y: Math.sin(randomAngle + Math.PI) * randomForce
              });
            }
          });
        };

        Matter.Events.on(engineRef.current, 'collisionStart', lowGravityCollisionHandler);

        return () => {
          if (engineRef.current) {
            Matter.Events.off(engineRef.current, 'collisionStart', lowGravityCollisionHandler);
          }
        };
      }
    }
  }, [flaskState.effect]);

  // Add to your main update loop
  useEffect(() => {
    // ... existing update logic
    
    const update = (delta: number) => {
      // ... other updates
      updateStormFields(delta);
    };
    
    // ... rest of the effect
  }, [/* existing dependencies */, updateStormFields]);

  // Modify your power-up handling to include storm fields
  const handlePowerUp = useCallback((power: PowerUp, x: number, y: number) => {
    if (!currentCircleRef.current) return;
    onPowerUpUse();
  }, [onPowerUpUse]);

  // Add this effect to handle power-up changes
  useEffect(() => {
    if (!currentCircleRef.current) return;
    const circle = currentCircleRef.current as CircleBody;

    // If a power-up is activated
    if (powerUps.activePowerUpId) {
      const activePowerUp = POWER_UPS[powerUps.activePowerUpId];
      
      // Store original tier if not already stored
      if (circle.originalTier === undefined) {
        circle.originalTier = circle.tier;
      }
      
      // Apply tier upgrade if applicable
      if (activePowerUp.effects?.tierIncrease) {
        const newTier = Math.min(12, circle.originalTier + activePowerUp.effects.tierIncrease) as TierType;
        circle.tier = newTier;
        
        // Update the circle's appearance and size
        const circleConfig = CIRCLE_CONFIG[newTier];
        const scale = circleConfig.radius / (circle.circleRadius || 1);
        
        Matter.Body.scale(circle, scale, scale);
        circle.circleRadius = circleConfig.radius;
        
        // Update visual appearance
        if (circle.render.sprite) {
          circle.render.sprite.texture = createCircleTexture(
            CIRCLE_CONFIG[newTier].color,
            activePowerUp.visual.strokeColor,
            activePowerUp.visual.glowColor,
            circleConfig.radius * 2
          );
        }
      }
    } 
    // If power-up is deactivated and we have an original tier stored
    else if (circle.originalTier) {
      revertTierChanges(circle);
    }
  }, [powerUps.activePowerUpId, revertTierChanges]);

  // Add resetEngine function before the return statement
  const resetEngine = useCallback(() => {
    if (!engineRef.current || !renderRef.current) return;
    
    // Remove all bodies from the world
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(body => {
      // Don't remove static boundaries and danger zone during reset
      if (!body.isStatic) {
        Matter.Composite.remove(engineRef.current!.world, body);
      }
    });
    
    // Reset engine properties
    engineRef.current.timing.timeScale = 1;
    engineRef.current.timing.timestamp = 0;
    
    // Clear any active constraints
    const constraints = Matter.Composite.allConstraints(engineRef.current!.world);
    constraints.forEach(constraint => {
      Matter.Composite.remove(engineRef.current!.world, constraint);
    });
  }, []);

  return {
    engine: engineRef.current,
    startDrag,
    updateDrag,
    endDrag,
    spawnStressTestBalls,
    currentBall: currentCircleRef.current as CircleBody | null,
    debug: {
      fps: fpsRef.current,
      isMobile,
      slop: currentSlopRef.current
    },
    resetEngine
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