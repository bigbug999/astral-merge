// Add the turbulence interface
interface TurbulenceConfig {
  strength: number;
  frequency: number;
  radius: number;
  verticalBias: number;
}

export interface FlaskPhysics {
  readonly density: number;
  readonly friction: number;
  readonly frictionAir: number;
  readonly restitution: number;
  readonly frictionStatic: number;
  readonly gravity?: number;
  readonly timeScale?: number;
  readonly isSensor?: boolean;
  readonly turbulence?: {
    strength: number;
    frequency: number;
    verticalBias: number;
    radius: number;
  };
}

export type FlaskSizeId = 'DEFAULT' | 'SHRINK' | 'EXTRA_SHRINK';
export type FlaskEffectId = 'DEFAULT' | 'LOW_GRAVITY' | 'NO_FRICTION';

export interface Flask {
  id: FlaskSizeId | FlaskEffectId;
  name: string;
  description: string;
  icon: 'TestTubeIcon' | 'FlaskConicalIcon' | 'FlaskIcon' | 'FeatherIcon' | 'SparklesIcon' | 'BounceIcon' | 'ShrinkIcon' | 'BookMarkedIcon' | 'FlaskRoundIcon' | 'StormIcon';
  physics: FlaskPhysics;
}

export const FLASK_SIZES = {
  DEFAULT: {
    id: 'DEFAULT',
    name: 'Default Size',
    description: 'Standard ball size',
    icon: 'TestTubeIcon',
    physics: {
      scale: 1
    }
  },
  SHRINK: {
    id: 'SHRINK',
    name: 'Small Size',
    description: 'Makes all balls 15% smaller',
    icon: 'FlaskConicalIcon',
    physics: {
      scale: 0.85
    }
  },
  EXTRA_SHRINK: {
    id: 'EXTRA_SHRINK',
    name: 'Extra Small',
    description: 'Makes all balls 30% smaller',
    icon: 'FlaskRoundIcon',
    physics: {
      scale: 0.7
    }
  }
} as const;

export const FLASK_EFFECTS = {
  DEFAULT: {
    id: 'DEFAULT',
    name: 'Default',
    description: 'Normal flask behavior',
    icon: 'FlaskIcon',
    physics: {
      density: 0.02,
      friction: 0.005,
      frictionAir: 0.0002,
      restitution: 0.3,
      frictionStatic: 0.02,
      isSensor: false,
      gravity: 1,
      timeScale: 1
    }
  },
  LOW_GRAVITY: {
    id: 'LOW_GRAVITY',
    name: 'Low Gravity',
    description: 'Reduces gravity for all objects',
    icon: 'FeatherIcon',
    physics: {
      gravity: 0.15,
      timeScale: 1.6,
      friction: 0.08,
      frictionAir: 0.002,
      restitution: 0.65,
      frictionStatic: 0.15,
      density: 0.015
    }
  },
  NO_FRICTION: {
    id: 'NO_FRICTION',
    name: 'Frictionless',
    description: 'Removes friction from all surfaces',
    icon: 'SparklesIcon',
    physics: {
      gravity: 1.75,
      timeScale: 1.35,
      friction: 0.0001,
      frictionAir: 0.0003,
      frictionStatic: 0.0001,
      restitution: 0.4,
      density: 0.02
    }
  }
} as const;

export interface FlaskState {
  size: FlaskSizeId;
  effect: FlaskEffectId;
}

export const createInitialFlaskState = (): FlaskState => ({
  size: 'DEFAULT',
  effect: 'DEFAULT'
}); 