# Integration Guide - Modular Components

## 🎯 Purpose

This guide explains how to integrate the new modular components into the Kani Game App.

## 🔧 Integration Options

### Option 1: Direct Browser Integration (Current Setup)

Since the app currently runs with in-browser Babel transpilation, you have two approaches:

#### A. Keep Inline (Recommended for now)

The `learning-galaxy-v5.jsx` has been updated to include:
- Enhanced comprehension renderers
- New QA page with themed interfaces
- Import statements for modular components

**However**, since we're using in-browser Babel, the ES6 module imports won't work directly. You'll need to either:

1. **Inline the components** (copy code from `src/` files directly into `learning-galaxy-v5.jsx`)
2. **Use a build system** (see Option 2 below)

#### B. Manual Inline Integration

To manually integrate without a build system:

1. **Open** `learning-galaxy-v5.jsx`
2. **Copy** theme configurations from `src/themes/themeConfig.js`
3. **Paste** at the top of `learning-galaxy-v5.jsx` after imports
4. **Copy** the QA interfaces from `src/components/qa/*.jsx`
5. **Paste** before the main `LearningGalaxy` component
6. **Copy** the comprehension renderers from `src/renderers/ComprehensionRenderer.jsx`
7. **Paste** before the `SheetBasedGame` component

### Option 2: Build System Setup (Recommended for Production)

For a production-ready setup with proper module support:

#### Install Build Tools

```bash
# Initialize npm project
npm init -y

# Install dependencies
npm install --save react react-dom
npm install --save-dev @vitejs/plugin-react vite
```

#### Create vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
})
```

#### Update package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

#### Create src/main.jsx

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import LearningGalaxy from '../learning-galaxy-v5.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LearningGalaxy />
  </React.StrictMode>,
)
```

#### Update index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learning Galaxy</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

#### Run the app

```bash
npm run dev
```

---

## 📝 What's Changed

### 1. Enhanced QA Analytics

**File**: `src/components/pages/EnhancedQAPage.jsx`

**Features**:
- Theme selector (All, Math, English, Comprehension)
- Three unique themed interfaces
- Dynamic filtering
- Better visualizations

**Integration**:
```javascript
// In learning-galaxy-v5.jsx, replace:
if (showQA) return <QAPage ... />;

// With:
if (showQA) return <EnhancedQAPage ... />;
```

### 2. Enhanced Comprehension Renderers

**File**: `src/renderers/ComprehensionRenderer.jsx`

**Features**:
- Story Nebula: Better story layout with scrolling
- Inference Investigator: Detective theme
- Custom styling per game type
- Hint support

**Integration**:
```javascript
// Replace story-nebula rendering with:
if (gameId === 'story-nebula') {
  const gameTheme = GAME_THEMES['story-nebula'];
  return <StoryNebulaRenderer currentQ={currentQ} ... />;
}

// Replace inference-investigator rendering with:
if (gameId === 'inference-investigator') {
  const gameTheme = GAME_THEMES['inference-investigator'];
  return <InferenceInvestigatorRenderer currentQ={currentQ} ... />;
}
```

### 3. Centralized Theme Config

**File**: `src/themes/themeConfig.js`

**Usage**:
```javascript
import { GAME_THEMES, ICONS, DIFFICULTY_COLORS } from './src/themes/themeConfig.js';

// Access theme for any game
const theme = GAME_THEMES['space-math'];
// Use: theme.gradient, theme.buttonBg, theme.cardBg, etc.

// Access icons
const icon = ICONS.games['space-math']; // '🚀'

// Access difficulty colors
const difficultyColor = DIFFICULTY_COLORS['Easy'].bg; // 'bg-green-500'
```

---

## 🎨 Using the New QA Interfaces

### Math QA Interface
```javascript
<MathQAInterface
  stats={{ totalGames, totalStars, avgStars, bestStreak }}
  mostPlayedGame={{ ...gameInfo, playCount }}
  topPerformers={[...]}
  recentGames={[...]}
/>
```

### English QA Interface
```javascript
<EnglishQAInterface
  stats={{ totalGames, totalStars, avgStars, bestStreak }}
  mostPlayedGame={{ ...gameInfo, playCount }}
  topPerformers={[...]}
  recentGames={[...]}
/>
```

### Comprehension QA Interface
```javascript
<ComprehensionQAInterface
  stats={{ totalGames, totalStars, avgStars, bestStreak }}
  mostPlayedGame={{ ...gameInfo, playCount }}
  topPerformers={[...]}
  recentGames={[...]}
/>
```

---

## 📚 Comprehension Data Setup

### Step 1: Prepare Your Data

Use `COMPREHENSION_STORIES.csv` as a template or create your own following this format:

```csv
game_type,difficulty,text1,text2,answer,option1,option2,option3,option4,hint
story-nebula,Easy,Title,Story content...,Question?,Correct answer,Wrong 1,Wrong 2,Wrong 3,Hint
inference-investigator,Medium,Clue text,Question?,Correct answer,Option 1,Option 2,Option 3,Option 4,Think about...
```

### Step 2: Upload to Google Sheets

1. Create new Google Sheet
2. Import the CSV or paste data
3. Ensure column headers match exactly

### Step 3: Publish as CSV

1. File → Share → Publish to web
2. Select the sheet tab
3. Choose "Comma-separated values (.csv)"
4. Click "Publish"
5. Copy the URL

### Step 4: Update App Settings

1. Open app
2. Click Settings (⚙️)
3. Enter password: `Superdad`
4. Paste CSV URL in "English Questions Sheet"
5. Save

**Note**: Comprehension questions are part of English questions, so use the English sheet URL.

---

## 🧪 Testing the Changes

### Test Checklist

- [ ] All games load correctly
- [ ] Math games work as before
- [ ] English games work as before
- [ ] Comprehension games show new enhanced layout
- [ ] Story Nebula displays stories with scroll
- [ ] Inference Investigator shows detective theme
- [ ] QA Analytics loads
- [ ] Theme selector works (All, Math, English, Comprehension)
- [ ] Math QA interface shows correct theme
- [ ] English QA interface shows book theme
- [ ] Comprehension QA interface shows detective theme
- [ ] Mobile view works correctly
- [ ] Touch interactions work on mobile

### Manual Testing

1. **Play a math game** → Verify works normally
2. **Play a comprehension game** → Check new layout
3. **Open QA Analytics** → Test theme selector
4. **Switch between themes** → Verify different interfaces
5. **Test on mobile** → Check responsive design

---

## 🐛 Troubleshooting

### Module Import Errors

**Problem**: `Uncaught SyntaxError: Cannot use import statement outside a module`

**Solution**:
- Either inline the components (copy/paste code)
- Or set up a build system (Option 2 above)

### QA Interface Not Showing

**Problem**: EnhancedQAPage not rendering

**Solution**:
- Check that imports are correct
- Verify leaderboard data structure
- Check console for errors

### Comprehension Layout Issues

**Problem**: Story text overflowing or cut off

**Solution**:
- Check that `max-h-64 overflow-y-auto` classes are applied
- Verify custom scrollbar styles are included
- Test on different screen sizes

### Theme Not Applying

**Problem**: Games showing wrong colors/theme

**Solution**:
- Verify `GAME_THEMES` is imported
- Check game ID matches theme config key
- Ensure Tailwind classes are not purged

---

## 🚀 Deployment

### For GitHub Pages

```bash
# Build the app
npm run build

# Deploy dist/ folder to gh-pages branch
npm install -D gh-pages
npx gh-pages -d dist
```

### For Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### For Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy

---

## 📖 Additional Resources

- **Theme Configuration**: See `src/themes/themeConfig.js` for all available themes
- **Component Documentation**: Each component has inline comments
- **Data Guide**: See `COMPREHENSION_DATA_GUIDE.md` for question format
- **Refactoring Summary**: See `REFACTORING_SUMMARY.md` for complete overview

---

## ✅ Quick Start Checklist

1. [ ] Review `REFACTORING_SUMMARY.md`
2. [ ] Read `COMPREHENSION_DATA_GUIDE.md`
3. [ ] Choose integration option (inline or build system)
4. [ ] Update comprehension data in Google Sheets
5. [ ] Test all games
6. [ ] Test QA analytics with theme selector
7. [ ] Deploy to production

---

## 🆘 Need Help?

- Check existing documentation files
- Review component source code (well commented)
- Test in browser console
- Check browser compatibility (modern browsers only)

---

Made with ❤️ for better learning!
