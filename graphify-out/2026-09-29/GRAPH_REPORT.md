# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 188 files · ~153,466 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1392 nodes · 2991 edges · 81 communities (65 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cac20ea2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- hacker-arena.tsx
- mission-kit.tsx
- package.json
- site-checkout/package.json
- components/game/game-entry.tsx
- data-lab-world.tsx
- What You Must Do When Invoked
- app/ruang-kerja/[jalur]/page.tsx
- lib/types.ts
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
- arena-models.tsx
- site-checkout/components/game/mission-panel.tsx
- race-scenery.tsx
- public/manifest.json
- site-checkout/public/manifest.json
- CitySkyline
- components/game/game-canvas.tsx
- ref_lucide_react
- cn
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- route-level.tsx
- SISFOR UISI: Pilih Jalurmu
- components/game/campus-panels.tsx
- SISFOR UISI: Pilih Jalurmu
- graphify reference: query, path, explain
- eslint.config.mjs
- site-checkout/lib/types.ts
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
- ref_react
- components/pwa/install-pwa-prompt.tsx
- site-checkout/components/workspace/workspace-shell.tsx
- site-checkout/components/quiz/quiz-flow.tsx
- inspektur-world.tsx
- world-kit.tsx
- truck-models.tsx
- worlds.ts
- cn
- mission-world.tsx
- race-track.ts
- pointAt
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- ref_next
- app/layout.tsx
- useThrottled
- site-checkout/app/layout.tsx
- ArenaLevel
- ArenaHall

## God Nodes (most connected - your core abstractions)
1. `cn()` - 88 edges
2. `cn()` - 57 edges
3. `clampDelta()` - 44 edges
4. `clampPercent()` - 29 edges
5. `Button` - 19 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `pointAt()` - 15 edges
9. `JalurId` - 14 edges
10. `useThrottled()` - 14 edges

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

## Communities (81 total, 16 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.07
Nodes (26): ARENA_R, MalwareShots(), PatchShots(), SERVER, StaffModel(), ThreatModel(), DataCenterLights(), Boss (+18 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.08
Nodes (50): MissionPanel(), AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS, ChartLevel() (+42 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.11
Nodes (24): CampusAssistant(), InfoCenter(), TrackDetails(), CHARACTERS, GameEntry(), LiteCampus(), StartScreen(), supportsWebGL() (+16 more)

### Community 5 - "data-lab-world.tsx"
Cohesion: 0.10
Nodes (19): BAR_X(), BarColumn(), BOARD, CHART_FACES, ChartLevel(), ChartScene(), CITY, CityScene() (+11 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "lib/types.ts"
Cohesion: 0.08
Nodes (33): DataInsightScenario(), DampakBadge(), ErpScenario(), insightContent, WORKSPACE_MENUS, WORKSPACE_SCENARIOS, AccessPolicy, AccessRequest (+25 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (19): BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, DASH_MATERIAL, FOREST_ACCENTS, FOREST_BALL, FOREST_CONE (+11 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.09
Nodes (26): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, GameEntry() (+18 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.16
Nodes (19): CharacterMotion, canvasTexture(), DataCenterHall, DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+11 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.11
Nodes (23): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions(), saveQuizResult() (+15 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.09
Nodes (26): createTraffic(), fleetSize(), RaceScenery(), Traffic(), TrafficContext, nearestIndex(), sampleTrack(), CUSTOMER_STOPS (+18 more)

### Community 15 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.13
Nodes (21): ref_radix_ui_react_dialog, ref_radix_ui_react_tabs, CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), sites_runtime_site_checkout_components_ui_dialog_dialog, DialogContent() (+13 more)

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

### Community 20 - "arena-models.tsx"
Cohesion: 0.06
Nodes (27): ArenaVisualState, BossModel(), BOT_TINTS, CABINETS, CABLES, GHOST_TINTS, ICO_DIRS, INNER_RACKS (+19 more)

### Community 21 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.13
Nodes (13): ref_radix_ui_react_progress, auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission() (+5 more)

### Community 22 - "race-scenery.tsx"
Cohesion: 0.07
Nodes (44): BILLBOARDS, Birds(), canvasTexture(), Clouds(), DRY, Factory(), fitText(), FLEET (+36 more)

### Community 23 - "public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 24 - "site-checkout/public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 25 - "CitySkyline"
Cohesion: 0.24
Nodes (10): BoundaryHedge(), CitySkyline(), DistantForest(), GrassPatches(), Hills(), insideRect(), makeFacadeTexture(), rectRing() (+2 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.09
Nodes (20): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone, FLOWER_COLORS (+12 more)

### Community 27 - "ref_lucide_react"
Cohesion: 0.15
Nodes (14): TRACK_ICONS, ScenarioDialog(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell(), fetchScenarioByMenuId(), fetchWorkspaceMenus() (+6 more)

### Community 28 - "cn"
Cohesion: 0.09
Nodes (34): RevealCard(), StaggerChildren(), StaggerChildrenProps, initials(), TestimonialCard(), NAV_LINKS, Navbar(), QuestionCard() (+26 more)

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

### Community 34 - "route-level.tsx"
Cohesion: 0.06
Nodes (43): Virus(), Technician(), CameraShake(), SparkLayer(), FirewallScene(), PacketNode(), ServerRack(), Belt() (+35 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.17
Nodes (15): CATEGORIES, components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), components_ui_tabs_tabs (+7 more)

### Community 37 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 38 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 39 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint, ref_eslint_config_next, eslintConfig

### Community 40 - "site-checkout/lib/types.ts"
Cohesion: 0.09
Nodes (29): ChatbotWidget(), KATEGORI_LIST, DataCleanScenario(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchScenarioByMenuId(), TESTIMONIALS (+21 more)

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
Cohesion: 0.06
Nodes (53): argparse, bpy, graphify reference: transcribe video and audio, Step 2.5 - Transcribe video / audio files (only if video files detected), importlib, math, mathutils, numpy (+45 more)

### Community 62 - "ref_react"
Cohesion: 0.10
Nodes (22): ref_class_variance_authority, ref_clsx, ref_gsap, ref_radix_ui_react_slot, ref_react, ref_tailwind_merge, RevealCard(), NAV_LINKS (+14 more)

### Community 63 - "components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.13
Nodes (17): StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, ResultCard(), ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS (+9 more)

### Community 65 - "site-checkout/components/quiz/quiz-flow.tsx"
Cohesion: 0.23
Nodes (11): QuizFlow(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId(), randomId() (+3 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.05
Nodes (44): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+36 more)

### Community 67 - "world-kit.tsx"
Cohesion: 0.17
Nodes (18): buildCharacter(), CharacterModel(), characterUrl(), prepareMaterials(), SoundName, readAxis(), WorldInput, FixedCamera() (+10 more)

### Community 68 - "truck-models.tsx"
Cohesion: 0.12
Nodes (15): TrafficCarState, CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, RIVAL_LIVERY (+7 more)

### Community 69 - "worlds.ts"
Cohesion: 0.09
Nodes (20): DATA_TABLE, ARENA_ENEMIES, ARENA_STAFF, ArenaEnemyInfo, ArenaEnemyKind, BinId, BOARD_GATES, BONUS_KINDS (+12 more)

### Community 70 - "cn"
Cohesion: 0.17
Nodes (17): ref_radix_ui_react_avatar, initials(), TestimonialCard(), QuestionCard(), Avatar(), AvatarFallback(), AvatarImage(), Badge() (+9 more)

### Community 71 - "mission-world.tsx"
Cohesion: 0.10
Nodes (19): MissionWorld, AffinityStep(), MISSION_THEME, MissionIntro(), AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS, LEVELS (+11 more)

### Community 72 - "race-track.ts"
Cohesion: 0.13
Nodes (14): insideTrack(), LAKE, LANES, Paddy, RAIL_OFFSET, ROAD_HALF, ROAD_WIDTH, SAMPLES (+6 more)

### Community 73 - "pointAt"
Cohesion: 0.21
Nodes (20): faceRoad(), LAYOUT, openSide(), crossed(), headingAt(), indexAt(), pointAt(), createRush() (+12 more)

### Community 75 - "ref_next"
Cohesion: 0.22
Nodes (3): nextConfig, ref_next, nextConfig

### Community 76 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 77 - "useThrottled"
Cohesion: 0.33
Nodes (7): FirewallLevel(), firewallPace(), InspectLevel(), shuffle(), CityLevel(), ConveyorLevel(), useThrottled()

### Community 78 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 79 - "ArenaLevel"
Cohesion: 0.22
Nodes (10): arenaBlocked(), ArenaLevel(), ArenaScene(), burst(), createSim(), emit(), hudOf(), makeShots() (+2 more)

### Community 80 - "ArenaHall"
Cohesion: 0.53
Nodes (6): ArenaHall, canvasTexture(), makeAlertScreen(), makeArenaFloor(), makeGrating(), makeWallTexture()

## Knowledge Gaps
- **487 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+482 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 620 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `route-level.tsx`, `components/game/game-entry.tsx`, `components/game/campus-panels.tsx`, `data-lab-world.tsx`, `world-kit.tsx`, `truck-models.tsx`, `lib/types.ts`, `lib/data/index.ts`, `useThrottled`, `ArenaLevel`, `ref_lucide_react`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `clampDelta()` connect `route-level.tsx` to `hacker-arena.tsx`, `inspektur-world.tsx`, `world-kit.tsx`, `truck-models.tsx`, `data-lab-world.tsx`, `data-center.tsx`, `race-world.tsx`, `ArenaLevel`, `arena-models.tsx`, `race-scenery.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `site-checkout/components/workspace/workspace-shell.tsx`, `site-checkout/lib/types.ts`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/game/campus-panels.tsx`, `site-checkout/components/game/mission-panel.tsx`, `ref_react`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07706766917293233 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._