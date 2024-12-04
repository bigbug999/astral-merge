# Game Systems Design Document

## Table of Contents
1. [Core Run System](#core-run-system)
3. [Talisman System](#talisman-system)
4. [Power-Up System](#power-up-system)
5. [Flask System](#flask-system)
6. [Shop & Economy](#shop--economy)
7. [Scoring & Advancement](#scoring--advancement)
8. [Material & Edition System](#material--edition-system)

## Core Run System

### Run Structure
1. **Score Milestones**
   - Shop appears every 10,000 points
   - Mini-boss challenges at 25,000 points
   - Major boss encounters at 100,000 points
   - Special events at milestone streaks

2. **Difficulty Scaling**
   - Gradually increasing marble spawn speed
   - Higher tier requirements over time
   - Environmental hazards unlock with score
   - Challenge modifiers activate at thresholds

### Challenge Modes
- **Standard Run**
  - Score-based progression
  - Natural difficulty curve
  - Endless gameplay
  - Personal best tracking


- **Boss Encounter**
  - Dificult marble spawns 
  - Boss specific mechanics
  - Boss specific drop rewards

### Score Opportunities
1. **Score System**
   - Base points from merges
   - Combo multiplier (increases with consecutive merges)
   - Chain reaction multipliers
   - Score multiplier caps at 10x
   - Multiplier resets if no merge within 3 seconds

2. **Currency System**
   - Fixed stardust amount per merge (not affected by multipliers)
   - Higher tier merges give more stardust
   - Boss drops give bonus stardust
   - No combo bonuses for currency

### Score Multipliers
1. **Combo System**
   - 2x after 3 consecutive merges
   - 3x after 5 consecutive merges
   - 5x after 8 consecutive merges
   - 10x after 12 consecutive merges

2. **Score Boosters**
   - Talisman score multipliers stack additively
   - Perfect merges add 0.5x to multiplier
   - Chain reactions add 0.2x per chain
   - Environmental triggers add 0.3x

### Currency Generation
1. **Base Stardust**
   - Tier 1 merge: 1 stardust
   - Tier 2 merge: 3 stardust
   - Tier 3 merge: 9 stardust
   - Each higher tier: 3x previous tier

2. **Special Sources**
   - Boss drops: 50-200 stardust
   - Shop reroll cost: 25 stardust
   - Emergency shop: 100 stardust
   - Power-up recharge: 50 stardust

### Shop Appearances
- First shop at 10,000 points
- Subsequent shops every 10,000 points
- Special merchant at 50,000 points
- Emergency shop option (costs victory crystals)


## Talisman System

### Artifact Categories
1. **Passive Talismans**
   - Permanent run modifiers
   - Marble enhancements
   - Special rules
   - Synergy bonuses

2. **Active Artifacts**
   - Triggered abilities
   - Cooldown mechanics
   - Energy costs
   - Combo potential

### Talisman Slots
- Base 3 amulet slots
- Unlockable positions
- Resonance bonuses
- Synergy requirements

### Notable Artifacts
1. **Merge Talismans**
   - Echo Stone (splits on perfect merge)
   - Chain Resonator (extended combos)
   - Fusion Crystal (tier skip chance)
   - Chronos Shard (slow motion merges)

2. **Fortune Artifacts**
   - Midas Touch (bonus scoring)
   - Merchant's Charm (shop discounts)
   - Fortune Crystal (rare find rate up)
   - Prosperity Stone (extra rewards)

3. **Mystic Talismans**
   - Phase Crystal (marble phasing)
   - Gravity Stone (attraction field)
   - Storm Gem (environmental chaos)
   - Mirror Shard (marble duplication)

## Power-Up System

### Core Power-Ups
1. **Transformation Power-Ups**
   - Splitter (splits marble into same-tier copies)
   - Fusion Core (forces nearby same-tier merges)
   - Tier Shifter (temporary tier transformation)
   - Duration scales with score milestones

2. **Effect Power-Ups**
   - Rainbow Marble (universal merging)
   - Chain Reactor (merge-triggered explosions)
   - Time Bubble (local slow-motion)
   - Power scales with score thresholds

### Power-Up Acquisition
- bought in the shop with stardust
- fits into open slots in the power-up bar



## Flask System

### Flask Categories
1. **Physics Flasks**
   - Quantum Flask (micro-portals)
   - Time Dilation (selective time manipulation)
   - Magnetic Field (same-tier attraction)
   - Bounce Chamber (high restitution)

2. **Environmental Flasks**
   - Vortex (center-pulling spiral)
   - Phase Shift (temporary collision bypass)
   - Gravity Well (localized gravity changes)
   - Storm Field (chaos environment)

### Flask Mechanics
1. **Usage Rules**
   - One active flask at a time
   - Cooldown between uses
   - Area of effect indicators
   - Duration based on score tier

2. **Enhancement System**
   - Duration upgrades
   - Effect intensity
   - Area of effect
   - Cooldown reduction

### Flask Combinations
- Sequential effects
- Residual interactions
- Environmental chain reactions
- Special combinations

## Shop & Economy

### Currency Types
- **Stardust** (run currency)
- **Ancient Shards** (unlock permanent shop items)

### Shop Types
1. **Run Shop**
   - Marble enhancements
   - Temporary enchantments
   - Talismans & artifacts
   - Special offers

2. **Permanent Shop**
   - Talisman unlocks
   - Bag expansions
   - Visual upgrades

### Reroll System
- Limited rerolls per shop
- Increasing costs
- Strategic timing
- Special shop events

## Scoring & Advancement

### Scoring Components
1. **Base Scoring**
   - Merge value
   - Tier multipliers
   - Chain bonuses
   - Perfect timing

2. **Multipliers**
   - Talisman effects
   - Streak bonuses
   - Challenge modifiers
   - Special events

### Advancement System
1. **Victory Conditions**
   - Ante clearance
   - Boss defeats
   - Special challenges
   - Perfect runs

2. **Progression Rewards**
   - New talismans
   - Marble types
   - Shop items
   - Special modes

### Challenge Targets
- Daily objectives
- Weekly missions
- Season goals
- Achievement hunting

### Mastery System
- Marble type mastery
- Talisman expertise
- Challenge completion
- Perfect run tracking

## Material & Edition System

### Material Types
1. **Base Materials**
   - **Metallic**
     - Chrome, Bronze, Gold, Silver
     - Reflective properties
     - Metallic sound effects
     - Unique merge particles
   
   - **Crystal**
     - Ruby, Sapphire, Emerald, Diamond
     - Light refraction
     - Crystal chime sounds
     - Sparkle effects
   
   - **Element**
     - Fire, Ice, Lightning, Earth
     - Environmental effects
     - Elemental sounds
     - Themed particles

### Edition Rarity
1. **Common (65%)**
   - Standard
   - Polished
   - Weathered
   - Basic patterns

2. **Rare (25%)**
   - Shimmering
   - Prismatic
   - Patterned
   - Resonating

3. **Epic (8%)**
   - Ethereal
   - Celestial
   - Void-touched
   - Elemental

4. **Legendary (2%)**
   - Ancient
   - Divine
   - Mythical
   - Transcendent

### Visual Effects
1. **Surface Properties**
   - Material-specific shaders
   - Dynamic reflections
   - Particle systems
   - Trail effects

2. **Merge Effects**
   - Rarity-based explosions
   - Material interactions
   - Sound variations
   - Screen effects

### Unlock System
1. **Material Unlocks**
   - Achievement-based
   - Score milestones
   - Boss rewards
   - Special events

2. **Edition Unlocks**
   - Ancient shard purchases
   - Challenge completion
   - Collection goals
   - Perfect runs

### Collection Benefits
1. **Passive Bonuses**
   - Small score multipliers
   - Visual flourishes
   - Sound variations
   - Special animations

2. **Completion Rewards**
   - Unique talismans
   - Special editions
   - Profile customization
   - Title unlocks