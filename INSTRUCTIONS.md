# Astral Merge - Game Development Instructions

## Game Overview

### Game Title
Astral Merge

### Game Objective
Players combine matching circles to create larger ones, score points, and strategically manage the play area to avoid overflow.

## Gameplay Mechanics

### Circle Controls
- **Drop Mechanism**: Players drag left/right to position circles
- **Release Action**: Letting go drops the circle into the container
- **Movement**: Circles fall with physics-based motion and bounce realistically

### Merging System
- **Basic Merge**: Two identical circles combine on contact
- **Progression**: Merged circles evolve to next size/color tier
- **Size/Color Tiers**:
  1. Small Blue
  2. Medium Green
  3. Large Red
  4. Extra Large Yellow
  5. Giant Purple

### Scoring Rules
- Points awarded for successful merges
- Higher tiers yield increased points
- Combo system for chain reactions (optional enhancement)

### Game Over Conditions
- Container overflow triggers game end
- Final score displayed
- Restart option provided

## UI Components

### Main Game Screen
- Central container for gameplay
- Top preview area for next circle
- Score display (top-right)
- Restart button (bottom)

### Game Over Screen
- Final score presentation
- "Play Again" button
- Best score display (optional)

## Technical Stack

### Core Technologies
- **Next.js**: Frontend framework and routing
  - App Router for navigation
  - Server Components for optimization
  - API Routes for backend functionality

- **Three.js**: 3D graphics
  - WebGL rendering
  - Circle rendering
  - Visual effects and animations

- **Matter.js**: Physics Engine
  - Gravity and collision detection
  - Circle movement and interactions
  - Container boundaries
  - Merging mechanics

- **shadcn/ui**: UI Components
  - Game menus and overlays
  - Score displays
  - Settings panels
  - Modal dialogs
  - Buttons and controls

### Additional Libraries
- React Three Fiber: Three.js React bindings
- React Three Drei: Helper components
- Tailwind CSS: Styling
- TypeScript: Type safety

## Technical Requirements

### Physics Implementation (Matter.js)
- Gravity simulation with configurable parameters
  - Adjustable fall speed
  - Bounce dampening
  - Air resistance

- Collision detection between:
  - Circle-to-circle for merging
  - Circle-to-wall for boundaries
  - Circle-to-floor for landing

- Physics Properties:
  - Restitution (bounciness)
  - Friction (surface resistance)
  - Air friction (drag)
  - Density (mass)

- Container Mechanics:
  - Static boundary walls
  - Proper collision response
  - No physics leaking

### Circle Management
- Matter.js body creation and removal
- Physics body synchronization with visual representation
- Proper cleanup on merge or removal
- Smooth transitions between states:
  - Dragging state (no physics)
  - Dropped state (physics enabled)
  - Merging state (physics transition)

### Game State
- Score tracking
- Game over detection
- State persistence (optional)

## Development Priorities

1. Core Physics Engine
   - Implement basic physics for circle movement
   - Set up collision detection system
   - Create boundary constraints

2. Merging Mechanics
   - Develop circle combination logic
   - Implement size/color progression
   - Add merge animations

3. User Interface
   - Design and implement main game screen
   - Create game over screen
   - Add score display

4. Game Flow
   - Implement circle spawning
   - Add scoring system
   - Create game over detection

5. Polish & Enhancement
   - Add sound effects
   - Implement visual feedback
   - Add particle effects for merges
   - Include tutorial elements

## Additional Notes

### Performance Considerations
- Optimize physics calculations
- Manage object pooling for circles
- Efficient collision detection

### Future Enhancements
- Power-ups
- Different game modes
- Achievements system
- Online leaderboard
- Daily challenges

### Art Requirements
- Circle designs for each tier
- Container background
- UI elements
- Particle effects
- Animation assets

### Sound Requirements
- Drop sound
- Merge sound
- Game over sound
- Background music
- UI feedback sounds 