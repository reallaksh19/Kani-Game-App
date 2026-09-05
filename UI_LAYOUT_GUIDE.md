---
render_with_liquid: false
---

# UI & Layout Patterns Guide

**Learning Galaxy App - Visual Design Reference**
**Last Updated**: January 23, 2026

This guide provides detailed examples of UI patterns, layout structures, and styling approaches used throughout the Learning Galaxy app.

---

## Table of Contents

1. [Color System](#color-system)
2. [Layout Patterns](#layout-patterns)
3. [Component Patterns](#component-patterns)
4. [Responsive Breakpoints](#responsive-breakpoints)
5. [Animation Patterns](#animation-patterns)
6. [Typography Scale](#typography-scale)
7. [Interactive States](#interactive-states)
8. [Glassmorphism Effects](#glassmorphism-effects)

---

## Color System

### Subject Color Palettes

#### Math Theme (Purple)
```javascript
Background: linear-gradient(180deg, #1a0a2e 0%, #4a2c7a 100%)
Primary:    #9333ea
Secondary:  #7c3aed
Accent:     #a855f7
Text:       #e9d5ff (light purple)
```

**Usage**:
```jsx
<SpaceBackground variant="math">
  <div className="text-purple-200">Math content</div>
</SpaceBackground>
```

#### English Theme (Blue)
```javascript
Background: linear-gradient(180deg, #0a1628 0%, #2d5a87 100%)
Primary:    #3b82f6
Secondary:  #2563eb
Accent:     #60a5fa
Text:       #bfdbfe (light blue)
```

#### Grammar Theme (Indigo)
```javascript
Background: linear-gradient(180deg, #1a1a2e 0%, #4a3c7a 100%)
Primary:    #6366f1
Secondary:  #4f46e5
```

#### Vocabulary Theme (Green)
```javascript
Background: linear-gradient(180deg, #1a2a1a 0%, #3a6a3a 100%)
Primary:    #22c55e
Secondary:  #16a34a
```

#### Comprehension Theme (Teal)
```javascript
Background: linear-gradient(180deg, #0a2020 0%, #2d6a6a 100%)
Primary:    #14b8a6
Secondary:  #0d9488
```

### Game-Specific Colors

Each of the 16 games has a unique color scheme:

| Game | Gradient | Border | Card Background |
|------|----------|--------|-----------------|
| Space Math | orange-500 → yellow-500 | border-orange-500 | bg-orange-900/30 |
| Alien Invasion | purple-500 → pink-500 | border-purple-500 | bg-purple-900/30 |
| Bubble Pop | cyan-400 → blue-500 | border-cyan-400 | bg-cyan-900/30 |
| Planet Hopper | indigo-500 → purple-600 | border-indigo-500 | bg-indigo-900/30 |
| Fraction Frenzy | red-500 → orange-500 | border-red-500 | bg-red-900/30 |
| Time Warp | blue-500 → cyan-400 | border-blue-500 | bg-blue-900/30 |
| Money Master | green-500 → emerald-600 | border-green-500 | bg-green-900/30 |
| Geometry Galaxy | pink-500 → rose-600 | border-pink-500 | bg-pink-900/30 |
| Grammar Galaxy | violet-500 → purple-600 | border-violet-500 | bg-violet-900/30 |
| Word Class Warp | amber-500 → yellow-500 | border-amber-500 | bg-amber-900/30 |
| Punctuation Pop | rose-500 → pink-600 | border-rose-500 | bg-rose-900/30 |
| Tense Traveler | sky-500 → blue-600 | border-sky-500 | bg-sky-900/30 |
| Vocabulary Voyage | emerald-500 → teal-600 | border-emerald-500 | bg-emerald-900/30 |
| Synonym Seeker | lime-500 → green-600 | border-lime-500 | bg-lime-900/30 |
| Story Nebula | teal-400 → cyan-300 | border-teal-400 | bg-teal-900/30 |
| Inference Investigator | slate-500 → gray-600 | border-slate-500 | bg-slate-900/30 |

### Difficulty Colors

```javascript
Easy:   Green  (#22c55e) - Encouraging, friendly
Medium: Yellow (#eab308) - Moderate challenge
Hard:   Red    (#ef4444) - High challenge
```

**Component Example**:
```jsx
<span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
  Easy
</span>
```

### Feedback Colors

```javascript
Correct:   Green border (border-green-400) + green shadow (shadow-green-500/50)
Incorrect: Red border (border-red-400) + red shadow (shadow-red-500/50)
```

---

## Layout Patterns

### Pattern 1: Full-Screen Background

**Use Case**: All main pages (landing, game selection, gameplay)

```jsx
<div className="relative w-full h-screen overflow-hidden">
  {/* Background Layer (z-0) */}
  <div className="absolute inset-0 pointer-events-none">
    {/* Twinkling stars, decorations */}
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`
        }}
      />
    ))}
  </div>

  {/* Content Layer (z-10) */}
  <div className="relative z-10 h-full">
    {children}
  </div>
</div>
```

**Key Features**:
- `relative` on container for positioning context
- `overflow-hidden` prevents scroll
- `pointer-events-none` on background so clicks pass through
- `z-10` on content layer to appear above background

### Pattern 2: Centered Modal/Card

**Use Case**: Settings, leaderboard, game over screen

```jsx
<div className="flex flex-col items-center justify-center h-full px-4">
  <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur border-2 border-gray-700 max-w-lg w-full">
    <h2 className="text-3xl font-bold text-white mb-4">Modal Title</h2>
    <div className="space-y-4">
      {/* Content */}
    </div>
  </div>
</div>
```

**Key Features**:
- Flexbox centers vertically and horizontally
- `px-4` prevents edge-to-edge on mobile
- `max-w-lg` constrains width on desktop
- `w-full` allows full width on mobile (minus padding)

### Pattern 3: Scrollable Content

**Use Case**: Long game instructions, story content

```jsx
<div className="flex flex-col items-center h-full pt-8 px-4 overflow-y-auto pb-8">
  <div className="max-w-3xl w-full">
    {/* Long content that may exceed viewport height */}
  </div>
</div>
```

**Key Features**:
- `overflow-y-auto` allows vertical scrolling
- `pt-8` and `pb-8` prevent content from touching edges
- Centered with flexbox but scrollable

### Pattern 4: Grid Layouts

#### Two-Column Mobile, Four-Column Desktop
**Use Case**: Game tiles, stats cards

```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {games.map(game => (
    <div key={game.id} className="...">
      {/* Game card */}
    </div>
  ))}
</div>
```

**Responsive Behavior**:
- Mobile (< 768px): 2x4 grid (8 items)
- Desktop (≥ 768px): 1x8 row

#### Stacked Mobile, Two-Column Desktop
**Use Case**: Subject selection, category cards

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>Math</div>
  <div>English</div>
</div>
```

**Responsive Behavior**:
- Mobile (< 640px): Vertical stack
- Small+ (≥ 640px): Side-by-side

### Pattern 5: Fixed Header + Content

**Use Case**: In-game header with timer/score

```jsx
<div className="h-screen flex flex-col">
  {/* Fixed Header */}
  <div className="flex-shrink-0 bg-gray-900/80 backdrop-blur border-b-2 border-gray-700 p-4">
    <div className="flex justify-between items-center">
      <button>← Back</button>
      <div className="flex gap-4">
        <span>⏱️ {timer}s</span>
        <span>🔥 {streak}</span>
        <span>⭐ {stars}</span>
      </div>
    </div>
  </div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* Game content */}
  </div>
</div>
```

**Key Features**:
- `flex-shrink-0` prevents header from shrinking
- `flex-1` makes content take remaining space
- `overflow-y-auto` on content area only

---

## Component Patterns

### Pattern 1: Glassmorphism Card

**Most Common Pattern** (used 40+ times)

```jsx
<div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur border-2 border-gray-700">
  <h3 className="text-xl font-bold text-white mb-3">Card Title</h3>
  <p className="text-gray-300">Card content</p>
</div>
```

**Variations**:

```jsx
// Light transparency
<div className="bg-gray-800/70 backdrop-blur-sm ...">

// Colored glass (purple)
<div className="bg-purple-900/30 backdrop-blur border-2 border-purple-500/50 ...">

// Extra blur + shadow
<div className="bg-gray-900/90 backdrop-blur-md shadow-2xl ...">
```

### Pattern 2: Gradient Button

```jsx
<button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:brightness-110 transition-all">
  Click Me
</button>
```

**With Game Theme**:
```jsx
const gameTheme = GAME_THEMES[gameId];

<button className={`${gameTheme.buttonBg} text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:brightness-110 transition-all`}>
  Start Game
</button>
```

### Pattern 3: Gradient Text

```jsx
<h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
  Space Math
</h1>
```

**With Game Theme**:
```jsx
<h2 className={`text-4xl font-bold bg-gradient-to-r ${gameTheme.gradient} bg-clip-text text-transparent`}>
  {game.title}
</h2>
```

### Pattern 4: Game Tile Card

```jsx
<button
  className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 rounded-3xl shadow-2xl hover:scale-105 transition-all w-full"
  style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s both` }}
>
  <div className="text-6xl mb-3">🚀</div>
  <h3 className="text-xl font-bold text-white mb-2">Space Math</h3>
  <p className="text-sm text-white/80">Solve equations!</p>
</button>
```

**Features**:
- Gradient background
- Large icon (text-6xl = 60px)
- Hover scale effect
- Staggered entrance animation

### Pattern 5: Stats Card

```jsx
<div className="bg-gray-800/60 rounded-xl p-4 text-center">
  <div className="text-3xl font-bold text-yellow-400">⭐ 1,234</div>
  <div className="text-sm text-gray-400 mt-1">Total Stars</div>
</div>
```

### Pattern 6: Answer Option Button

```jsx
<button
  onClick={() => handleAnswer(option)}
  className={`
    ${gameTheme.cardBg}
    border-2 ${gameTheme.borderColor}
    p-4 rounded-xl
    text-lg text-white
    hover:scale-105 transition-all
    ${feedback ? (feedback.correct ? 'border-green-400 shadow-green-500/50' : 'border-red-400 shadow-red-500/50') : ''}
  `}
>
  {option}
</button>
```

**With Feedback**:
```jsx
// Correct answer
<button className="... border-green-400 shadow-lg shadow-green-500/50">

// Incorrect answer
<button className="... border-red-400 shadow-lg shadow-red-500/50">
```

### Pattern 7: Back Button

```jsx
<button
  onClick={onBack}
  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
>
  <span className="text-xl">←</span>
  <span>Back</span>
</button>
```

### Pattern 8: Loading Spinner

```jsx
<div className="flex flex-col items-center justify-center h-full">
  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
  <p className="text-gray-400 mt-4">Loading questions...</p>
</div>
```

---

## Responsive Breakpoints

### Tailwind Breakpoints Used

```javascript
sm:  640px   // Small tablets
md:  768px   // Tablets, primary breakpoint
lg:  1024px  // Desktops (rarely used)
```

### Common Responsive Patterns

#### Text Size
```jsx
className="text-4xl md:text-5xl"     // 36px → 48px
className="text-3xl md:text-4xl"     // 30px → 36px
className="text-lg md:text-xl"       // 18px → 20px
```

#### Padding
```jsx
className="p-4 md:p-6"               // 16px → 24px
className="px-4 md:px-8"             // Horizontal padding
className="py-2 md:py-3"             // Vertical padding
```

#### Grid Columns
```jsx
className="grid-cols-2 md:grid-cols-4"       // 2 → 4 columns
className="grid-cols-1 sm:grid-cols-2"       // 1 → 2 columns
className="grid-cols-1 md:grid-cols-3"       // 1 → 3 columns
```

#### Flex Direction
```jsx
className="flex-col sm:flex-row"     // Stack → Row
```

#### Gap
```jsx
className="gap-3 md:gap-4"           // 12px → 16px
className="gap-4 md:gap-6"           // 16px → 24px
```

### Mobile-First Examples

#### Button Group
```jsx
// Mobile: Stack vertically
// Desktop: Horizontal row
<div className="flex flex-col sm:flex-row gap-3">
  <button>Option 1</button>
  <button>Option 2</button>
  <button>Option 3</button>
</div>
```

#### Icon Size
```jsx
// Mobile: 48px
// Desktop: 60px
<div className="text-5xl md:text-6xl">🚀</div>
```

#### Max Width Containers
```jsx
className="max-w-md w-full"    // 448px max (leaderboard)
className="max-w-lg w-full"    // 512px max (settings)
className="max-w-3xl w-full"   // 768px max (comprehension)
className="max-w-4xl w-full"   // 896px max (analytics)
```

---

## Animation Patterns

### 1. Twinkle (Stars)

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

**Usage**:
```jsx
<div
  className="absolute w-1 h-1 bg-white rounded-full"
  style={{
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`
  }}
/>
```

**Duration**: 2-5 seconds (randomized)

### 2. Float (Mascots, Decorations)

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

**Usage**:
```jsx
<div
  className="text-8xl"
  style={{ animation: 'float 2s ease-in-out infinite' }}
>
  🚀
</div>
```

### 3. Slide In (Entry Animation)

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Usage**:
```jsx
{games.map((game, index) => (
  <div
    key={game.id}
    style={{
      animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
    }}
  >
    {/* Game tile */}
  </div>
))}
```

**Staggered**: Each item delays by 50ms

### 4. Hover Scale

```jsx
className="hover:scale-105 transition-all"
```

**Usage**: Game tiles, buttons
**Duration**: Default (300ms)
**Effect**: Grows to 105% size on hover

### 5. Brightness on Hover

```jsx
className="hover:brightness-110 transition-all"
```

**Usage**: Gradient buttons
**Effect**: Brightens by 10%

### 6. Shake (Error Feedback)

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(0); }
  75% { transform: translateX(5px); }
}
```

**Usage** (on incorrect answer):
```jsx
<button
  className={feedback?.correct === false ? 'animate-shake' : ''}
>
  {option}
</button>
```

### 7. Spin (Loading)

```jsx
className="animate-spin"
```

**Usage**: Loading spinner
**Built-in Tailwind**: 1s linear infinite

---

## Typography Scale

### Headings

```jsx
// H1: Page titles
<h1 className="text-4xl md:text-5xl font-bold text-white">
  Learning Galaxy
</h1>

// H2: Section headers
<h2 className="text-3xl md:text-4xl font-bold text-purple-300">
  Select a Game
</h2>

// H3: Card titles
<h3 className="text-2xl md:text-3xl font-bold text-white">
  Space Math
</h3>

// H4: Subsections
<h4 className="text-xl md:text-2xl font-bold text-gray-300">
  Instructions
</h4>
```

### Body Text

```jsx
// Large body: Important descriptions
<p className="text-lg md:text-xl text-gray-300">
  Solve 10 equations as fast as you can!
</p>

// Medium body: Standard text
<p className="text-base md:text-lg text-gray-400">
  Instructions go here.
</p>

// Small body: Labels, metadata
<p className="text-sm md:text-base text-gray-500">
  Difficulty: Easy
</p>

// Tiny: Timestamps, footnotes
<p className="text-xs md:text-sm text-gray-600">
  Last played: Jan 23, 2026
</p>
```

### Question Text

```jsx
// Question title
<h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
  What is 5 + 3?
</h2>

// Question description
<p className="text-base md:text-lg text-gray-300 mb-6">
  Choose the correct answer below.
</p>

// Option text
<button className="text-lg md:text-xl">
  8
</button>
```

### Font Weights

```jsx
font-bold    // 700 - Headings, buttons
font-medium  // 500 - Subheadings
(default)    // 400 - Body text
```

### Line Height

```jsx
leading-tight    // 1.25 - Headings
leading-relaxed  // 1.625 - Body text with more breathing room
```

---

## Interactive States

### Hover States

```jsx
// Background color change
hover:bg-gray-700

// Scale up
hover:scale-105

// Brightness
hover:brightness-110

// Shadow
hover:shadow-xl

// Border
hover:border-purple-400

// Combined
className="hover:scale-105 hover:brightness-110 transition-all"
```

### Active States (Click)

```jsx
active:scale-95        // Slight shrink on click
active:brightness-90   // Darken on click
```

### Focus States

```jsx
focus:outline-none
focus:ring-2
focus:ring-purple-500
focus:ring-offset-2
focus:ring-offset-gray-900
```

**Example**:
```jsx
<button className="... focus:outline-none focus:ring-2 focus:ring-purple-500">
  Click Me
</button>
```

### Disabled States

```jsx
disabled:opacity-50
disabled:cursor-not-allowed
```

**Example**:
```jsx
<button
  disabled={timer === 0}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  Submit
</button>
```

### Selected State

```jsx
// Radio button selected
className={`
  border-2 p-4 rounded-xl
  ${selected ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600'}
`}
```

### Feedback States

```jsx
// Correct answer
className="border-green-400 bg-green-500/20 shadow-lg shadow-green-500/50"

// Incorrect answer
className="border-red-400 bg-red-500/20 shadow-lg shadow-red-500/50"
```

---

## Glassmorphism Effects

### Standard Glass Card

```jsx
<div className="bg-gray-900/80 backdrop-blur rounded-2xl border-2 border-gray-700">
  {/* Content */}
</div>
```

**Breakdown**:
- `bg-gray-900/80`: Dark background, 80% opacity
- `backdrop-blur`: Blurs content behind
- `border-2 border-gray-700`: Subtle border

### Light Glass

```jsx
<div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-600">
  {/* Content */}
</div>
```

**Usage**: Overlays that shouldn't be too prominent

### Colored Glass (Purple)

```jsx
<div className="bg-purple-900/30 backdrop-blur border-2 border-purple-500/50 rounded-2xl">
  {/* Content */}
</div>
```

**Usage**: Game-themed cards

### Extra Blur (Modals)

```jsx
<div className="bg-gray-900/90 backdrop-blur-md rounded-2xl border-2 border-gray-700 shadow-2xl">
  {/* Content */}
</div>
```

**Usage**: Settings, important modals

### Gradient Glass

```jsx
<div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur rounded-2xl border-2 border-purple-500/30">
  {/* Content */}
</div>
```

**Usage**: Special cards, featured content

### Glass with Shadow

```jsx
<div className="bg-gray-900/80 backdrop-blur rounded-2xl border-2 border-purple-500/50 shadow-lg shadow-purple-500/50">
  {/* Content */}
</div>
```

**Usage**: Highlighted cards, active elements

---

## Best Practices

### 1. Consistent Spacing

Use a **scale of 4**:
```
gap-2   (8px)
gap-3   (12px)
gap-4   (16px)
gap-6   (24px)
gap-8   (32px)
```

### 2. Touch Targets

Minimum **44px** for all interactive elements:
```jsx
className="py-3 px-6"  // ≈48px height
```

### 3. Color Contrast

Ensure **4.5:1** ratio for body text:
```jsx
// Good contrast
<p className="text-gray-300">Text on dark background</p>

// Poor contrast (avoid)
<p className="text-gray-700">Text on gray-900 background</p>
```

### 4. Animation Performance

Animate **transform** and **opacity** only:
```jsx
// Good (GPU accelerated)
transition-transform
transition-opacity

// Avoid (triggers layout)
transition-width
transition-height
```

### 5. Z-Index Hierarchy

```
z-0   Background decorations
z-10  Main content
z-20  Interactive elements
z-30  Modals
z-40  Tooltips
z-50  Notifications
```

### 6. Responsive Images

Always constrain size:
```jsx
<div className="text-6xl md:text-8xl">🚀</div>
```

### 7. Loading States

Always show feedback:
```jsx
{loading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage error={error} />
) : (
  <Content data={data} />
)}
```

---

## Quick Reference

### Most Common Classes

```jsx
// Layout
"flex items-center justify-center"
"grid grid-cols-2 md:grid-cols-4 gap-4"
"max-w-lg w-full"

// Card
"bg-gray-900/80 rounded-2xl p-6 backdrop-blur border-2 border-gray-700"

// Button
"bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 transition-all"

// Text
"text-4xl md:text-5xl font-bold text-white"
"text-gray-300 text-base md:text-lg"

// Spacing
"mb-4"  (margin-bottom: 16px)
"gap-3" (gap: 12px)
"p-6"   (padding: 24px)
```

### Color Utilities

```jsx
// Backgrounds
bg-gray-900/80   (dark glass)
bg-purple-500    (solid)
bg-gradient-to-r (gradient)

// Text
text-white
text-gray-300
text-purple-400

// Borders
border-2
border-gray-700
border-purple-500/50
```

### Effects

```jsx
backdrop-blur       (glassmorphism)
shadow-lg           (large shadow)
hover:scale-105     (grow on hover)
transition-all      (smooth transitions)
rounded-xl          (12px radius)
```

---

**End of UI & Layout Guide**

For implementation examples, see:
- Main app: `learning-galaxy-v5.jsx`
- Theme config: `src/themes/themeConfig.js`
- Shared components: `src/components/shared/`
