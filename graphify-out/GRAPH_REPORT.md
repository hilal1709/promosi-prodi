# Graph Report - sisfor-pilih-jalurmu  (2026-09-28)

## Corpus Check
- 180 files · ~130,295 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1176 nodes · 2486 edges · 76 communities (60 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `abededdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/workspace/workspace-shell.tsx
- mission-kit.tsx
- package.json
- site-checkout/package.json
- lib/game.ts
- cn
- What You Must Do When Invoked
- app/ruang-kerja/[jalur]/page.tsx
- site-checkout/lib/data/index.ts
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- data-center.tsx
- lib/data/index.ts
- dependencies
- race-world.tsx
- site-checkout/components/game/campus-panels.tsx
- dependencies
- compilerOptions
- compilerOptions
- campus-building.tsx
- character-model.tsx
- ref_react
- lib/types.ts
- public/manifest.json
- site-checkout/public/manifest.json
- scripts/generate-icons.py
- components/game/game-canvas.tsx
- ref_gsap
- ref_lucide_react
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- mission-world.tsx
- SISFOR UISI: Pilih Jalurmu
- cn
- SISFOR UISI: Pilih Jalurmu
- graphify reference: query, path, explain
- eslint.config.mjs
- site-checkout/components/game/mission-panel.tsx
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
- components/ui/button.tsx
- site-checkout/components/workspace/scenario-dialog.tsx
- site-checkout/components/quiz/quiz-flow.tsx
- inspektur-world.tsx
- data-lab-world.tsx
- world-controls.ts
- worlds.ts
- site-checkout/components/workspace/workspace-shell.tsx
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- site-checkout/components/game/game-canvas.tsx
- components/ui/badge.tsx
- app/layout.tsx
- site-checkout/app/layout.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `cn()` - 57 edges
3. `clampPercent()` - 27 edges
4. `clampDelta()` - 21 edges
5. `Button` - 18 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `JalurId` - 14 edges
9. `JalurId` - 14 edges
10. `main()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Step 2.5 - Transcribe video / audio files (only if video files detected)` --references--> `export()`  [INFERRED]
  .codex/skills/graphify/references/transcribe.md → tools/character/build_characters.py
- `Meter()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/erp-mission.tsx → lib/utils.ts
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/mission-kit.tsx → lib/utils.ts
- `Navbar()` --calls--> `cn()`  [EXTRACTED]
  components/layout/navbar.tsx → lib/utils.ts
- `AvatarImage()` --calls--> `cn()`  [EXTRACTED]
  components/ui/avatar.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (76 total, 16 thin omitted)

### Community 0 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.20
Nodes (11): ScenarioDialog(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell(), CURRICULUM, CurriculumSummary, fetchScenarioByMenuId() (+3 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.06
Nodes (65): MissionPanel(), AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS, ChartLevel() (+57 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "lib/game.ts"
Cohesion: 0.14
Nodes (15): GameEntry(), supportsWebGL(), useGameAudio(), calculateTrackScores(), clampScore(), DEFAULT_AUDIO, DEFAULT_GAME_PROGRESS, GAME_STORAGE_KEY (+7 more)

### Community 5 - "cn"
Cohesion: 0.15
Nodes (19): ref_class_variance_authority, ref_radix_ui_react_avatar, initials(), TestimonialCard(), Navbar(), QuestionCard(), Avatar(), AvatarFallback() (+11 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "site-checkout/lib/data/index.ts"
Cohesion: 0.17
Nodes (12): ref_supabase_supabase_js, ChatbotWidget(), KATEGORI_LIST, FAQ_ITEMS, fetchFaqItems(), TESTIMONIALS, isSupabaseConfigured, supabase (+4 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.17
Nodes (16): GameEntry(), LiteCampus(), supportsWebGL(), ZONE_LABELS, useGameAudio(), calculateTrackScores(), clampScore(), DEFAULT_AUDIO (+8 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.17
Nodes (18): canvasTexture(), DataCenterHall, DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture(), makeGraphTexture() (+10 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.10
Nodes (24): ChatbotWidget(), KATEGORI_LIST, QuestionCard(), QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions() (+16 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.16
Nodes (23): createRush(), createTruck(), crossed(), CUSTOMER_STOPS, DRIVE_TOUCH, GATE_OFFSETS, GateRow(), indexAt() (+15 more)

### Community 15 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.17
Nodes (14): ref_radix_ui_react_tabs, CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), sites_runtime_site_checkout_components_ui_dialog_dialog, sites_runtime_site_checkout_components_ui_tabs_tabs, TabsContent() (+6 more)

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
Cohesion: 0.43
Nodes (6): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), ref_react_three_drei

### Community 21 - "ref_react"
Cohesion: 0.14
Nodes (17): ref_clsx, ref_radix_ui_react_progress, ref_radix_ui_react_slot, ref_react, ref_tailwind_merge, RevealCard(), StaggerChildrenProps, NAV_LINKS (+9 more)

### Community 22 - "lib/types.ts"
Cohesion: 0.08
Nodes (33): AuditScenario(), DataChartScenario(), DataCleanScenario(), DataInsightScenario(), DampakBadge(), ErpScenario(), getScenarioByMenuId(), WORKSPACE_MENUS (+25 more)

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
Cohesion: 0.09
Nodes (20): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone, FLOWER_COLORS (+12 more)

### Community 27 - "ref_gsap"
Cohesion: 0.25
Nodes (3): StaggerChildren(), StaggerChildrenProps, ref_gsap

### Community 28 - "ref_lucide_react"
Cohesion: 0.15
Nodes (16): TRACK_ICONS, initials(), TestimonialCard(), ResultCard(), TRACK_ICONS, Avatar(), AvatarFallback(), AvatarImage() (+8 more)

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

### Community 34 - "mission-world.tsx"
Cohesion: 0.13
Nodes (17): MissionWorld, AffinityStep(), MISSION_THEME, MissionIntro(), SoundName, SOUNDS, AUDIT_LEVELS, DATA_LEVELS (+9 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "cn"
Cohesion: 0.13
Nodes (25): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), CHARACTERS, LiteCampus(), StartScreen(), ZONE_LABELS (+17 more)

### Community 37 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 38 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 39 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint, ref_eslint_config_next, eslintConfig

### Community 40 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.13
Nodes (13): auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission(), META (+5 more)

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
Cohesion: 0.14
Nodes (14): SoundName, DataCleanScenario(), AudioSettings, AuditItem, DataCleanContent, DataInsightOpsi, DataRow, ErpOpsi (+6 more)

### Community 63 - "components/ui/button.tsx"
Cohesion: 0.12
Nodes (12): NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button, ButtonProps (+4 more)

### Community 64 - "site-checkout/components/workspace/scenario-dialog.tsx"
Cohesion: 0.18
Nodes (13): ref_radix_ui_react_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), AuditScenario(), DataChartScenario() (+5 more)

### Community 65 - "site-checkout/components/quiz/quiz-flow.tsx"
Cohesion: 0.23
Nodes (11): QuizFlow(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId(), randomId() (+3 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.04
Nodes (49): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+41 more)

### Community 67 - "data-lab-world.tsx"
Cohesion: 0.08
Nodes (37): Feedback, Technician(), FirewallScene(), PacketNode(), ServerRack(), StatementClock(), BAR_X(), BarColumn() (+29 more)

### Community 68 - "world-controls.ts"
Cohesion: 0.18
Nodes (10): MissionWorld(), TouchButton, TouchControls(), createInputState(), KEY_MAP, PRESS_FOR_KEY, PressName, useWorldInput() (+2 more)

### Community 69 - "worlds.ts"
Cohesion: 0.11
Nodes (17): BinId, BOARD_GATES, BONUS_KINDS, BONUS_SPOTS, DATA_BINS, DataCube, EVIDENCE, FIREWALL_PACKETS (+9 more)

### Community 70 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.12
Nodes (19): StaggerChildren(), TRACK_ICONS, ResultCard(), ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher() (+11 more)

### Community 72 - "site-checkout/components/game/game-canvas.tsx"
Cohesion: 0.15
Nodes (8): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, GameQuality

### Community 73 - "components/ui/badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 74 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 76 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

## Knowledge Gaps
- **406 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+401 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 525 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `components/workspace/workspace-shell.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `data-lab-world.tsx`, `lib/game.ts`, `components/ui/badge.tsx`, `lib/data/index.ts`, `lib/types.ts`, `ref_gsap`, `ref_lucide_react`, `components/ui/button.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `site-checkout/components/workspace/scenario-dialog.tsx`, `site-checkout/components/workspace/workspace-shell.tsx`, `site-checkout/lib/data/index.ts`, `site-checkout/components/game/mission-panel.tsx`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/game/campus-panels.tsx`, `ref_react`, `site-checkout/lib/types.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `clampPercent()` connect `mission-kit.tsx` to `inspektur-world.tsx`, `data-lab-world.tsx`, `mission-world.tsx`, `world-controls.ts`, `race-world.tsx`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _406 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06050228310502283 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `site-checkout/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._