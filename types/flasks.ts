export interface FlaskPhysics {
  gravity?: number;
  timeScale?: number;
  friction?: number;
  frictionAir?: number;
  frictionStatic?: number;
  restitution?: number;
  density?: number;
  scale?: number;
}

export interface Flask {
  id: FlaskId;
  name: string;
  description: string;
  icon: 'FlaskConicalIcon' | 'FlaskIcon' | 'FeatherIcon' | 'SparklesIcon' | 'BounceIcon' | 'ShrinkIcon';
  physics: FlaskPhysics;
  visual: {
    color: string;
    glowColor: string;
  };
}

export type FlaskSizeId = 'DEFAULT' | 'SHRINK' | 'EXTRA_SHRINK';
export type FlaskEffectId = 'DEFAULT' | 'LOW_GRAVITY' | 'NO_FRICTION';

export const FLASK_SIZES = {
  DEFAULT: {
    id: 'DEFAULT',
    name: 'Default Size',
    description: 'Standard ball size',
    icon: 'FlaskIcon',
    physics: {
      scale: 1
    }
  },
  SHRINK: {
    id: 'SHRINK',
    name: 'Small Size',
    description: 'Makes all balls 25% smaller',
    icon: 'ShrinkIcon',
    physics: {
      scale: 0.75
    }
  },
  EXTRA_SHRINK: {
    id: 'EXTRA_SHRINK',
    name: 'Extra Small',
    description: 'Makes all balls 50% smaller',
    icon: 'ShrinkIcon',
    physics: {
      scale: 0.5
    }
  }
} as const;

export const FLASK_EFFECTS = {
  DEFAULT: {
    id: 'DEFAULT',
    name: 'Default Effect',
    description: 'Standard physics behavior',
    icon: 'FlaskConicalIcon',
    physics: {
      gravity: 1.75,
      timeScale: 1.35,
      friction: 0.01,
      frictionAir: 0.0002,
      restitution: 0.3,
      frictionStatic: 0.02,
      density: 0.02
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
      friction: 0.001,
      frictionAir: 0.00001,
      restitution: 0.65,
      frictionStatic: 0.001,
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
      frictionAir: 0.00001,
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