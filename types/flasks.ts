// Add the turbulence interface
interface TurbulenceConfig {
  strength: number;
  frequency: number;
  radius: number;
  verticalBias: number;
}

export interface FlaskPhysics {
  gravity?: number;
  timeScale?: number;
  friction?: number;
  frictionAir?: number;
  frictionStatic?: number;
  restitution?: number;
  density?: number;
  scale?: number;
  turbulence?: TurbulenceConfig;
}

export type FlaskSizeId = 'DEFAULT' | 'SHRINK' | 'EXTRA_SHRINK';
export type FlaskEffectId = 'DEFAULT' | 'LOW_GRAVITY' | 'NO_FRICTION' | 'STORM';

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
    name: 'Default Effect',
    description: 'Standard physics behavior',
    icon: 'BookMarkedIcon',
    physics: {
      gravity: 1.75,
      timeScale: 1.35,
      friction: 0.05,
      frictionAir: 0.001,
      restitution: 0.3,
      frictionStatic: 0.1,
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
  },
  STORM: {
    id: 'STORM',
    name: 'Storm Field',
    description: 'Creates chaotic turbulence that affects all balls',
    icon: 'StormIcon',
    physics: {
      gravity: 1.75,
      timeScale: 1.6,
      friction: 0.015,
      frictionAir: 0.0003,
      restitution: 0.6,
      frictionStatic: 0.03,
      density: 0.02,
      turbulence: {
        frequency: 0.9,
        strength: 0.025,
        radius: 150,
        verticalBias: 0.4
      }
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