# Visual Hierarchy Guide

## Root Layout Structure
- `<html>` (with Geist fonts)
  - `<body>` (antialiased)
    - Main Container (`min-h-[100dvh]` with dark background)

## Game Screen Layout
1. Main Wrapper
   ```
   <div class="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-900 p-4">
   ```

2. Content Container
   ```
   <div class="w-full max-w-sm flex flex-col gap-4">
   ```

### Game Container Hierarchy (Top to Bottom)

1. **Game Area Container** (Primary Play Area)
   ```
   <div class="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800">
   ```
   - z-index layers (from back to front):
     1. Background Layer (z-0)
     2. Matter.js Canvas (z-10)
     3. Touch Prevention Layer (z-20)
     4. UI Overlay Elements (z-50)

2. **Top UI Bar** (z-50)
   ```
   <div class="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5">
   ```
   - Left Group:
     - Preview Circle
     - Score Display
   - Right Group:
     - Flask Controls

3. **Game Canvas**
   - Matter.js Render Canvas
   - Full viewport within game container
   - Handles all physics and gameplay elements

4. **Touch Prevention Layer**
   ```
   <div class="absolute inset-0 touch-none pointer-events-none">
   ```

### Below Game Container Elements

1. **Power-ups Section**
   ```
   <div class="grid grid-cols-7 gap-2 w-full">
   ```
   - Gravity Power-ups (Left)
   - Divider
   - Void Power-ups (Right)

2. **Debug UI** (when enabled)
   - Performance metrics
   - Current ball info
   - Power-up status

3. **Color Legend**
   ```
   <div class="w-full max-w-sm mt-4">
   ```
   - Expandable section
   - Color tier information

### Modal Overlays

1. **Game Over Screen** (z-50)
   ```
   <div class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
   ```
   - Modal content centered
   - Score display
   - Restart button

### Z-Index Reference
- Base Game Content: 0-10
- Game Canvas: 10
- Touch Prevention: 20
- UI Elements: 50
- Modal Overlays: 50

### Safe Areas for New Components

1. **Top Bar Extensions**
   - Append to existing top bar flex container
   - Use gap-1.5 for consistent spacing

2. **Side UI Elements**
   - Position absolute relative to game container
   - Use left-2/right-2 for consistent margins

3. **Bottom Stack**
   - Add to main flex column after game container
   - Use gap-4 for consistent spacing

4. **Overlay Elements**
   - Use fixed positioning with z-50
   - Include backdrop-blur-sm for depth

### Component Placement Guidelines

1. **In-Game UI**
   - Position absolute within game container
   - Use z-50 to stay above canvas
   - Maintain touch-none class for game area

2. **Control Elements**
   - Add to existing UI groups when possible
   - Follow established spacing patterns
   - Preserve touch event handling

3. **Information Displays**
   - Use consistent padding (p-4)
   - Follow established color scheme
   - Maintain max-w-sm constraint
