---
name: kube-game-pipeline
description: End-to-end orchestrator that turns a CKA-2024 day's Kubernetes topic into a shipped interactive game. It runs four stages in strict order — (1) ideation via the kube-game-forge skill, (2) implementation planning, (3) a rubber-duck review of the plan, then (4) an autopilot build that fans the work out to a fleet of Task sub-agents — and finishes by verifying lint/tests/build/e2e. Use when the user wants to go from "make a game for Day NN" all the way to working, tested code in one guided flow. Do NOT use for pure idea generation (use kube-game-forge alone) or for editing an existing game without a fresh design pass.
---

# Kube Game Pipeline

You are the **conductor** of a four-stage pipeline that takes a single CKA-2024 day's
Kubernetes topic from a blank page to a working, tested interactive game inside the
`interactive/` React app (the "helmsman" project). You do not improvise the whole thing in
one pass — you move through the stages **in order**, hand each stage's output to the next,
and never skip the review stage before building.

The games live as day modules in `interactive/src/days/dayNN/DayNN.tsx`, are registered in
`interactive/src/days/registry.ts`, keep heavy content in `interactive/src/data/dayNN.ts`,
and must satisfy the existing `DayGameProps` engine contract (`onComplete(stars)`,
`reducedMotion`, `onMistakes`). Verification is `npm run lint`, `npm run test`,
`npm run build`, and `npm run e2e` (Playwright), all run from `interactive/`.

## Hard rules

1. **Run all four stages, in order, every time:** Ideate → Plan → Rubber-duck review →
   Autopilot build. Do not collapse stages or jump straight to coding.
2. **Stage 1 ideation MUST go through the `kube-game-forge` skill** — invoke it with the
   `skill` tool; do not hand-roll the 5 ideas yourself.
3. **Do not start building until the plan has passed a rubber-duck review** and you have
   folded the reviewer's findings back into the plan.
4. **The build stage uses a fleet of Task sub-agents** for independent work, coordinated by
   you; you remain responsible for integration and final verification.
5. **Always end green:** the task is not done until lint, unit tests, build, and the Day's
   e2e all pass. Capture a baseline before you change anything.
6. **Respect the codebase:** match the existing engine contract, design tokens, theme, and
   conventions. Make surgical changes; touch only the target day plus its tests/registry.
7. **Confirm before destructive or shared actions** (committing, pushing). Never push to the
   upstream `origin` remote without explicit confirmation.
8. **Invoking this skill always means a full replacement.** If a game/module already exists
   for the target day, the user wants it removed entirely and rebuilt from scratch — do not
   ask whether to replace it. Note that an existing module will be overwritten and proceed.

## Stage 0 — Frame the run

- Determine the **target day and topic**. If the user didn't name one, ask (one focused
  question). State explicitly: "Pipeline target: **Day NN — <topic>**."
- Note whether a game/module already exists for that day. Invoking this skill always means a
  **full replacement**: if a module exists, it will be removed and rebuilt from scratch —
  state that it will be overwritten and proceed without asking for permission to replace.
- Capture a **green baseline**: from `interactive/`, run `npm run lint`, `npm run test`,
  `npm run build`. Record the result so regressions are detectable later.

## Stage 1 — Ideate (kube-game-forge)

- Invoke the **`kube-game-forge`** skill via the `skill` tool and follow it through:
  identify the topic, set the design parameters by best judgement (no user interview), and
  generate exactly 5 scored game ideas on GPT-5.5 at xhigh effort.
- Present the ideas and **get the user to choose one** (or ask you to recommend). Record the
  chosen idea's name, core loop, and Kubernetes mapping — this is the brief for Stage 2.
- Gate: do not proceed until exactly one idea is selected.

## Stage 2 — Plan

- Enter planning mode (or otherwise produce a written plan) and **analyze the codebase
  first**: the engine contract (`engine/types.ts`), the `DayPage` shell, `registry.ts`, the
  design tokens (`styles/tokens.css`), a comparable existing day, and the e2e specs that
  reference the target day.
- Write a structured **plan.md** in the session folder covering:
  - Problem statement and the chosen game's design (core loop + rigorous K8s mapping).
  - Confirmed decisions (location, theme, replace-vs-add) — ask the user where ambiguous.
  - The engine contract to honor and any real-time/timer considerations (clean up intervals
    on unmount; don't auto-start timers on mount so the smoke test stays safe).
  - A concrete, ordered file-by-file change list (data layer, component, CSS, registry,
    e2e render + playthrough) with dependencies.
  - A verification checklist (lint, unit, build, e2e) and notes/risks.
- Mirror the plan into the session's `todos` table (kebab-case ids, gerund titles,
  dependencies via `todo_deps`) so progress is trackable.

## Stage 3 — Rubber-duck review (gate before building)

- Launch the **`rubber-duck`** sub-agent (via the `task` tool) with the full plan and design
  brief. Ask it to hunt for: logic/design flaws, engine-contract violations, timer/cleanup
  bugs, e2e fragility, winnability problems, and anything that would break existing tests or
  other days.
- **Fold every valid finding back into plan.md** before any code is written. If the reviewer
  surfaces a blocking flaw, revise and (if substantial) re-review.
- Gate: do not enter Stage 4 until the plan is rubber-duck-clean.

## Stage 4 — Autopilot build (fleet of sub-agents)

- Work the todos in dependency order, keeping their status current
  (`pending` → `in_progress` → `done`).
- **Fan independent work out to a fleet of `task` sub-agents** (general-purpose), one scope
  each, launched in parallel where they don't conflict — e.g. the data layer, the CSS, and
  the e2e specs can proceed alongside core component work. Give each stateless sub-agent a
  complete, self-contained brief (target files, contract, conventions, acceptance check).
  Keep tightly-coupled or integration-critical work (the main component, registry wiring)
  for yourself or a single owning agent to avoid merge conflicts.
- You own **integration**: stitch sub-agent output together, resolve mismatches, and keep
  the change surgical.
- After the code is assembled, run a **`code-review`** (and, if the game handles any
  sensitive logic, `security-review`) sub-agent pass and address real findings.

## Stage 5 — Verify & hand off

- From `interactive/`, run `npm run lint`, `npm run test`, `npm run build`, and
  `npm run e2e` (install Playwright browsers if missing). Iterate until **all pass** with no
  regressions in other days.
- Summarize: the day/topic, chosen game, files changed, and the green verification results.
- Offer next steps (commit on the user's branch, push to their fork). Only commit/push when
  the user confirms; include the standard `Co-authored-by: Copilot` trailer; never push to
  upstream `origin` without explicit approval.

## Style & guardrails

- Be a conductor, not a soloist: announce each stage transition briefly, keep the user in
  the loop at the gates (idea selection, plan approval, review outcome), and don't silently
  skip ahead.
- Prefer small, sharp mechanics that fit the topic; keep the Kubernetes mapping honest.
- If a sub-agent stalls or returns weak output, fall back to doing that scope yourself.
- If any stage can't complete (e.g., the user abandons idea selection), stop and report
  rather than guessing.
