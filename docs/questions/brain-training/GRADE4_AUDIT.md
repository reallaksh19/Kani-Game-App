# Brain Training Grade 4 Content Audit Standard

The CSV-backed Brain Training games use original Grade 4 practice content. The goal is not to imitate a proprietary question bank; it is to provide age-appropriate reasoning practice with explicit difficulty progression and enough content for replay.

## Audited banks

The following nine banks are covered by `npm run audit:brain`:

- Analogy Arena — Verbal Reasoning
- Cause & Effect — Analytical Thinking
- Classify Quest — Classification
- Sequence Story — Sequencing
- Pattern Forge — Pattern Recognition
- Code Breaker — Coding and Decoding
- Logic Lab — Deductive Logic
- Odd Wizard — Classification
- Sorting Station — Ordering and Sequencing

Each bank contains exactly **30 questions**:

- 10 Easy
- 10 Medium
- 10 Hard

This gives **270 audited Brain Training questions** in total.

## Difficulty contract

### Easy — 1-step

Easy items should require one clear rule, comparison, category, decoding operation, or sequence decision. The language should be short and familiar enough that reading load does not become the main challenge.

### Medium — 2-step

Medium items should normally require two linked observations or operations. Examples include chaining two comparisons, finding a changing numerical difference, applying a coding rule to several letters, comparing converted units, or inferring a cause from two clues.

### Hard — 3-step

Hard items should require multiple linked constraints or a rule that first has to be inferred and then applied. Hard must not mean merely using larger numbers. Appropriate Grade 4 Hard tasks include multi-constraint ordering, two-stage coding, alternating number rules, equivalence/classification under two conditions, and multi-step cause-effect reasoning.

## Editorial rules

Every item must have:

- `grade = Grade 4`
- the canonical skill for its game
- cognitive-demand metadata matching difficulty (`1-step`, `2-step`, `3-step`)
- four unique answer choices
- exactly one correct answer
- a useful hint that guides without simply stating the answer
- a worked `know_more` explanation

Correct-answer positions are distributed across A/B/C/D so students cannot exploit a position pattern.

## Automated gate

Run:

```bash
npm run audit:brain
```

The audit fails when it finds:

- a missing bank
- anything other than 30 questions in a bank
- anything other than a 10/10/10 Easy/Medium/Hard split
- wrong `game_type`, grade, skill, or cognitive-demand metadata
- duplicate prompts within a bank
- missing or duplicate options
- an answer that is missing or appears more than once
- weak/missing hints or worked explanations
- significantly imbalanced answer positions

CI runs this audit in addition to the LQ Grade 4 audit, TypeScript checks, tests, and the production build.

## Human review still required

Automation can enforce structure but cannot prove pedagogical quality. Before adding or replacing an item, a reviewer should still ask:

- Can a typical Grade 4 learner understand the vocabulary without specialist knowledge?
- Is there exactly one defensible answer?
- Are distractors plausible mistakes rather than nonsense?
- Does the difficulty come from reasoning load rather than obscure facts or oversized numbers?
- Does the explanation show why the answer is correct?
- Is the Hard version genuinely more demanding than the Medium version of the same skill?
- Does repeated play expose the learner to varied reasoning forms rather than minor wording changes of the same item?

## Content direction by game

- **Analogy Arena:** relationships progress from direct object/action and opposite pairs to inferred transformations and multi-part analogies.
- **Cause & Effect:** progresses from direct causes/effects to comparing evidence and explaining multi-step causal chains.
- **Classify Quest / Odd Wizard:** progresses from simple categories to rule-based, two-condition, numerical, word-structure, and equivalence classification.
- **Sequence Story / Sorting Station:** progresses from familiar routines to temporal constraints, dependencies, measurement ordering, and partial-order logic.
- **Pattern Forge:** progresses from constant differences to changing differences, alternating operations, multiplicative rules, and inferred product patterns.
- **Code Breaker:** progresses from A1Z26 to shifts/reversals and then multi-stage or inferred coding rules.
- **Logic Lab:** progresses from direct rule application to chained deductions, consistency checks, set exclusion, elimination, and constraint ordering.
