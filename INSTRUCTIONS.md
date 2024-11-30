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

### Memory and Performance Optimization
- Strict memory management for physics bodies
  - Proper cleanup of removed bodies
  - Texture cleanup for circle sprites
  - Reference clearing for removed objects
  - Static body monitoring and cleanup

- Body Management System
  - Tracking of wall bodies with wallBodiesRef
  - Special case handling for danger zone and current ball
  - Collision queue for merge operations
  - Safety checks for body existence before operations

- Static Body Control
  - Maximum of 3 wall bodies
  - Labeled walls for tracking ('wall-bottom', 'wall-left', 'wall-right')
  - Monitoring system for detecting extra static bodies
  - Automatic cleanup of unauthorized static bodies

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

- Collision Optimization
  - Collision queue for merge operations
  - Reduced physics iterations for sleeping bodies
  - Performance tuning for large bodies
  - Proper cleanup after collisions

### Circle Management
- Matter.js body creation and removal
  - Safe body removal with reference clearing
  - Texture cleanup for removed circles
  - Proper cleanup sequence for merging
  - Prevention of accessing cleaned up properties

- State Management
  - Tracking of body status (merging, dropped, etc.)
  - Safety checks before operations
  - Proper cleanup of power-up states
  - Prevention of multiple merges

### Game State
- Score tracking
- Game over detection
- State persistence (optional)

### Performance Considerations
- Memory Management
  - Proper cleanup of removed bodies
  - Texture resource management
  - Reference clearing for garbage collection
  - Static body monitoring and control

- Physics Optimization
  - Collision queue implementation
  - Reduced physics iterations where possible
  - Performance tuning for larger bodies
  - Sleep states for static objects

- Render Optimization
  - Efficient texture handling
  - Proper cleanup of visual resources
  - Optimized wall rendering
  - Performance monitoring with FPS tracking

### Safety Mechanisms
- Body Validation
  - Existence checks before operations
  - Type verification for bodies
  - Position validation
  - State verification

- Error Prevention
  - Safe cleanup procedures
  - Reference validation
  - Proper error handling
  - Logging for debugging

- Special Cases
  - Danger zone protection
  - Current ball handling
  - Power-up state preservation
  - Merge operation safety

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