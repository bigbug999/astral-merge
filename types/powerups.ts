// Define base power-up interface
export interface PowerUp {
  id: string;
  name: string;
  description: string;
  maxUses: number;
  icon: string; // Component name to be used
  group: 'GRAVITY' | 'VOID';
  level: 1 | 2 | 3;
  physics: {
    density?: number;
    friction?: number;
    frictionAir?: number;
    restitution?: number;
    frictionStatic?: number;
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
  };
}

// Define all available power-ups
export const POWER_UPS: Record<string, PowerUp> = {
  // GRAVITY GROUP - Increases falling speed and impact
  HEAVY_BALL: {
    id: 'HEAVY_BALL',
    name: 'Heavy Ball',
    description: 'Makes the ball heavier and fall faster',
    maxUses: 10,
    icon: 'AnvilIcon',
    group: 'GRAVITY',
    level: 1,
    physics: {
      density: 0.025,
      friction: 0.001,
      frictionAir: 0.0001,
      restitution: 0.2,
      frictionStatic: 0.0001,
    },
    visual: {
      strokeColor: '#ffffff',
      glowColor: 'rgba(255, 255, 255, 0.3)',
    },
    effects: {
      forceMultiplier: 20,
      duration: 5000,
      constantForce: 0.02
    }
  },
  SUPER_HEAVY_BALL: {
    id: 'SUPER_HEAVY_BALL',
    name: 'Super Heavy Ball',
    description: 'Makes the ball extremely heavy with devastating impact',
    maxUses: 5,
    icon: 'SuperAnvilIcon',
    group: 'GRAVITY',
    level: 2,
    physics: {
      density: 0.075,
      friction: 0.0005,
      frictionAir: 0.00005,
      restitution: 0.1,
      frictionStatic: 0.00005,
    },
    visual: {
      strokeColor: '#ff0000',
      glowColor: 'rgba(255, 0, 0, 0.3)',
    },
    effects: {
      forceMultiplier: 50,
      duration: 7000,
      constantForce: 0.06
    }
  },
  ULTRA_HEAVY_BALL: {
    id: 'ULTRA_HEAVY_BALL',
    name: 'Ultra Heavy Ball',
    description: 'Creates an incredibly dense ball with maximum impact force',
    maxUses: 3,
    icon: 'UltraAnvilIcon',
    group: 'GRAVITY',
    level: 3,
    physics: {
      density: 0.225,
      friction: 0.00025,
      frictionAir: 0.000025,
      restitution: 0.05,
      frictionStatic: 0.000025,
    },
    visual: {
      strokeColor: '#ff00ff',
      glowColor: 'rgba(255, 0, 255, 0.4)',
    },
    effects: {
      forceMultiplier: 100,
      duration: 10000,
      constantForce: 0.18
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
      density: 0.005,
      friction: 0.00001,
      frictionAir: 0.000001,
      restitution: 0.98,
      frictionStatic: 0.00001,
    },
    visual: {
      strokeColor: '#FF1493',
      glowColor: 'rgba(255, 20, 147, 0.5)',
    },
    effects: {
      deletionsRemaining: 2,
      bounceForce: 0.03,
      initialSpeed: 8,
    }
  },
  // Placeholder for future void power-ups
  /*
  SUPER_VOID_BALL: {
    id: 'SUPER_VOID_BALL',
    level: 2,
    // Will have increased deletion limit and stronger effects
  },
  ULTRA_VOID_BALL: {
    id: 'ULTRA_VOID_BALL',
    level: 3,
    // Will have maximum deletion capabilities
  }
  */
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
export const createInitialPowerUpState = (): PowerUpState => ({
  activePowerUpId: null,
  powerUps: Object.fromEntries(
    Object.entries(POWER_UPS).map(([id, powerUp]) => [id, powerUp.maxUses])
  )
}); 