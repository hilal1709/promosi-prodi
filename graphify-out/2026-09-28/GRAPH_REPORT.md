# Graph Report - sisfor-pilih-jalurmu  (2026-09-28)

## Corpus Check
- 179 files · ~127,939 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1153 nodes · 2434 edges · 78 communities (61 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `abededdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/workspace/workspace-shell.tsx
- audit-mission.tsx
- package.json
- site-checkout/package.json
- components/game/game-entry.tsx
- cn
- What You Must Do When Invoked
- app/ruang-kerja/[jalur]/page.tsx
- site-checkout/lib/data/index.ts
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- components/quiz/quiz-flow.tsx
- lib/data/index.ts
- dependencies
- race-world.tsx
- site-checkout/components/game/campus-panels.tsx
- dependencies
- compilerOptions
- compilerOptions
- campus-building.tsx
- character-model.tsx
- site-checkout/components/game/mission-panel.tsx
- lib/types.ts
- public/manifest.json
- site-checkout/public/manifest.json
- scripts/generate-icons.py
- components/game/game-canvas.tsx
- ref_gsap
- components/ui/card.tsx
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- world-kit.tsx
- SISFOR UISI: Pilih Jalurmu
- cn
- SISFOR UISI: Pilih Jalurmu
- graphify reference: query, path, explain
- eslint.config.mjs
- erp-mission.tsx
- scripts
- Cara Menyambungkan Supabase (khusus project ini)
- scripts
- Cara Menyambungkan Supabase (khusus project ini)
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- This is NOT the Next.js you know
- graphify reference: GitHub clone and cross-repo merge
- build_characters.py
- CLAUDE.md
- extraction-spec.md
- postcss.config.mjs
- public/sw.js
- ref_node_child_process
- site-checkout/AGENTS.md
- site-checkout/postcss.config.mjs
- site-checkout/public/sw.js
- site-checkout/lib/types.ts
- ref_react
- data-mission.tsx
- mission-kit.tsx
- inspektur-world.tsx
- data-lab-world.tsx
- mission-world.tsx
- worlds.ts
- site-checkout/components/workspace/workspace-shell.tsx
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- ref_next
- useThrottled
- app/layout.tsx
- components/info/testimonial-card.tsx
- site-checkout/app/layout.tsx
- site-checkout/components/pwa/install-pwa-prompt.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `cn()` - 57 edges
3. `clampPercent()` - 27 edges
4. `clampDelta()` - 18 edges
5. `Button` - 18 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `JalurId` - 14 edges
9. `JalurId` - 14 edges
10. `main()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Step 2.5 - Transcribe video / audio files (only if video files detected)` --references--> `export()`  [INFERRED]
  .codex/skills/graphify/references/transcribe.md → tools/character/build_characters.py
- `StartScreen()` --calls--> `cn()`  [EXTRACTED]
  components/game/game-entry.tsx → lib/utils.ts
- `LiteCampus()` --calls--> `cn()`  [EXTRACTED]
  components/game/game-entry.tsx → lib/utils.ts
- `Meter()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/erp-mission.tsx → lib/utils.ts
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/mission-kit.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (78 total, 17 thin omitted)

### Community 0 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.22
Nodes (11): StaggerChildren(), StaggerChildrenProps, ICONS, MenuGrid(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell() (+3 more)

### Community 1 - "audit-mission.tsx"
Cohesion: 0.16
Nodes (18): AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, SimLevel(), clampPercent(), Feedback (+10 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.13
Nodes (22): InfoCenter(), TrackDetails(), CampusZone, CHARACTERS, GameCanvas, GameEntry(), LiteCampus(), StartScreen() (+14 more)

### Community 5 - "cn"
Cohesion: 0.17
Nodes (17): ref_radix_ui_react_avatar, initials(), TestimonialCard(), QuestionCard(), Avatar(), AvatarFallback(), AvatarImage(), Badge() (+9 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "site-checkout/lib/data/index.ts"
Cohesion: 0.10
Nodes (23): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions(), saveQuizResult() (+15 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.07
Nodes (31): ref_three_stdlib, InfoCenter(), TrackDetails(), Avatar(), CampusZone, isBlocked(), SPAWN, ZONES (+23 more)

### Community 11 - "components/quiz/quiz-flow.tsx"
Cohesion: 0.21
Nodes (12): QuizFlow(), ResultCard(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId() (+4 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.12
Nodes (18): ChatbotWidget(), KATEGORI_LIST, ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchScenarioByMenuId(), TESTIMONIALS, getScenarioByMenuId() (+10 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.15
Nodes (24): createRush(), createTruck(), crossed(), CUSTOMER_STOPS, DRIVE_TOUCH, GATE_OFFSETS, GateRow(), indexAt() (+16 more)

### Community 15 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.16
Nodes (16): ref_radix_ui_react_dialog, ref_radix_ui_react_tabs, CampusAssistant(), CATEGORIES, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay() (+8 more)

### Community 16 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 17 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 18 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 19 - "campus-building.tsx"
Cohesion: 0.20
Nodes (8): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec

### Community 20 - "character-model.tsx"
Cohesion: 0.27
Nodes (9): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), GameAvatarId, ref_react_three_drei, ref_react_three_fiber (+1 more)

### Community 21 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.08
Nodes (25): ref_class_variance_authority, ref_clsx, ref_radix_ui_react_progress, ref_radix_ui_react_slot, ref_tailwind_merge, auditContent, AuditMission(), dataCleanContent (+17 more)

### Community 22 - "lib/types.ts"
Cohesion: 0.10
Nodes (26): insightContent, WORKSPACE_SCENARIOS, AccessPolicy, AccessRequest, AuditFinding, AuditItem, AuditLogEntry, ChartQuestion (+18 more)

### Community 23 - "public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 24 - "site-checkout/public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 25 - "scripts/generate-icons.py"
Cohesion: 0.24
Nodes (10): os, pil, draw_monogram(), make_icon(), Menghasilkan ikon PWA (public/icons/*) untuk SISFOR UISI: Pilih Jalurmu. Desain…, rounded_bg(), draw_monogram(), make_icon() (+2 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.10
Nodes (18): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), FLOWER_COLORS, FLOWERS (+10 more)

### Community 28 - "components/ui/card.tsx"
Cohesion: 0.16
Nodes (11): TRACK_ICONS, QuestionCard(), Badge(), BadgeProps, badgeVariants, Card(), CardContent(), CardDescription() (+3 more)

### Community 29 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 30 - "Game characters (Arga & Nara)"
Cohesion: 0.50
Nodes (3): Build, Game characters (Arga & Nara), One-time setup

### Community 31 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 32 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 34 - "world-kit.tsx"
Cohesion: 0.14
Nodes (17): SoundName, SOUNDS, readAxis(), WorldInput, FixedCamera(), HudChip(), HudMeter(), Label() (+9 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "cn"
Cohesion: 0.22
Nodes (15): CampusAssistant(), CATEGORIES, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), components_ui_tabs_tabs (+7 more)

### Community 37 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 38 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 39 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint, ref_eslint_config_next, eslintConfig

### Community 40 - "erp-mission.tsx"
Cohesion: 0.15
Nodes (15): MissionPanel(), BoardLevel(), ErpMission(), FlowLevel(), IMPACTS, Meter(), OnMissionComplete, ERP_BOARD (+7 more)

### Community 41 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 42 - "Cara Menyambungkan Supabase (khusus project ini)"
Cohesion: 0.40
Nodes (4): Cara Menyambungkan Supabase (khusus project ini), Langkah 1 — Buat tabel & isi datanya (sekali saja), Langkah 2 — Ambil kunci API dan buat file `.env.local`, Penting soal keamanan

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "Cara Menyambungkan Supabase (khusus project ini)"
Cohesion: 0.40
Nodes (4): Cara Menyambungkan Supabase (khusus project ini), Langkah 1 — Buat tabel & isi datanya (sekali saja), Langkah 2 — Ambil kunci API dan buat file `.env.local`, Penting soal keamanan

### Community 45 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 46 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 47 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 50 - "build_characters.py"
Cohesion: 0.07
Nodes (43): argparse, bpy, graphify reference: transcribe video and audio, Step 2.5 - Transcribe video / audio files (only if video files detected), importlib, math, mathutils, numpy (+35 more)

### Community 62 - "site-checkout/lib/types.ts"
Cohesion: 0.11
Nodes (23): sites_runtime_site_checkout_components_ui_dialog_dialog, ScenarioDialog(), DataChartScenario(), DataCleanScenario(), DataInsightScenario(), DampakBadge(), ErpScenario(), getScenarioByMenuId() (+15 more)

### Community 63 - "ref_react"
Cohesion: 0.11
Nodes (27): RevealCard(), NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), TRACK_ICONS (+19 more)

### Community 64 - "data-mission.tsx"
Cohesion: 0.17
Nodes (14): CHART_OPTIONS, ChartLevel(), CleanLevel(), DataMission(), findIssue(), InsightLevel(), issueKey(), PALETTE (+6 more)

### Community 65 - "mission-kit.tsx"
Cohesion: 0.18
Nodes (11): Affinity, FeedbackToast(), LearningCard(), LevelComplete(), LevelShell(), MissionHud(), Stars(), starsFor() (+3 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.05
Nodes (44): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+36 more)

### Community 67 - "data-lab-world.tsx"
Cohesion: 0.10
Nodes (23): FirewallScene(), PacketNode(), ServerRack(), StatementClock(), BAR_X(), BarColumn(), Belt(), BOARD (+15 more)

### Community 68 - "mission-world.tsx"
Cohesion: 0.10
Nodes (19): MissionWorld, AffinityStep(), MISSION_THEME, MissionIntro(), AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS, LEVELS (+11 more)

### Community 69 - "worlds.ts"
Cohesion: 0.11
Nodes (16): BinId, BOARD_GATES, BONUS_KINDS, BONUS_SPOTS, DataCube, EVIDENCE, FIREWALL_PACKETS, FirewallPacket (+8 more)

### Community 70 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.15
Nodes (15): StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, ICONS, MenuGrid(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS (+7 more)

### Community 72 - "ref_next"
Cohesion: 0.22
Nodes (3): nextConfig, ref_next, nextConfig

### Community 73 - "useThrottled"
Cohesion: 0.29
Nodes (8): ConfrontLevel(), FirewallLevel(), firewallPace(), InspectLevel(), shuffle(), CityLevel(), ConveyorLevel(), useThrottled()

### Community 74 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 75 - "components/info/testimonial-card.tsx"
Cohesion: 0.43
Nodes (5): initials(), TestimonialCard(), Avatar(), AvatarFallback(), AvatarImage()

### Community 76 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 77 - "site-checkout/components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

## Knowledge Gaps
- **399 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+394 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 515 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `data-mission.tsx`, `audit-mission.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `components/game/game-entry.tsx`, `data-lab-world.tsx`, `world-kit.tsx`, `components/workspace/workspace-shell.tsx`, `erp-mission.tsx`, `useThrottled`, `components/info/testimonial-card.tsx`, `lib/data/index.ts`, `components/ui/card.tsx`, `ref_react`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `site-checkout/components/workspace/workspace-shell.tsx`, `site-checkout/lib/data/index.ts`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/game/campus-panels.tsx`, `site-checkout/components/game/mission-panel.tsx`, `site-checkout/lib/types.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `clampPercent()` connect `audit-mission.tsx` to `data-mission.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `data-lab-world.tsx`, `mission-world.tsx`, `erp-mission.tsx`, `useThrottled`, `race-world.tsx`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _399 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `site-checkout/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `components/game/game-entry.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._