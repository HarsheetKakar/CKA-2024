# Copilot instructions for CKA-2024

## What this repository is

This is a **content/documentation repository**, not an application. It hosts the notes,
diagrams, assignments, and YAML/script resources for the 40-day Certified Kubernetes
Administrator (CKA) course published on YouTube by @piyushsachdeva. There is no build,
test, or lint tooling — changes are almost always to Markdown notes and example manifests.

## Repository structure

- `README.md` — top-level course index; one section per day linking to the matching
  `Resources/DayNN` folder. When a new day's content is added, also add its section here.
- `#40daysofkubernetes.md` — rules and details for the community challenge.
- `Resources/DayNN/` — one folder per lesson. Days 1–42 are zero-padded (`Day01` … `Day42`).
  Later/topic folders use a different convention, e.g. `Day45-StatefulSet`,
  `Day46-PriorityClass`, `Day-50-Operators`, `day47-GatewayAPI`, `Helm`, `Kustomize`.
- Most day folders contain two files:
  - `readme.md` — the lesson notes (concepts, diagrams, sample YAML shown in the video).
  - `task.md` — the hands-on assignment for that day's `#40daysofkubernetes` challenge.

## Conventions

- Content is overwhelmingly Markdown. A handful of folders include standalone `.yaml`,
  `.sh`, or `.py` files, but most Kubernetes manifests live inline in fenced code blocks
  inside `readme.md` / `task.md`.
- Filenames inside day folders are lowercase (`readme.md`, `task.md`). Folder names follow
  the `DayNN` patterns described above — match the existing pattern of neighboring folders
  rather than inventing a new one.
- `readme.md` files commonly open with a pointer line such as
  `## Check out the task.md file for dayNN task details`, then cover concepts and end with
  the sample YAML used in the video.
- `task.md` files start with a `## Task N/40` heading and list numbered tasks
  (`**Task 1**`, `**Task2**`, …), often including a YAML block to apply or troubleshoot.
- Inline manifests use fenced blocks tagged ```` ```YAML ````. Keep two-space indentation
  and the existing style when adding or fixing manifests.
- Images are embedded as GitHub user-attachment URLs; keep that pattern for new diagrams.

## Working in this repo

- Adding a new lesson means: create `Resources/DayNN/` with `readme.md` (+ `task.md` if it
  has an assignment), then add a matching `## Day N` section in the root `README.md`.
- Validate any YAML you add or change (e.g. `kubectl apply --dry-run=client -f -`) since
  example manifests are meant to be runnable, but note that some `task.md` blocks are
  intentionally broken for troubleshooting exercises — do not "fix" those.
- There is no CI; correctness is verified by content review, not automated tests.
