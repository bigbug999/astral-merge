// Configuration constants for power-ups
export const POWER_UP_CONFIG = {
  GRAVITY: {
    HEAVY: {
      FORCE_MULTIPLIER: 25,
      DURATION: 6000,
      CONSTANT_FORCE: 0.03,
      DENSITY: 0.08,
      FRICTION: 0.0005,
      FRICTION_AIR: 0.00005,
      RESTITUTION: 0.08,
      FRICTION_STATIC: 0.00005,
    },
    SUPER: {
      FORCE_MULTIPLIER: 40,
      DURATION: 6000,
      CONSTANT_FORCE: 0.06,
      DENSITY: 0.24,
      FRICTION: 0,
      FRICTION_AIR: 0.00003,
      RESTITUTION: 0.04,
      FRICTION_STATIC: 0.0006,
    },
    ULTRA: {
      FORCE_MULTIPLIER: 80,
      DURATION: 6000,
      CONSTANT_FORCE: 0.12,
      DENSITY: 0.48,
      FRICTION: 0,
      FRICTION_AIR: 0.00002,
      RESTITUTION: 0.02,
      FRICTION_STATIC: 0.0004,
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
  TIER_UP: {
    BASIC: {
      TIER_INCREASE: 1,
      DURATION: 5000,
      DENSITY: 0.001,
      FRICTION: 0.1,
      FRICTION_AIR: 0.001,
      RESTITUTION: 0.5,
      FRICTION_STATIC: 0.5,
    },
    SUPER: {
      TIER_INCREASE: 2,
      DURATION: 5000,
      DENSITY: 0.001,
      FRICTION: 0.1,
      FRICTION_AIR: 0.001,
      RESTITUTION: 0.5,
      FRICTION_STATIC: 0.5,
    },
    ULTRA: {
      TIER_INCREASE: 3,
      DURATION: 5000,
      DENSITY: 0.001,
      FRICTION: 0.1,
      FRICTION_AIR: 0.001,
      RESTITUTION: 0.5,
      FRICTION_STATIC: 0.5,
    }
  },
};

// Define base power-up interface
export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: 1 | 2 | 3;
  maxUses: number;
  group: 'GRAVITY' | 'VOID' | 'UPGRADE';
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
    tierIncrease?: number;
  };
}

// Define all available power-ups
export const POWER_UPS: Record<string, PowerUp> = {
  // GRAVITY GROUP - Increases falling speed and impact
  HEAVY_BALL: {
    id: 'HEAVY_BALL',
    name: 'Heavy Ball',
    description: 'Increases ball mass by 300%. Recharges every 3 merges.',
    maxUses: 3,
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
    description: 'Increases ball mass by 600%. Recharges every 4 merges.',
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
    description: 'Increases ball mass by 1000%. Recharges every 5 merges.',
    maxUses: 3,
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
    description: 'Creates a ball that absorbs same-tier balls within 100px. Recharges every 3 merges.',
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
    description: 'Creates a ball that absorbs same-tier balls within 150px. Recharges every 4 merges.',
    maxUses: 3,
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
    description: 'Creates a ball that absorbs same-tier balls within 200px. Recharges every 5 merges.',
    maxUses: 3,
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

  TIER_UP: {
    id: 'TIER_UP',
    name: 'Tier Up',
    description: 'Upgrades ball by 1 tier. Recharges every 5 merges.',
    maxUses: 3,
    icon: 'TierUpIcon',
    group: 'UPGRADE',
    level: 1,
    physics: {
      density: POWER_UP_CONFIG.TIER_UP.BASIC.DENSITY,
      friction: POWER_UP_CONFIG.TIER_UP.BASIC.FRICTION,
      frictionAir: POWER_UP_CONFIG.TIER_UP.BASIC.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.TIER_UP.BASIC.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.TIER_UP.BASIC.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.3)',
    },
    effects: {
      tierIncrease: POWER_UP_CONFIG.TIER_UP.BASIC.TIER_INCREASE,
      duration: POWER_UP_CONFIG.TIER_UP.BASIC.DURATION,
    }
  },

  SUPER_TIER_UP: {
    id: 'SUPER_TIER_UP',
    name: 'Super Tier Up',
    description: 'Upgrades ball by 2 tiers. Recharges every 6 merges.',
    maxUses: 3,
    icon: 'SuperTierUpIcon',
    group: 'UPGRADE',
    level: 2,
    physics: {
      density: POWER_UP_CONFIG.TIER_UP.SUPER.DENSITY,
      friction: POWER_UP_CONFIG.TIER_UP.SUPER.FRICTION,
      frictionAir: POWER_UP_CONFIG.TIER_UP.SUPER.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.TIER_UP.SUPER.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.TIER_UP.SUPER.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.3)',
    },
    effects: {
      tierIncrease: POWER_UP_CONFIG.TIER_UP.SUPER.TIER_INCREASE,
      duration: POWER_UP_CONFIG.TIER_UP.SUPER.DURATION,
    }
  },

  ULTRA_TIER_UP: {
    id: 'ULTRA_TIER_UP',
    name: 'Ultra Tier Up',
    description: 'Upgrades ball by 3 tiers. Recharges every 7 merges.',
    maxUses: 3,
    icon: 'UltraTierUpIcon',
    group: 'UPGRADE',
    level: 3,
    physics: {
      density: POWER_UP_CONFIG.TIER_UP.ULTRA.DENSITY,
      friction: POWER_UP_CONFIG.TIER_UP.ULTRA.FRICTION,
      frictionAir: POWER_UP_CONFIG.TIER_UP.ULTRA.FRICTION_AIR,
      restitution: POWER_UP_CONFIG.TIER_UP.ULTRA.RESTITUTION,
      frictionStatic: POWER_UP_CONFIG.TIER_UP.ULTRA.FRICTION_STATIC,
    },
    visual: {
      strokeColor: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.4)',
    },
    effects: {
      tierIncrease: POWER_UP_CONFIG.TIER_UP.ULTRA.TIER_INCREASE,
      duration: POWER_UP_CONFIG.TIER_UP.ULTRA.DURATION,
    }
  },
};

// Helper function to get power-ups by group
export const getPowerUpsByGroup = (group: PowerUp['group']) => 
  Object.values(POWER_UPS).filter(powerUp => powerUp.group === group);

// Type for power-up state
export interface PowerUpState {
  activePowerUpId: string | null;
  powerUps: Record<string, number>; // Maps power-up ID to remaining uses
  slots: (string | null)[]; // Array of power-up IDs in slots, null for empty slots
}

// Initial state factory
export const createInitialPowerUpState = (startWithZero: boolean = true): PowerUpState => ({
  activePowerUpId: null,
  powerUps: Object.fromEntries(
    Object.entries(POWER_UPS).map(([id, powerUp]) => [id, startWithZero ? 0 : powerUp.maxUses])
  ),
  slots: Array(6).fill(null) // Initialize with 6 empty slots
}); 