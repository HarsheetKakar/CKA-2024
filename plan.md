# Plan: "Helmsman — A Kubernetes Voyage" (Days 1–10 pilot)

> Working title: **Helmsman — A Kubernetes Voyage**. Frontend-only, **local-only** (dev/preview;
> no deploy workflow). See "Locked decisions" below for the resolved design tree.

## Problem & approach

The CKA-2024 repo is a 40+ day Kubernetes course. Each `Resources/DayNN/` folder holds
concepts (`readme.md`) and a hands-on assignment (`task.md`). We will build a **frontend-only
React + Vite** website that turns each day's concepts/tasks into a **unique, fun interactive
puzzle** (drag-and-drop, sequencing, wiring, Q&A, simulators). 

Scope for this plan: **Days 1–10 as a polished pilot**, with an architecture designed to extend
to all ~55 days later.

### Hard content rule (cumulative knowledge only)
A day's puzzle may only use concepts introduced **on that day or earlier**. No forward references.
(e.g., Day 3 may use Docker concepts from Days 1–3, but nothing about Pods/Services/etc.)
Content is sourced from the repo's `readme.md`/`task.md` and enriched with extra K8s knowledge,
strictly within the cumulative boundary.

---

## Design direction (frontend-design skill)

**Subject grounding.** Kubernetes literally means *helmsman/pilot* (Greek κυβερνήτης); its logo is
a ship's wheel, containers are shipping containers, YAML files are *manifests*, Helm is the package
manager, "pods" evoke whales (Docker's mascot). We lean into this authentic maritime vernacular —
a **Harbor Operations Console** — rather than the generic Kubernetes blue. This deliberately avoids
the three AI-default looks (cream+serif+terracotta, black+acid-green, broadsheet hairlines).

**Palette — "Harbor Night & Brass Instruments"** (dark theme only — no light mode, no toggle)
- `--abyss  #0B1E2D` — deep harbor ink (app background)
- `--hull   #13303F` — instrument panel surface
- `--foam   #E8F1F2` — primary light text
- `--brass  #E0A458` — primary accent (brass instrumentation, highlights)
- `--signal #3DCCC7` — teal beacon (interactive/active/success states)
- `--buoy   #F2545B` — alert / error / invalid drop

Tokens are still **semantic** (e.g. `--surface`, `--text`, `--accent`, `--active`, `--danger`) so a
light theme could be added later, but only the dark set ships now. No hardcoded colors in components.

**Typography**
- Display: **Syne** (variable, distinctive geometric widths) — titles, day names, big numbers.
- Body/UI: **Inter** — instructions, labels, buttons.
- Mono/data: **IBM Plex Mono** — YAML manifests, CLI commands, port numbers, DNS names
  (authentic to terminals & ship manifests). Fonts via Fontsource (bundled, no CDN dependency).

**Layout concept**
- **Hub** = a nautical voyage chart: Days 1–10 are charted *ports* along a route, with a central
  **helm-wheel progress compass** (the 7-spoke K8s wheel reimagined) whose segments light as days
  are completed. Locked future days appear as fogged ports.
- **Day page** = an instrument *console*: framed game stage in the center, an "Objective / Ship's
  Log" side panel (instructions, score, hints), and a bottom status strip.

**Signature element.** The **helm-wheel progress compass** on the hub, paired with the recurring
**draggable cargo-crate** tactile motif used across the games. Boldness spent here; everything else
stays quiet and disciplined — feedback is **understated** (clean snaps, subtle state changes; no
confetti, no audio).

**Quality floor.** Desktop-first but fully responsive and **touch-playable down to mobile**; visible
keyboard focus, `prefers-reduced-motion` respected, WCAG AA contrast.

---

## Architecture

- **Stack:** React + Vite + **TypeScript (strict)**, plain CSS (semantic CSS-variable tokens, per-
  component CSS). Routing via `react-router-dom` **HashRouter**; Vite `base: './'` (relative) for
  portability. Drag-and-drop via `@dnd-kit/core` (pointer + touch + keyboard sensors).
- **Key deps:** `zustand` (+ `persist` middleware) for progress/theme state · `framer-motion` (used
  sparingly, CSS-first otherwise) · `lucide-react` (utility icons) · custom inline SVG for thematic
  art · Fontsource (Syne / Inter / IBM Plex Mono, bundled). Tooling: **ESLint + Prettier**, **Vitest**.
- **Location:** new top-level folder `interactive/` in the repo root.
- **Folder structure**
  ```
  interactive/
    index.html
    package.json  vite.config.ts  tsconfig.json
    src/
      main.tsx  App.tsx
      styles/        # tokens.css, global.css
      components/    # shared UI: Console, ObjectivePanel, HelmCompass, CrateCard, ScoreBadge...
      engine/        # reusable interaction primitives + shared validation contract
        types.ts            # GameResult/ValidationIssue contract, DayMeta, scoring
        DragSort.tsx        # categorize items into buckets (tap-to-bucket fallback)
        Sequencer.tsx       # order shuffled steps (up/down + keyboard reorder)
        MatchPairs.tsx      # match two columns (select-then-select fallback)
        Quiz.tsx            # scenario -> choice (radio-group a11y)
        YamlBuilder.tsx     # assemble manifest from fragments; indent/outdent buttons
        ComponentBoard.tsx  # place labeled entities into zones/slots (D5)
        ConnectionBoard.tsx # connect sources->targets, validate relationships (D9)
      days/          # one folder per day; day08 is a CUSTOM simulator, not a primitive
        day01/ ... day10/   (metadata + lazily-imported component)
      data/          # per-day content (questions, fragments, answers) as typed TS
      hooks/         # useReducedMotion, etc.
      store/         # zustand progress store (persist middleware)
      pages/         # Hub.tsx, DayPage.tsx, NotFound.tsx
  ```
- **Primitive boundaries (post-review).** Primitives own *interaction + a11y input modes*, NOT game
  logic — each day's win condition, copy, and feedback live in the day. `WiringBoard` is split into
  **`ComponentBoard`** (D5 spatial placement into zones) and **`ConnectionBoard`** (D9 source→target
  relationship graph) — they're genuinely different interactions. **Day 8** (reconciliation simulator:
  desired/actual replicas, sink-and-heal, rolling update) is a **custom day-level simulation** built
  from small pieces (dial, pod cards, event log, validators), *not* a generic primitive — we only
  generalize a `Simulator` later if Days 11+ need it.
- **A11y input modes are first-class, not afterthoughts:** DragSort = select-card→choose-bucket;
  Sequencer = move-up/down; MatchPairs = select→select; ConnectionBoard = tap-source→tap-target;
  YamlBuilder = select-fragment + insert/indent/outdent buttons. dnd-kit enhances; it is never the
  only path. This is the explicit answer to "touch-playable to mobile" for D5/D7/D9.
- **Data model:** day metadata (`{ id, title, topic, objective }`) is kept separate from the day
  component; the registry references a **lazily-imported component** (`component: lazy(() =>
  import('./day01/Day01'))`) so routing code-splits per day and metadata stays cheap to index. Puzzle
  content/answers live in typed `data/dayNN.ts`.
- **Persistence:** zustand `persist` stores per-day `{ completed, bestStars }` under one namespaced
  `localStorage` key; hub reads it to light compass segments and unlock ports. (No theme state —
  dark only.)
- **State layering (explicit):** (1) **persistent progress** = `{ completed, bestStars }`; (2)
  **current attempt state** = answers, wrong-attempt count, hints used, elapsed time — held locally in
  the day component, re-initialized fresh on route entry or "restart day", never persisted; (3)
  **global reset** = a confirmed action that clears all persistent progress. Replaying a completed day
  starts a fresh attempt and only updates `bestStars` (never lowers it).
- **Validation contract (shared):** every primitive/day reports through one shape —
  `{ correct: boolean; mistakes: ValidationIssue[]; completedSections: string[] }`. Validation runs
  **only on an explicit "Check" / "Submit" action**, not on every drag — this is what wrong-attempt
  scoring counts, and it prevents brute-forcing by trying every bucket. Stars derive from check-time
  mistakes; hints are free and don't affect stars (completion is decoupled from mastery).
- **Progression/unlock:** Day N unlocks when Day N-1 is completed (Day 1 always open). **Any successful
  finish completes a day and unlocks the next**, regardless of stars. Completed days are replayable.

### Locked decisions (resolved design tree)
- **Hosting:** local-only (`npm run dev` / `npm run preview`); no Pages/Actions workflow; relative base.
- **Animation:** CSS-first; Framer Motion only for the few orchestrated moments.
- **State:** Zustand + persist (progress + theme). **Tooling:** TS strict + ESLint + Prettier.
- **Testing:** light Vitest — engine logic + per-day **answer self-consistency** (no forward-ref test).
- **Cumulative rule:** enforced by **manual discipline** (user chose this over an automated test), with
  a lightweight safeguard: each `data/dayNN.ts` declares `allowedConcepts` / `introducedConcepts`, a
  reviewer checklist runs per day, and a cheap grep warns on obvious future terms (pod, deployment,
  service, namespace, replicaset…) appearing before their day. **D4 "Why K8s" is framed at capability
  level only** — "Kubernetes can restore failed workloads" / "expose stable discovery", never naming
  future objects (ReplicaSet, Service, Deployment) or YAML.
- **Assets:** custom inline SVG for signature/thematic art + `lucide-react` for utility icons; no raster.
- **Feedback:** understated, **no audio, no confetti**.
- **Devices:** desktop-first, responsive + touch-playable to mobile.
- **Scoring:** **0–5 stars from accuracy (wrong attempts at Check/Submit) only**; elapsed time shown
  for personal-best
  display, never a fail condition; no countdown. Stars map by mistake count: **5★ = flawless (0
  mistakes)**, then step down (e.g. 1→4★, 2→3★, 3→2★, 4→1★, 5+→0★), scaled per day to puzzle size.
- **Hints:** free, on-demand via a button in the Ship's Log panel; **no star penalty**.
- **Gating:** sequential unlock; completed days replayable; includes a "reset progress" control.
- **Themes:** **dark only** (no light mode, no toggle, no theme state); semantic tokens leave a seam.
- **Naming:** "Helmsman — A Kubernetes Voyage".
- **Discoverability:** short pointer section in root `README.md` + self-contained `interactive/README.md`.
- **Replayability:** item order shuffled per session; answer keys fixed.
- **Build sequence:** **vertical slice + two gates.** (1) Build minimal foundation + Day 1 polished →
  **look-and-feel gate** (lock visuals). (2) Build *rough* prototypes of Sequencer, YamlBuilder,
  ConnectionBoard, and the Day-8 simulator → **interaction-architecture gate** (lock the engine/
  validation API against the hard cases, NOT just DragSort/MatchPairs) → then scale Days 2–10. Add a
  per-day **content-correctness pass** (Dockerfiles build, YAML is valid, KIND/Service/FQDN accurate)
  before each day's polish.

### Per-day game designs (detailed)

Each day defines: **Concepts (cumulative-safe)** · **Mechanic & flow** · **Content (real data)** ·
**Win / scoring** · **Unique visual twist** · **A11y fallback**. Scoring is **0–5 stars from accuracy
(wrong attempts at Check/Submit) only** (5★ = flawless); hints are free and don't affect stars. Every day shows an **Objective card**
sourced from that day's `task.md`, and a "completed" debrief that links back to the real `readme.md`.

---

#### Day 01 — Docker Fundamentals → "Sorting Yard" (DragSort + MatchPairs)
- **Concepts (Day 1 only):** containers vs VMs, the building/house analogy, why containers solve
  "works on my machine", Docker workflow (build → ship → run), Docker architecture (client, daemon,
  image, registry, container).
- **Mechanic & flow:** Round 1 — drag a shuffled pile of cargo crates onto two ship decks:
  **Container deck** vs **Virtual Machine deck**. Round 2 — match the 5 Docker-architecture terms to
  their plain-language role.
- **Content:** sort items — *shares host OS kernel*, *each has its own guest OS*, *lightweight/MBs*,
  *heavyweight/GBs*, *starts in seconds*, *boots like a computer*, *isolated via namespaces/cgroups*,
  *isolated via hypervisor*. Match pairs — Docker **client**↔"sends commands", **daemon**↔"builds &
  runs containers", **image**↔"read-only template", **registry**↔"stores/shares images",
  **container**↔"running instance of an image".
- **Win / scoring:** all crates on correct deck + all pairs matched; stars from wrong-drop count.
- **Visual twist:** crates physically *stack* and the VM deck visibly rides lower in the water (heavier).
- **A11y:** each crate has a "send to deck" button set; pairs selectable via keyboard.

#### Day 02 — Dockerize an App → "Dockerfile Assembly Line" (Sequencer + fill-in-the-blank)
- **Concepts (Days 1–2):** Dockerfile instructions, build context, `docker build/run/push`, port
  publishing (`-p host:container`).
- **Mechanic & flow:** Stage 1 — reorder shuffled Dockerfile instructions onto a conveyor into a valid
  order. Stage 2 — fill the missing token in the build/run commands.
- **Content (verbatim from Day 2):** order `FROM node:18-alpine` → `WORKDIR /app` → `COPY . .` →
  `RUN yarn install --production` → `CMD ["node","src/index.js"]` → `EXPOSE 3000`. Fill blanks:
  `docker build -t day02-todo __` (`.`) and `docker run -dp ____:3000 image` (`3000`).
- **Win / scoring:** valid sequence (FROM must be first) + correct tokens; stars from wrong-attempt count.
- **Visual twist:** the conveyor "runs" the build top-to-bottom; an invalid order jams the line (buoy-red spark).
- **A11y:** Sequencer supports keyboard move-up/move-down; blanks are real inputs with validation.

#### Day 03 — Multi-Stage Builds → "Two-Stage Refinery" (DragSort + size meter)
- **Concepts (Days 1–3):** named stages (`AS installer` / `AS deployer`), `COPY --from`, why final
  image stays small (build deps left behind).
- **Mechanic & flow:** assign each instruction to **Builder stage** or **Shipping stage**; then mark
  artifacts (node_modules, source, build output) as *ship* or *leave behind*. An **image-size meter**
  shrinks as build-only artifacts are correctly dropped.
- **Content (from Day 3 Dockerfile):** Builder — `FROM node:18-alpine AS installer`, `npm install`,
  `npm run build`; Shipping — `FROM nginx:latest AS deployer`,
  `COPY --from=installer /app/build /usr/share/nginx/html`. Ship only the built `/app/build`.
- **Win / scoring:** correct stage split + only build output shipped; bonus stars for smallest meter.
- **Visual twist:** two linked refinery tanks; the final image "ships out" only what survived the trim.
- **A11y:** bucket-assign buttons; meter value announced via `aria-live`.

#### Day 04 — Why Kubernetes? → "Outage Response" (Quiz / scenario→capability)
- **Concepts (Days 1–4):** limits of running bare containers; what an orchestrator adds —
  self-healing, horizontal scaling, rollouts/rollbacks, service discovery/load-balancing, desired state.
- **Mechanic & flow:** incident cards arrive on a harbor-master console; for each, choose the K8s
  capability that resolves it. Wrong picks cost "harbor stability".
- **Content (scenarios → answer):** *a container crashed at 3am* → self-healing/restart; *Black-Friday
  traffic 10×* → horizontal scaling; *new release is buggy* → rollback; *replica IPs keep changing* →
  service discovery/load-balancing; *node died, pods lost* → reschedule to healthy node.
- **Win / scoring:** stability bar stays above 0; stars from wrong-attempt count.
- **Visual twist:** a stability gauge needle reacting to each decision; resolved incidents dock safely.
- **A11y:** standard radio-group quiz; gauge changes mirrored in text.

#### Day 05 — Kubernetes Architecture → "Build the Bridge" (WiringBoard + Sequencer)
- **Concepts (Days 1–5):** control-plane vs worker node; API server, scheduler, etcd, controller
  manager; kubelet, kube-proxy, container runtime; what each does (from Day 5 readme one-liners).
- **Mechanic & flow:** Stage 1 — drop components into the correct node (Control-Plane "bridge" vs
  Worker "deck"). Stage 2 — order the request flow when you run `kubectl apply`.
- **Content:** control-plane = API server, scheduler, etcd, controller-manager; worker = kubelet,
  kube-proxy, runtime. Flow: `kubectl` → **API server** → (auth) → **etcd** (store desired) →
  **scheduler** picks node → **kubelet** runs pod → **kube-proxy** wires networking.
- **Win / scoring:** all components placed + flow ordered; stars from misplacements.
- **Visual twist:** placing etcd lights the "ship's logbook"; correct flow animates a signal pulse
  traveling the wired path (one orchestrated motion, respects reduced-motion).
- **A11y:** drop-zones reachable by keyboard; flow uses the Sequencer's accessible reorder.

#### Day 06 — Install Cluster Locally (KIND) → "Bootstrap the Cluster" (Sequencer + fill-in-the-blank)
- **Concepts (Days 1–6):** KIND = K8s-in-Docker, prerequisites (Docker, kubectl), cluster config,
  multi-node (1 control-plane + workers), verifying with `kubectl get nodes`.
- **Mechanic & flow:** order the bootstrap checklist, then complete the `kind create cluster` command
  and a minimal cluster-config snippet (roles).
- **Content:** order — install Docker → install kubectl → install kind → write `kind.yaml` →
  `kind create cluster --config kind.yaml --name ____` → `kubectl get nodes`. Config roles:
  `control-plane`, `worker`, `worker`.
- **Win / scoring:** correct order + valid command/config; stars from wrong-attempt count.
- **Visual twist:** a dry-dock "assembling a vessel" progress — nodes snap into the hull as steps pass.
- **A11y:** keyboard reorder + text inputs; success state announced.

#### Day 07 — Pods → "Manifest Builder" (YamlBuilder with validation)
- **Concepts (Days 1–7):** imperative vs declarative; Pod manifest anatomy —
  `apiVersion/kind/metadata/spec/containers`, labels, `containerPort`.
- **Mechanic & flow:** drag YAML fragment tiles into an indented manifest skeleton; decoy/malformed
  keys (`kind: pod`, `image:` missing) are rejected with an inline reason. Live YAML preview updates.
- **Content (from Day 7 sample):** build `apiVersion: v1`, `kind: Pod`, `metadata.name: nginx-pod`,
  `labels {env: demo, type: frontend}`, `spec.containers[].name: nginx-container`, `image: nginx`,
  `ports.containerPort: 80`. Decoys: `kind: Deployment`, `apiVersion: apps/v1`, lowercase `pod`.
- **Win / scoring:** manifest validates against expected shape; stars from rejected-drop count.
- **Visual twist:** the manifest renders as a brass "shipping manifest" card that stamps VALID when complete.
- **A11y:** fragments insert via keyboard into labeled slots; validation messages via `aria-live`.

#### Day 08 — ReplicaSets & Deployments → "Desired State" (reconciliation simulator + MatchPairs)
- **Concepts (Days 1–8):** desired vs actual replicas, ReplicaSet self-healing, label selectors,
  Deployment rolling update / rollback.
- **Mechanic & flow:** Round 1 — set the **desired replicas** dial; the controller spawns pods to match.
  Player "sinks" a pod (failure) and must observe/confirm the controller recreates it to hold desired
  state. Round 2 — perform a **rolling update** by advancing pods from v1→v2 without dropping below
  availability; matching label-selector to the right pods gates the update.
- **Content:** desired counts (e.g., 3); selector `app: nginx` must match pod labels; rolling-update
  steps surge-one/terminate-one.
- **Win / scoring:** actual converges to desired and update completes with no full outage; stars from
  availability maintained.
- **Visual twist:** a fleet of pod-boats; desired line on a gauge, actual fills toward it; rolling
  update swaps boat colors v1→v2 one at a time.
- **A11y:** dial is a slider; "repair"/"advance" are buttons; counts announced.

#### Day 09 — Services → "Wire the Traffic" (WiringBoard + Quiz)
- **Concepts (Days 1–9):** why Services (stable access over changing pod IPs); label-selector binding;
  ClusterIP vs NodePort vs LoadBalancer vs ExternalName; ports/targetPort/nodePort.
- **Mechanic & flow:** Stage 1 — wire a Service to the pods whose labels match its `selector` (wrong
  pods reject the cable). Stage 2 — for each access scenario, pick the correct Service type and route a
  packet to the right endpoint (internal pod / node:nodePort / external DNS).
- **Content:** selector `app: web` connects only matching pods; scenarios — *internal-only* → ClusterIP,
  *reach app on a node port* → NodePort (e.g., 30001 from Day 9 config), *public IP/domain* →
  LoadBalancer, *route to external DNS* → ExternalName.
- **Win / scoring:** correct cabling + all packets routed; stars from mis-wires.
- **Visual twist:** glowing signal cables; a NodePort scenario reveals the `30001` harbor gate opening.
- **A11y:** cables created by selecting source then target; scenario answers are radio groups.

#### Day 10 — Namespaces → "Harbor Partition" (DragSort + DNS assembly)
- **Concepts (Days 1–10):** namespaces for isolation/organization, same-namespace short-name access,
  cross-namespace FQDN `service.namespace.svc.cluster.local`, default namespaces.
- **Mechanic & flow:** Stage 1 — sort resources into the correct namespace harbors (e.g., `dev`,
  `prod`, `kube-system`). Stage 2 — assemble the DNS name a pod must use to reach a Service in another
  namespace from shuffled segment tiles; same-namespace case accepts the short name.
- **Content:** place `kube-apiserver`/system pods → `kube-system`; app pods → `dev`/`prod`. DNS build:
  segments `payments` · `prod` · `svc` · `cluster.local` → `payments.prod.svc.cluster.local`;
  same-namespace reach uses just `payments`.
- **Win / scoring:** all resources partitioned + FQDN assembled correctly; stars from wrong placements.
- **Visual twist:** harbors separated by lock-gates; a correct cross-namespace call opens a gate and
  sends a ferry between partitions.
- **A11y:** assign-to-namespace buttons; DNS tiles orderable by keyboard with live preview.

---

## Todos (tracked in SQL)
1. Scaffold Vite + React + TS app in `interactive/`, add deps (router, dnd-kit, fontsource).
2. Build design system: `tokens.css`, global styles, fonts, base layout primitives.
3. Build shared engine primitives (DragSort, Sequencer, MatchPairs, Quiz, YamlBuilder, WiringBoard) + types.
4. Build `useProgress` (localStorage) + day registry + routing (HashRouter) + DayPage/Console shell.
5. Build Hub page with helm-wheel progress compass, voyage chart, locked/fog states.
6. Implement Days 1–3 games (Docker block) with their data + design polish.
7. Implement Days 4–6 games (Why K8s / Architecture / Install).
8. Implement Days 7–10 games (Pods / Deployments / Services / Namespaces).
9. Design critique pass: typography, spacing, motion, signature element; mobile + a11y + reduced-motion.
10. Add `interactive/README.md` (run/build), link from root `README.md`, verify `npm run build`.

## Notes & considerations
- Frontend-only, no backend; all content bundled. GitHub Pages deployable via HashRouter + `base`.
- Reuse engine primitives, but give **each day a distinct mechanic + visual twist** so no two days feel alike.
- Validate any inline K8s YAML/commands for correctness; keep within the cumulative-knowledge boundary.
- Keep root repo conventions intact; only add the new `interactive/` folder + one link in root README.
