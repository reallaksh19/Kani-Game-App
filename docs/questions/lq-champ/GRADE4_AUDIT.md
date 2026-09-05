# LQ Champ Grade 4 Question Audit Standard

This repository contains **original Grade 4 practice questions** inspired by the structure and reasoning style of the Grade 4 sample supplied for this project. It is not a copy of, or a claim to be, an official LogIQids question bank.

## What "Grade 4 aligned" means here

Each lot must satisfy both a **content rubric** and an **automated structural audit**.

### Content rubric

1. **Age-appropriate language**
   - Prompts should be readable by a typical Grade 4 learner.
   - Hard questions may require more reasoning, but should not depend on secondary-school mathematics or specialist vocabulary.

2. **Reasoning before recall**
   - Medium questions should normally require at least two linked observations, constraints, or operations.
   - Hard questions should normally require three or more linked reasoning steps.
   - Simple fact recall is avoided unless it is part of a larger reasoning task.

3. **Sample-style domains**
   - `Numerical Ability`
   - `Verbal`
   - `Analytical Thinking`
   - `Memory and Concentration`
   - `Visual`

   The `text2` field uses only these five display labels. A more specific concept is stored in `subtopic`.

4. **Sample-style question forms**
   - odd-one-out and classification
   - number / letter series
   - calendar and direction logic
   - coding-decoding
   - blood relations and ordering
   - sentence completion / word-use constraints
   - memory-position tracking
   - shape, sequence, hidden-figure, and matrix reasoning

5. **Four plausible options, one unambiguous answer**
   - Every question has exactly four unique options.
   - The correct answer appears exactly once.
   - Correct answer positions are balanced across A/B/C/D so students cannot exploit answer-position patterns.
   - Distractors should represent realistic mistakes, not obviously malformed choices.

6. **Detailed post-game teaching**
   - Every item has a reasoning hint.
   - Every item has a worked solution (`know_more`).
   - Visual items carry an `svg:` diagram protocol so the same figure can appear during play and in the Post-Game Review with zoom.

## Lot contract

Every lot contains exactly:

- **20 questions**
- **15 Medium**
- **5 Hard**
- all five core skills
- Grade metadata: `Grade 4`
- cognitive-demand metadata: `2-step` for Medium and `3-step` for Hard

Lots 2-5 contain exactly one Hard question from each of the five skills. Lot 1 intentionally preserves the supplied sample emphasis, whose Hard examples are concentrated in Numerical, Verbal, Analytical, and Memory/Direction reasoning.

## Automated enforcement

Run:

```bash
npm run audit:lq
```

The audit fails CI if it detects:

- wrong question counts or difficulty split
- missing or non-canonical skill labels
- missing Grade 4 metadata
- duplicate questions
- missing/duplicate options
- an answer not appearing exactly once
- answer-position imbalance
- short or missing hints/solutions
- Visual questions without an `svg:` diagram
- docs/public question-bank drift
- malformed clock-time distractors
- missing hard-question skill coverage

## External benchmark notes

The public LogIQids program describes its ThinkSheets as **grade-wise / age-appropriate**, covering multiple reasoning topics, and emphasizes detailed solutions. Public Olympiad rules also specify multiple-choice questions with four options and one correct answer, with a higher-weight LQ Champs section.

References used only as structural benchmarks:

- https://www.logiqids.com/
- https://school.logiqids.com/
- https://www.logiqids.com/test-rules-2023-24

The custom app contract of **15 Medium + 5 Hard per lot** comes from this project's requirements, not from an assertion that the official Olympiad uses a 20-question Grade 4 paper.

## Human review checklist before adding a new question

A reviewer should still ask:

- Can a Grade 4 child solve it using reasoning rather than an advanced syllabus concept?
- Is there only one defensible answer?
- Are all distractors plausible?
- Does the Hard label reflect genuinely higher cognitive load?
- Does the solution explain *why*, not just state the answer?
- If the question is visual, is the figure readable without rotation ambiguity and does zoom work in review?
- Does the item resemble the supplied sample's style without copying protected source material?

The automated audit prevents structural regressions; human review remains necessary for pedagogical quality.
