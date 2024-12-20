// Configuration constants for power-ups
export const POWER_UP_CONFIG = {
  GRAVITY: {
    HEAVY: {
      FORCE_MULTIPLIER: 15,
      DURATION: 5000,
      CONSTANT_FORCE: 0.02,
      DENSITY: 0.04,
      FRICTION: 0.001,
      FRICTION_AIR: 0.0001,
      RESTITUTION: 0.2,
      FRICTION_STATIC: 0.0001,
    },
    SUPER: {
      FORCE_MULTIPLIER: 25,
      DURATION: 6000,
      CONSTANT_FORCE: 0.03,
      DENSITY: 0.08,
      FRICTION: 0.0005,
      FRICTION_AIR: 0.00005,
      RESTITUTION: 0.08,
      FRICTION_STATIC: 0.00005,
    },
    ULTRA: {
      FORCE_MULTIPLIER: 40,
      DURATION: 6000,
      CONSTANT_FORCE: 0.06,
      DENSITY: 0.24,
      FRICTION: 0,
      FRICTION_AIR: 0.00003,
      RESTITUTION: 0.04,
      FRICTION_STATIC: 0.0006,
    }
  },
  VOID: {
    BASIC: {
      DELETIONS: 2,
      BOUNCE_FORCE: 0.015,
      INITIAL_SPEED: 8,
      DENSITY: 0.004,
      FRICTION: 0.00002,
      FRICTION_AIR: 0.000002,
      RESTITUTION: 0.8,
      FRICTION_STATIC: 0.00002,
      BOUNCE_INTERVAL: 300,
      BOUNCE_DURATION: 10000,
      EDGE_BUFFER: 1.5,
      HORIZONTAL_FORCE: 0.02,
      VELOCITY_DAMPING: 0.8,
      MIN_BOUNCE_Y: -8,
      IS_SENSOR: false
    },
    SUPER: {
      DELETIONS: 2,
      BOUNCE_FORCE: 0,
      INITIAL_SPEED: 12,
      DENSITY: 0.01,
      FRICTION: 0,
      FRICTION_AIR: 0.0001,
      RESTITUTION: 0,
      FRICTION_STATIC: 0,
      BOUNCE_INTERVAL: 0,
      BOUNCE_DURATION: 0,
      EDGE_BUFFER: 1.2,
      HORIZONTAL_FORCE: 0,
      VELOCITY_DAMPING: 1,
      MIN_BOUNCE_Y: 0,
      IS_SENSOR: true
    },
    ULTRA: {
      DELETIONS: 10,
      BOUNCE_FORCE: 0,
      INITIAL_SPEED: 15,
      DENSITY: 0.01,
      FRICTION: 0,
      FRICTION_AIR: 0.0001,
      RESTITUTION: 0,
      FRICTION_STATIC: 0,
      BOUNCE_INTERVAL: 0,
      BOUNCE_DURATION: 0,
      EDGE_BUFFER: 1.2,
      HORIZONTAL_FORCE: 0,
      VELOCITY_DAMPING: 1,
      MIN_BOUNCE_Y: 0,
      IS_SENSOR: true
    }
  },
  SPAWN_PROTECTION_TIME: 500, // 500ms of spawn protection
  STORM: {
    BASIC: {
      FREQUENCY: 0.5,
      STRENGTH: 0.003,
      RADIUS: 50,
      DURATION: 5000, // 5 seconds
      DENSITY: 0.02,
      FRICTION: 0.05,
      FRICTION_AIR: 0.001,
      RESTITUTION: 0.3
    }
  }
};

// Define base power-up interface
export interface PowerUp {
  id: string;
  name: string;
  description: string;
  maxUses: number;
  icon: string;
  group: 'GRAVITY' | 'VOID' | 'ENVIRONMENTAL';
  level: 1 | 2 | 3;
  physics: {
    density?: number;
    friction?: number;
    frictionAir?: number;
    restitution?: number;
    frictionStatic?: number;
    isSensor?: boolean;
  };
  visual: {
    strokeColor: string;
    glowColor: string;
  };
  effects?: {
    deletionsRemaining?: number;
    bounceForce?: number;
    initialSpeed?: number;
    forceMultiplier?: number;
    duration?: number;
    constantForce?: number;
    strength?: number;
    radius?: number;
    frequency?: number;
  };
}

// Define all available power-ups
export const POWER_UPS: Record<string, PowerUp> = {
  // GRAVITY GROUP - Increases falling speed and impact
  HEAVY_BALL: {
    id: 'HEAVY_BALL',
    name: 'Heavy Ball',
    description: 'Makes the ball heavier and fall faster',
    maxUses: 5,
    icon: 'WeightIcon',
    group: 'GRAVITY',
    level: 1,
    physics: {
      density: POWER_UP_CONFIG.GRAVITY.HEAVY.DENSITY,
      friction: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION,
      frictionAir: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.GRAVITY.HEAVY.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.GRAVITY.HEAVY.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.3)',
    },
    effects: {
      forceMultiplier: POWER_UP_CONFIG.GRAVITY.HEAVY.FORCE_MULTIPLIER,
      duration: POWER_UP_CONFIG.GRAVITY.HEAVY.DURATION,
      constantForce: POWER_UP_CONFIG.GRAVITY.HEAVY.CONSTANT_FORCE
    }
  },
  SUPER_HEAVY_BALL: {
    id: 'SUPER_HEAVY_BALL',
    name: 'Super Heavy Ball',
    description: 'Makes the ball extremely heavy with devastating impact',
    maxUses: 3,
    icon: 'SuperWeightIcon',
    group: 'GRAVITY',
    level: 2,
    physics: {
      density: POWER_UP_CONFIG.GRAVITY.SUPER.DENSITY,
      friction: POWER_UP_CONFIG.GRAVITY.SUPER.FRICTION,
      frictionAir: POWER_UP_CONFIG.GRAVITY.SUPER.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.GRAVITY.SUPER.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.GRAVITY.SUPER.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.3)',
    },
    effects: {
      forceMultiplier: POWER_UP_CONFIG.GRAVITY.SUPER.FORCE_MULTIPLIER,
      duration: POWER_UP_CONFIG.GRAVITY.SUPER.DURATION,
      constantForce: POWER_UP_CONFIG.GRAVITY.SUPER.CONSTANT_FORCE
    }
  },
  ULTRA_HEAVY_BALL: {
    id: 'ULTRA_HEAVY_BALL',
    name: 'Ultra Heavy Ball',
    description: 'Creates an incredibly dense ball with maximum impact force',
    maxUses: 2,
    icon: 'UltraWeightIcon',
    group: 'GRAVITY',
    level: 3,
    physics: {
      density: POWER_UP_CONFIG.GRAVITY.ULTRA.DENSITY,
      friction: POWER_UP_CONFIG.GRAVITY.ULTRA.FRICTION,
      frictionAir: POWER_UP_CONFIG.GRAVITY.ULTRA.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.GRAVITY.ULTRA.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.GRAVITY.ULTRA.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.4)',
    },
    effects: {
      forceMultiplier: POWER_UP_CONFIG.GRAVITY.ULTRA.FORCE_MULTIPLIER,
      duration: POWER_UP_CONFIG.GRAVITY.ULTRA.DURATION,
      constantForce: POWER_UP_CONFIG.GRAVITY.ULTRA.CONSTANT_FORCE
    }
  },

  // VOID GROUP - Removes other balls on contact
  VOID_BALL: {
    id: 'VOID_BALL',
    name: 'Void Ball',
    description: 'Creates a bouncy ball that removes other balls on contact',
    maxUses: 3,
    icon: 'NegativeBallIcon',
    group: 'VOID',
    level: 1,
    physics: {
      density: POWER_UP_CONFIG.VOID.BASIC.DENSITY,
      friction: POWER_UP_CONFIG.VOID.BASIC.FRICTION,
      frictionAir: POWER_UP_CONFIG.VOID.BASIC.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.VOID.BASIC.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.VOID.BASIC.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#FF1493',
      glowColor: 'rgba(255, 20, 147, 0.5)',
    },
    effects: {
      deletionsRemaining: POWER_UP_CONFIG.VOID.BASIC.DELETIONS,
      bounceForce: POWER_UP_CONFIG.VOID.BASIC.BOUNCE_FORCE,
      initialSpeed: POWER_UP_CONFIG.VOID.BASIC.INITIAL_SPEED,
    }
  },
  SUPER_VOID_BALL: {
    id: 'SUPER_VOID_BALL',
    name: 'Super Void Ball',
    description: 'Creates a heavy void ball that falls straight down, removing balls in its path',
    maxUses: 2,
    icon: 'SuperNegativeBallIcon',
    group: 'VOID',
    level: 2,
    physics: {
      density: POWER_UP_CONFIG.VOID.SUPER.DENSITY,
      friction: POWER_UP_CONFIG.VOID.SUPER.FRICTION,
      frictionAir: POWER_UP_CONFIG.VOID.SUPER.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.VOID.SUPER.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.VOID.SUPER.FRICTION_STATIC,
      isSensor: POWER_UP_CONFIG.VOID.SUPER.IS_SENSOR
    },
    visual: {
      strokeColor: '#9400D3',
      glowColor: 'rgba(148, 0, 211, 0.6)',
    },
    effects: {
      deletionsRemaining: POWER_UP_CONFIG.VOID.SUPER.DELETIONS,
      bounceForce: POWER_UP_CONFIG.VOID.SUPER.BOUNCE_FORCE,
      initialSpeed: POWER_UP_CONFIG.VOID.SUPER.INITIAL_SPEED,
    }
  },
  ULTRA_VOID_BALL: {
    id: 'ULTRA_VOID_BALL',
    name: 'Ultra Void Ball',
    description: 'Creates an unstoppable void ball that can remove up to 10 balls in its path',
    maxUses: 1,
    icon: 'UltraNegativeBallIcon',
    group: 'VOID',
    level: 3,
    physics: {
      density: POWER_UP_CONFIG.VOID.ULTRA.DENSITY,
      friction: POWER_UP_CONFIG.VOID.ULTRA.FRICTION,
      frictionAir: POWER_UP_CONFIG.VOID.ULTRA.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.VOID.ULTRA.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.VOID.ULTRA.FRICTION_STATIC,
      isSensor: POWER_UP_CONFIG.VOID.ULTRA.IS_SENSOR
    },
    visual: {
      strokeColor: '#4B0082',
      glowColor: 'rgba(75, 0, 130, 0.7)',
    },
    effects: {
      deletionsRemaining: POWER_UP_CONFIG.VOID.ULTRA.DELETIONS,
      bounceForce: POWER_UP_CONFIG.VOID.ULTRA.BOUNCE_FORCE,
      initialSpeed: POWER_UP_CONFIG.VOID.ULTRA.INITIAL_SPEED,
    }
  },
  STORM_FIELD: {
    id: 'STORM_FIELD',
    name: 'Storm Field',
    description: 'Creates a chaotic storm that randomly pushes balls',
    maxUses: 2,
    icon: 'StormIcon',
    group: 'ENVIRONMENTAL',
    level: 1,
    physics: {
      density: POWER_UP_CONFIG.STORM.BASIC.DENSITY,
      friction: POWER_UP_CONFIG.STORM.BASIC.FRICTION,
      frictionAir: POWER_UP_CONFIG.STORM.BASIC.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.STORM.BASIC.RESTITUTION,
    },
    visual: {
      strokeColor: '#4B0082',
      glowColor: 'rgba(75, 0, 130, 0.5)',
    },
    effects: {
      frequency: POWER_UP_CONFIG.STORM.BASIC.FREQUENCY,
      strength: POWER_UP_CONFIG.STORM.BASIC.STRENGTH,
      radius: POWER_UP_CONFIG.STORM.BASIC.RADIUS,
      duration: POWER_UP_CONFIG.STORM.BASIC.DURATION
    }
  }
};

// Helper function to get power-ups by group
export const getPowerUpsByGroup = (group: PowerUp['group']) => 
  Object.values(POWER_UPS).filter(powerUp => powerUp.group === group);

// Type for power-up state
export interface PowerUpState {
  activePowerUpId: string | null;
  powerUps: Record<string, number>; // Maps power-up ID to remaining uses
}

// Initial state factory
export const createInitialPowerUpState = (startWithZero: boolean = true): PowerUpState => ({
  activePowerUpId: null,
  powerUps: Object.fromEntries(
    Object.entries(POWER_UPS).map(([id, powerUp]) => [id, startWithZero ? 0 : powerUp.maxUses])
  )
}); 