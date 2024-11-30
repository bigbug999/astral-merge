export interface Flask {
  id: string;
  name: string;
  description: string;
  icon: string;
  physics: {
    gravity?: number;
    friction?: number;
    frictionAir?: number;
    restitution?: number;
    timeScale?: number;
    density?: number;
  };
  visual: {
    color: string;
    glowColor: string;
  };
}

export const FLASKS: Record<string, Flask> = {
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
    description: 'Makes everything extremely bouncy',
    icon: 'BounceIcon',
    physics: {
      restitution: 0.98,
      friction: 0.001,
      density: 0.005,
      frictionAir: 0.0001
    },
    visual: {
      color: '#4ade80',
      glowColor: 'rgba(74, 222, 128, 0.5)'
    }
  }
};

export interface FlaskState {
  activeFlaskId: string | null;
}

export const createInitialFlaskState = (): FlaskState => ({
  activeFlaskId: null
}); 