# Question Banks Documentation 📚

This directory contains the question banks, syllabi, and answer keys for the **Learning Galaxy & LQ Champ Aptitude Platform**.

## Directory Structure

```text
docs/questions/
├── README.md                      # Structure overview & CSV specification
└── lq-champ/                      # LogIQids (LQ Champ) Olympiad Practice
    ├── lot-1.csv                  # Lot 1: 15 Medium + 5 Hard questions (Active)
    ├── lot-2.csv                  # Lot 2: (Planned)
    ├── lot-3.csv                  # Lot 3: (Planned)
    ├── lot-4.csv                  # Lot 4: (Planned)
    └── lot-5.csv                  # Lot 5: (Planned)
```

## Lot Structure

Each Lot tile in the app contains exactly **20 questions**:
- **15 Medium questions**
- **5 Hard questions**

### Domain Coverage in Each Lot
1. **Analytical Thinking**: Coding-Decoding, Positional Letter Puzzles, Blood Relations, Odd One Out, Series Completion, Deduction
2. **Numerical Ability**: Calendar Arithmetic, Number & Place-Value Riddles, Shape Sum Logic
3. **Verbal Aptitude**: Modal Auxiliary Syntax, Homophones, Vowel Counting Puzzles, Idioms
4. **Spatial & Memory**: Facing Directions, Clockwise/Counter-clockwise Rotations, Path Tracking
5. **Visual Aptitude**: Embedded Figures (no-rotation constraint), Pattern Matrices

## CSV Specification

| Column | Type | Description |
|---|---|---|
| `game_type` | string | Lot identifier (e.g., `lq-lot-1`) |
| `difficulty` | enum | `Medium` or `Hard` |
| `text1` | string | Question prompt / riddle text |
| `text2` | string | Section category or subtopic |
| `answer` | string | Exact correct answer string (matches one option) |
| `option1` - `option4` | string | Multiple-choice options |
| `hint` | string | Kid-friendly clue shown on 💡 button click |
| `know_more` | string | Full educational explanation displayed in review |
