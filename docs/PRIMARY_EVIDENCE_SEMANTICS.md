# Primary learner evidence semantics

Tracking: Study-Hub #40 / #42  
Backend/provider track: Study-Hub #39

## Decision

Kani owns observable learner attempts and deterministic recent-evidence summaries. It does **not** own durable mastery judgement or authoritative pedagogical next actions.

```text
Raw attempt evidence
        ↓
Recent deterministic evidence summary
        ↓
Primary Teacher Runtime
        ↓
Learning judgement
        ↓
Teacher decision / next learning action
```

## Brain Training migration

The previous Brain Training path used `masteryScore` for a challenge-adjusted session metric derived from accuracy and difficulty. That value is now named `performanceScore`.

New records write:

```text
performanceScore
```

They do not write:

```text
masteryScore
```

Existing local records are preserved. When a legacy record contains `masteryScore`, the loader normalizes that value into `performanceScore` in memory. The existing storage key remains unchanged for compatibility.

`performanceScore` remains a short-term signal. It does not establish:

- independent use;
- delayed retention;
- transfer;
- stretch readiness;
- durable mastery.

Those require separate evidence and later Teacher Runtime interpretation.

## UI language

Learner/guardian surfaces should prefer terms such as:

- recent performance;
- recent accuracy;
- recent evidence;
- review focus;
- session evidence.

Do not present a one-session score as `mastery`, `skill mastered`, or equivalent durable learning language.

## Recommendation boundary

Kani may deterministically expose evidence-focus signals such as a page or skill having weaker recent scored evidence. These are non-authoritative pedagogically.

Kani must not independently prescribe teacher-specific actions such as:

- reteach the concept;
- change to a bar model;
- reduce conceptual difficulty;
- fade support;
- declare mastery;
- move the learner to competition stretch.

Those actions belong to the Primary Teacher Runtime.

## Gamification

Stars, streaks, scores, badges and game completion remain gameplay/motivational state. They are not automatically durable learning evidence.

## Legacy competition UI

The existing LQ Champ/Thinksheet area contains older terms such as `Overall Proficiency`, `Skill Mastery Ladders` and cumulative level labels. They are **not accepted by this architecture as durable mastery semantics**.

Because competition architecture is explicitly later scope under Study-Hub #48, this Phase-1 Brain Training migration does not redesign that subsystem. A later competition-specific pass must either relabel those metrics as performance/progression signals or provide evidence-backed semantics before treating them as learning mastery.

## Backend invariance

SQLite, Firebase or another provider from Study-Hub #39 must not change these semantics. Identical canonical attempt history must yield identical recent-evidence derivations regardless of storage provider.
