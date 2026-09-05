# Comprehension Data Structure Guide

## Overview
This guide explains how to set up and maintain dynamic comprehension questions for the Kani Game App.

## CSV Format for Comprehension Games

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| `game_type` | Either "story-nebula" or "inference-investigator" | `story-nebula` |
| `difficulty` | Easy, Medium, or Hard | `Medium` |
| `text1` | Story title (for story-nebula) OR Evidence/clue (for inference-investigator) | `The Lost Puppy` |
| `text2` | Story content (for story-nebula) OR Question (for inference-investigator) | `One sunny morning...` |
| `answer` | The question (for story-nebula) OR Correct answer (for inference-investigator) | `What did Emma find?` |
| `option1` | First option (correct answer for story-nebula) | `A small brown puppy` |
| `option2` | Second option | `A black cat` |
| `option3` | Third option | `A blue bird` |
| `option4` | Fourth option | `A red ball` |
| `hint` | Optional hint for students | Leave empty or add helpful hint |

## Story Nebula Format

**Purpose**: Reading comprehension with story passages

**Structure**:
- `text1`: Story Title
- `text2`: The full story passage (can be multiple sentences/paragraphs)
- `answer`: The question to ask about the story
- `option1`: **CORRECT ANSWER** (this is the right answer!)
- `option2-4`: Wrong answers
- `hint`: Optional hint

**Example**:
```csv
game_type,difficulty,text1,text2,answer,option1,option2,option3,option4,hint
story-nebula,Easy,The Lost Puppy,"Emma found a puppy outside. The puppy had a collar with a phone number...",What did Emma find outside her house?,A small brown puppy,A black cat,A blue bird,A red ball,
```

## Inference Investigator Format

**Purpose**: Making logical inferences from clues

**Structure**:
- `text1`: The evidence or clue (what they observe)
- `text2`: The question asking what they can infer
- `answer`: **CORRECT ANSWER** (the right inference)
- `option1`: First option (could be correct answer)
- `option2-4`: Other options
- `hint`: Optional hint for thinking

**Example**:
```csv
game_type,difficulty,text1,text2,answer,option1,option2,option3,option4,hint
inference-investigator,Medium,"Tom's hands were covered in paint, and colorful pictures hung drying.",What was Tom most likely doing?,Painting or making art,Washing dishes,Playing video games,Reading books,Think about the paint clues
```

## How to Update Google Sheets

### Step 1: Create Your Spreadsheet
1. Go to Google Sheets
2. Create a new spreadsheet named "Comprehension Questions"
3. Add the headers in row 1: `game_type,difficulty,text1,text2,answer,option1,option2,option3,option4,hint`

### Step 2: Add Your Questions
1. Each row represents one question
2. Fill in all required columns
3. Use the sample data from `COMPREHENSION_STORIES.csv` as a template

### Step 3: Publish as CSV
1. Click **File → Share → Publish to web**
2. Choose the specific sheet/tab
3. Select **Comma-separated values (.csv)** format
4. Click **Publish**
5. Copy the published URL

### Step 4: Update Settings
1. Open the Kani Game App
2. Click the Settings gear icon (⚙️)
3. Enter password: `Superdad`
4. Paste your CSV URL in the **English Questions Sheet** field
5. Click Save

## Tips for Writing Great Comprehension Questions

### Story Nebula Tips:
- ✅ Keep stories age-appropriate (Grade 3-4 level)
- ✅ Use clear, engaging narratives
- ✅ Include a variety of question types (detail, main idea, inference)
- ✅ Make wrong answers plausible but clearly incorrect
- ✅ Add hints for harder questions

### Inference Investigator Tips:
- ✅ Provide clear observable clues
- ✅ Ensure the inference logically follows from the evidence
- ✅ Avoid clues that could support multiple inferences
- ✅ Use real-world scenarios kids can relate to
- ✅ Progress from obvious to subtle inferences

## Difficulty Guidelines

**Easy (Grade 3)**:
- Short stories (3-5 sentences)
- Simple vocabulary
- Direct questions about story details
- Obvious inferences

**Medium (Grade 3-4)**:
- Medium stories (6-10 sentences)
- Mixed vocabulary
- Questions requiring understanding of events
- Clear but less obvious inferences

**Hard (Grade 4)**:
- Longer stories (10+ sentences)
- Advanced vocabulary
- Questions requiring analysis
- Subtle inferences requiring critical thinking

## Sample Data

Use the included `COMPREHENSION_STORIES.csv` file as a starting point. It includes:
- 6 Story Nebula questions (2 Easy, 2 Medium, 2 Hard)
- 6 Inference Investigator questions (2 Easy, 2 Medium, 2 Hard)

## Troubleshooting

**Questions not loading?**
- Check that your Google Sheet is published as CSV
- Verify the URL is correct in settings
- Ensure column headers match exactly
- Check for empty required fields

**Wrong answers showing as correct?**
- For Story Nebula: The correct answer MUST be in `option1`
- For Inference Investigator: The correct answer MUST be in `answer`

**Story text cut off?**
- Long stories are automatically scrollable
- Keep stories under 500 words for best UX

## Need Help?

- Check the sample CSV file: `COMPREHENSION_STORIES.csv`
- Review the theme configuration: `src/themes/themeConfig.js`
- Examine the renderers: `src/renderers/ComprehensionRenderer.jsx`
