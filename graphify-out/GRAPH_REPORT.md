# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 201 files · ~199,617 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1813 nodes · 4088 edges · 97 communities (81 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e6ef18e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- hacker-arena.tsx
- mission-kit.tsx
- package.json
- site-checkout/package.json
- components/game/game-entry.tsx
- world-kit.tsx
- What You Must Do When Invoked
- app/ruang-kerja/[jalur]/page.tsx
- lib/types.ts
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- data-center.tsx
- lib/data/index.ts
- dependencies
- race-world.tsx
- site-checkout/components/ui/card.tsx
- dependencies
- compilerOptions
- compilerOptions
- drone-level.tsx
- arena-models.tsx
- site-checkout/components/game/mission-panel.tsx
- race-scenery.tsx
- public/manifest.json
- site-checkout/public/manifest.json
- drone-scenery.tsx
- components/game/game-canvas.tsx
- components/workspace/workspace-shell.tsx
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
- ops-level.tsx
- site-checkout/components/workspace/workspace-shell.tsx
- ops-scenery.tsx
- inspektur-world.tsx
- mission-world.tsx
- truck-models.tsx
- worlds.ts
- canvasTexture
- world-controls.ts
- race-track.ts
- pointAt
- ops-models.tsx
- drone-city.tsx
- hunt-layout.ts
- drone-layout.ts
- components/quiz/quiz-flow.tsx
- ArenaLevel
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- ref_next
- hunt-scenery.tsx
- app/layout.tsx
- site-checkout/app/layout.tsx
- ArenaHall
- clampDelta
- hunt-level.tsx
- site-checkout/components/quiz/quiz-flow.tsx
- site-checkout/components/game/campus-panels.tsx
- fbm
- surfaceAt
- campus-building.tsx
- CitySkyline
- sampleTrack
- components/pwa/install-pwa-prompt.tsx
- site-checkout/components/pwa/install-pwa-prompt.tsx

## God Nodes (most connected - your core abstractions)
1. `clampDelta()` - 99 edges
2. `cn()` - 94 edges
3. `cn()` - 57 edges
4. `seeded()` - 49 edges
5. `clampPercent()` - 31 edges
6. `canvasTexture()` - 26 edges
7. `fbm()` - 21 edges
8. `groundAt()` - 20 edges
9. `Button` - 20 edges
10. `compilerOptions` - 16 edges

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

## Communities (97 total, 16 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.06
Nodes (29): ARENA_R, MalwareShots(), PatchShots(), SERVER, StaffModel(), ThreatModel(), Boss, BOSS_ATTACK_GAP (+21 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.05
Nodes (70): MissionPanel(), AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS, ChartLevel() (+62 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.11
Nodes (24): CampusAssistant(), InfoCenter(), TrackDetails(), CHARACTERS, GameEntry(), LiteCampus(), StartScreen(), supportsWebGL() (+16 more)

### Community 5 - "world-kit.tsx"
Cohesion: 0.09
Nodes (36): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), clampPercent(), FirewallLevel(), firewallPace() (+28 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "lib/types.ts"
Cohesion: 0.09
Nodes (32): NAV_LINKS, Navbar(), Button, ButtonProps, buttonVariants, components_ui_dialog_dialog, ScenarioDialog(), AuditScenario() (+24 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (19): BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, DASH_MATERIAL, FOREST_ACCENTS, FOREST_BALL, FOREST_CONE (+11 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.09
Nodes (25): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, GameEntry() (+17 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.12
Nodes (17): ChatbotWidget(), KATEGORI_LIST, ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), TESTIMONIALS, getScenarioByMenuId(), WORKSPACE_MENUS (+9 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.14
Nodes (15): RaceScenery(), TrafficContext, nearestIndex(), desired, DRIVE_TOUCH, forward, GATE_OFFSETS, lookTarget (+7 more)

### Community 15 - "site-checkout/components/ui/card.tsx"
Cohesion: 0.16
Nodes (11): TRACK_ICONS, QuestionCard(), Badge(), BadgeProps, badgeVariants, Card(), CardContent(), CardDescription() (+3 more)

### Community 16 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 17 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 18 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 19 - "drone-level.tsx"
Cohesion: 0.07
Nodes (39): HQ_TOWER, MAX_ALTITUDE, PAD_RADIUS, RINGS, bearing(), Bug, CANDIDATES, Compass() (+31 more)

### Community 20 - "arena-models.tsx"
Cohesion: 0.06
Nodes (28): ArenaVisualState, BossModel(), BOT_TINTS, CABINETS, CABLES, GHOST_TINTS, ICO_DIRS, INNER_RACKS (+20 more)

### Community 21 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.12
Nodes (15): auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission(), META (+7 more)

### Community 22 - "race-scenery.tsx"
Cohesion: 0.08
Nodes (35): DRY, FLEET, FOREST, GRASS_A, GRASS_B, Inst, inZone(), Kites() (+27 more)

### Community 23 - "public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 24 - "site-checkout/public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 25 - "drone-scenery.tsx"
Cohesion: 0.08
Nodes (27): deckAt(), LAND_Y, PADDY_ZONES, PYLON_LINE, RAIL, ROAD_HALF, bridgeSpots(), DroneNature() (+19 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.09
Nodes (20): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone, FLOWER_COLORS (+12 more)

### Community 27 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.21
Nodes (11): TRACK_ICONS, ICONS, MenuGrid(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell(), fetchScenarioByMenuId() (+3 more)

### Community 28 - "cn"
Cohesion: 0.12
Nodes (24): RevealCard(), StaggerChildren(), StaggerChildrenProps, initials(), TestimonialCard(), QuestionCard(), ResultCard(), TRACK_ICONS (+16 more)

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
Cohesion: 0.08
Nodes (34): ConeModel(), Countdown(), DroneModel(), Effects(), FxApi, HintCard(), PaperPile(), Particle (+26 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.17
Nodes (15): CATEGORIES, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), components_ui_tabs_tabs, TabsContent() (+7 more)

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
Cohesion: 0.10
Nodes (25): ChatbotWidget(), KATEGORI_LIST, ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchScenarioByMenuId(), TESTIMONIALS, getScenarioByMenuId() (+17 more)

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
Cohesion: 0.11
Nodes (29): ref_gsap, ref_lucide_react, ref_react, LiteCampus(), RevealCard(), StaggerChildren(), StaggerChildrenProps, NAV_LINKS (+21 more)

### Community 63 - "ops-level.tsx"
Cohesion: 0.06
Nodes (61): arrivalPath(), BAY_Z, bezier(), BOUNDS, Box, COFFEE_SPOTS, CONSOLES, CONVEYOR_PATH (+53 more)

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.16
Nodes (17): initials(), TestimonialCard(), Avatar(), AvatarFallback(), AvatarImage(), ICONS, MenuGrid(), TRACK_ICONS (+9 more)

### Community 65 - "ops-scenery.tsx"
Cohesion: 0.07
Nodes (39): Borders, CAR_COLORS, CONTAINER_COLORS, DashData, DIRT, DockArea, DRY, ErpOffice (+31 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.05
Nodes (47): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+39 more)

### Community 67 - "mission-world.tsx"
Cohesion: 0.17
Nodes (13): MissionWorld, SoundName, SOUNDS, AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS, LEVELS, WorldLevelProps (+5 more)

### Community 68 - "truck-models.tsx"
Cohesion: 0.15
Nodes (11): CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, TRAFFIC_SIZE, TrafficCar() (+3 more)

### Community 69 - "worlds.ts"
Cohesion: 0.09
Nodes (20): ArenaEnemyInfo, BinId, BONUS_KINDS, BONUS_SPOTS, DRONE_JOBS, DroneJob, DroneSite, FIREWALL_PACKETS (+12 more)

### Community 70 - "canvasTexture"
Cohesion: 0.21
Nodes (13): Signposts(), Water(), billboardTexture(), Paddies, Water(), ErpTerminal(), YardFloor, BILLBOARDS (+5 more)

### Community 71 - "world-controls.ts"
Cohesion: 0.18
Nodes (10): MissionWorld(), TouchButton, TouchControls(), createInputState(), KEY_MAP, PRESS_FOR_KEY, PressName, useWorldInput() (+2 more)

### Community 72 - "race-track.ts"
Cohesion: 0.13
Nodes (14): insideTrack(), LAKE, LANES, Paddy, RAIL_OFFSET, ROAD_HALF, ROAD_WIDTH, SAMPLES (+6 more)

### Community 73 - "pointAt"
Cohesion: 0.33
Nodes (12): faceRoad(), LAYOUT, openSide(), headingAt(), indexAt(), pointAt(), GateRow(), HAZARDS (+4 more)

### Community 74 - "ops-models.tsx"
Cohesion: 0.11
Nodes (23): box(), CarriedStack(), CoffeeCup(), Conveyor(), FlatbedTruck(), Forklift(), GHOST_BOX, GHOST_EDGES (+15 more)

### Community 75 - "drone-city.tsx"
Cohesion: 0.09
Nodes (43): PATHS, RUINS, SPRITE_SPAWNS, Fish(), boxBatch(), CAR_COLORS, City, Construction (+35 more)

### Community 76 - "hunt-layout.ts"
Cohesion: 0.07
Nodes (36): biomeAt(), BiomeId, BIOMES, blocked(), CAMP, FIXED_SOLIDS, FLOWER_COLORS, HARD_RADIUS (+28 more)

### Community 77 - "drone-layout.ts"
Cohesion: 0.09
Nodes (22): BATTERY_SPOTS, BUG_PATROLS, chaikin(), CITY, Flat, FLATS, HARD_RADIUS, ISLANDS (+14 more)

### Community 78 - "components/quiz/quiz-flow.tsx"
Cohesion: 0.18
Nodes (13): QuizFlow(), Progress(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId() (+5 more)

### Community 79 - "ArenaLevel"
Cohesion: 0.22
Nodes (10): arenaBlocked(), ArenaLevel(), ArenaScene(), burst(), createSim(), emit(), hudOf(), makeShots() (+2 more)

### Community 81 - "ref_next"
Cohesion: 0.22
Nodes (3): nextConfig, ref_next, nextConfig

### Community 82 - "hunt-scenery.tsx"
Cohesion: 0.06
Nodes (33): at(), Butterflies(), Critter, Flora, Focus, FOREST_FLOOR, GRASS_A, GRASS_B (+25 more)

### Community 83 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 84 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 85 - "ArenaHall"
Cohesion: 0.53
Nodes (6): ArenaHall, canvasTexture(), makeAlertScreen(), makeArenaFloor(), makeGrating(), makeWallTexture()

### Community 86 - "clampDelta"
Cohesion: 0.08
Nodes (35): CityClock(), Prism(), groundAt(), terrainHeight(), TOWER, HuntController(), Sim, walkable() (+27 more)

### Community 87 - "hunt-level.tsx"
Cohesion: 0.10
Nodes (26): Feedback, buildSolidGrid(), Personality, bearing(), BIN_HINT, ClassifyPanel(), clock(), Compass() (+18 more)

### Community 88 - "site-checkout/components/quiz/quiz-flow.tsx"
Cohesion: 0.21
Nodes (12): QuizFlow(), ResultCard(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId() (+4 more)

### Community 89 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.21
Nodes (11): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), sites_runtime_site_checkout_components_ui_dialog_dialog, sites_runtime_site_checkout_components_ui_tabs_tabs, TabsContent(), TabsList() (+3 more)

### Community 90 - "fbm"
Cohesion: 0.27
Nodes (14): COAST(), droneTerrain(), inPaddy(), inRect(), polyDistance(), railDistance(), riverDistance(), riverWidth() (+6 more)

### Community 91 - "surfaceAt"
Cohesion: 0.18
Nodes (14): ringNear(), surfaceAt(), createDrone(), createSim(), DroneController(), DroneLevel(), padY(), Pickups() (+6 more)

### Community 92 - "campus-building.tsx"
Cohesion: 0.20
Nodes (8): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec

### Community 93 - "CitySkyline"
Cohesion: 0.24
Nodes (10): BoundaryHedge(), CitySkyline(), DistantForest(), GrassPatches(), Hills(), insideRect(), makeFacadeTexture(), rectRing() (+2 more)

### Community 94 - "sampleTrack"
Cohesion: 0.33
Nodes (7): createTraffic(), fleetSize(), Traffic(), sampleTrack(), MiniMap(), ActionField(), createLive()

### Community 95 - "components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

### Community 96 - "site-checkout/components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

## Knowledge Gaps
- **620 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+615 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 760 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `route-level.tsx`, `components/game/game-entry.tsx`, `components/game/campus-panels.tsx`, `world-kit.tsx`, `lib/types.ts`, `lib/data/index.ts`, `components/quiz/quiz-flow.tsx`, `ArenaLevel`, `drone-level.tsx`, `hunt-level.tsx`, `components/workspace/workspace-shell.tsx`, `ops-level.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `world-kit.tsx`, `data-center.tsx`, `race-world.tsx`, `drone-level.tsx`, `arena-models.tsx`, `race-scenery.tsx`, `drone-scenery.tsx`, `route-level.tsx`, `ops-level.tsx`, `ops-scenery.tsx`, `inspektur-world.tsx`, `truck-models.tsx`, `canvasTexture`, `ops-models.tsx`, `drone-city.tsx`, `ArenaLevel`, `hunt-scenery.tsx`, `hunt-level.tsx`, `surfaceAt`, `sampleTrack`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _620 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.050616050616050616 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `site-checkout/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._