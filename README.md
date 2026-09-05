# Learning Galaxy 🚀

An interactive educational game platform for Grade 3-4 students featuring Math and English games with a space-themed UI.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Grade Level](https://img.shields.io/badge/grade-3--4-green)

## 🎮 Features

### Math Games (8 games)
- **Space Math** - Basic arithmetic operations
- **Alien Invasion** - Fast-paced math challenges
- **Bubble Pop** - Pop the correct answer bubbles
- **Planet Hopper** - Number sequences and patterns
- **Fraction Frenzy** - Fraction comparison and operations
- **Time Warp** - Reading clocks and time calculations
- **Money Master** - Counting coins and making change
- **Geometry Galaxy** - Shape identification and properties

### English Games (8 games)
- **Grammar Galaxy** - Subject-verb agreement, pronouns
- **Word Class Warp** - Identify nouns, verbs, adjectives, adverbs
- **Punctuation Pop** - End punctuation practice
- **Tense Traveler** - Past, present, future verb forms
- **Synonym Stars** - Find words with similar meanings
- **Antonym Asteroids** - Find opposite words
- **Story Nebula** - Reading comprehension
- **Inference Investigator** - Drawing conclusions from text

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. Choose Math or English
3. Select a game and difficulty level
4. Start learning!

## ⚙️ Configuration

### Google Sheets Integration

Questions are loaded from Google Sheets CSV files. To customize:

1. Go to **Settings** (⚙️ icon, password: configured by admin)
2. Paste your Google Sheets published CSV URLs

### Publishing a Sheet as CSV

1. Open your Google Sheet
2. Go to **File** → **Share** → **Publish to web**
3. Select the sheet and choose **CSV** format
4. Copy the generated URL

## 📊 CSV Format

### Math Questions

| Column | Description | Example |
|--------|-------------|---------|
| `game_type` | Game identifier | `space-math` |
| `num1` | First number/text | `5` or `2 4 6 ? 10` |
| `num2` | Second number | `3` |
| `operation` | Math operation | `+`, `-`, `×`, `÷` |
| `answer` | Correct answer | `8` |
| `option1`-`option4` | Multiple choice options | `8`, `7`, `9`, `6` |
| `difficulty` | Easy/Medium/Hard | `Easy` |
| `topic` | Main topic category | `Addition` |
| `subtopic` | Specific subtopic | `Single Digit` |
| `know_more` | Educational tip | `Addition means...` |

### English Questions

| Column | Description | Example |
|--------|-------------|---------|
| `game_type` | Game identifier | `grammar-galaxy` |
| `text1` | Main question text | `She don't like apples` |
| `text2` | Context/category | `Subject-Verb Agreement` |
| `answer` | Correct answer | `doesn't` |
| `option1`-`option4` | Multiple choice options | |
| `difficulty` | Easy/Medium/Hard | `Medium` |
| `topic` | Main topic category | `Verbs` |
| `subtopic` | Specific subtopic | `Subject-Verb Agreement` |
| `know_more` | Educational tip | |

### Game Type Identifiers

**Math:** `space-math`, `alien-invasion`, `bubble-pop`, `planet-hopper`, `fraction-frenzy`, `time-warp`, `money-master`, `geometry-galaxy`

**English:** `grammar-galaxy`, `word-class-warp`, `punctuation-pop`, `tense-traveler`, `synonym-stars`, `antonym-asteroids`, `story-nebula`, `inference-investigator`

## 🏆 Features

- **Leaderboard** - Track high scores across games
- **QA Analytics** - View learning statistics
- **Difficulty Levels** - Easy, Medium, Hard
- **Streak Bonuses** - Extra points for consecutive correct answers
- **Know More** - Educational explanations after each question
- **Offline Support** - Fallback questions when offline

## 📱 Mobile Support

- Responsive design for tablets and phones
- Touch-friendly buttons
- Android Chrome optimizations

## ♿ Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast game elements
- Clear visual feedback

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Babel** - JSX transpilation
- **Google Sheets** - Question database

## 📁 Project Structure

```
Kani-Game-App/
├── index.html              # Main application file
├── learning-galaxy-v5.jsx  # React component (module version)
├── README.md               # Documentation
├── MATH_GOOGLE_SHEET_DATA.csv    # Sample math questions
├── ENGLISH_GOOGLE_SHEET_DATA.csv # Sample English questions
└── SETTINGS_SYNC_INSTRUCTIONS.md # Settings backup guide
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 License

MIT License - feel free to use for educational purposes.

---

Made with ❤️ for young learners