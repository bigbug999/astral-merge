export interface FlaskPhysics {
  gravity?: number;
  timeScale?: number;
  friction?: number;
  frictionAir?: number;
  frictionStatic?: number;
  restitution?: number;
  density?: number;
}

export interface Flask {
  id: FlaskId;
  name: string;
  description: string;
  icon: 'ChemistryFlaskIcon' | 'FlaskIcon' | 'FeatherIcon' | 'SparklesIcon' | 'BounceIcon';
  physics: FlaskPhysics;
  visual: {
    color: string;
    glowColor: string;
  };
}

export const FLASKS = {
  DEFAULT: {
    id: 'DEFAULT',
    name: 'Default Flask',
    description: 'Standard physics behavior',
    icon: 'ChemistryFlaskIcon',
    physics: {
      gravity: 1.75,
      timeScale: 1.35,
      friction: 0.01,
      frictionAir: 0.0002,
      restitution: 0.3,
      frictionStatic: 0.02,
      density: 0.02
    },
    visual: {
      color: '#a78bfa',
      glowColor: 'rgba(167, 139, 250, 0.5)'
    }
  },
  LOW_GRAVITY: {
    id: 'LOW_GRAVITY',
    name: 'Low Gravity',
    description: 'Reduces gravity for all objects',
    icon: 'FeatherIcon',
    physics: {
      gravity: 0.15,
      timeScale: 1.2,
      frictionAir: 0.00001,
      restitution: 0.95,
      friction: 0.001
    },
    visual: {
      color: '#a78bfa',
      glowColor: 'rgba(167, 139, 250, 0.5)'
    }
  },
  NO_FRICTION: {
    id: 'NO_FRICTION',
    name: 'Frictionless',
    description: 'Removes friction from all surfaces',
    icon: 'SparklesIcon',
    physics: {
      friction: 0.0001,
      frictionAir: 0.00001,
      frictionStatic: 0.0001
    },
    visual: {
      color: '#60a5fa',
      glowColor: 'rgba(96, 165, 250, 0.5)'
    }
  },
  BOUNCY: {
    id: 'BOUNCY',
    name: 'Super Bounce',
    description: 'Makes everything more bouncy',
    icon: 'BounceIcon',
    physics: {
      restitution: 0.85,
      friction: 0.003,
      density: 0.008,
      frictionAir: 0.0002
    },
    visual: {
      color: '#4ade80',
      glowColor: 'rgba(74, 222, 128, 0.5)'
    }
  }
} as const;

export type FlaskId = 'DEFAULT' | 'LOW_GRAVITY' | 'NO_FRICTION' | 'BOUNCY';

export interface FlaskState {
  activeFlaskId: FlaskId | null;
}

export const createInitialFlaskState = (): FlaskState => ({
  activeFlaskId: null
}); 