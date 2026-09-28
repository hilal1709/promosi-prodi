# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 197 files · ~185,527 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1688 nodes · 3758 edges · 86 communities (70 shown, 16 thin omitted)
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
- lib/game.ts
- data-lab-world.tsx
- What You Must Do When Invoked
- app/ruang-kerja/[jalur]/page.tsx
- ref_react
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- data-center.tsx
- lib/types.ts
- dependencies
- race-world.tsx
- cn
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
- ref_lucide_react
- components/ui/card.tsx
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- route-level.tsx
- SISFOR UISI: Pilih Jalurmu
- cn
- SISFOR UISI: Pilih Jalurmu
- graphify reference: query, path, explain
- eslint.config.mjs
- site-checkout/lib/data/index.ts
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
- ops-layout.ts
- site-checkout/components/workspace/workspace-shell.tsx
- ops-scenery.tsx
- inspektur-world.tsx
- world-kit.tsx
- truck-models.tsx
- worlds.ts
- seeded
- mission-world.tsx
- race-track.ts
- pointAt
- ops-models.tsx
- clampDelta
- ops-level.tsx
- drone-layout.ts
- components/quiz/quiz-flow.tsx
- ArenaLevel
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- ref_next
- site-checkout/components/info/testimonial-card.tsx
- app/layout.tsx
- site-checkout/app/layout.tsx
- ArenaHall

## God Nodes (most connected - your core abstractions)
1. `cn()` - 92 edges
2. `clampDelta()` - 85 edges
3. `cn()` - 57 edges
4. `seeded()` - 36 edges
5. `clampPercent()` - 30 edges
6. `canvasTexture()` - 22 edges
7. `Button` - 20 edges
8. `compilerOptions` - 16 edges
9. `surfaceAt()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Step 2.5 - Transcribe video / audio files (only if video files detected)` --references--> `export()`  [INFERRED]
  .codex/skills/graphify/references/transcribe.md → tools/character/build_characters.py
- `Meter()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/erp-mission.tsx → lib/utils.ts
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/mission-kit.tsx → lib/utils.ts
- `UnitNode()` --calls--> `cn()`  [EXTRACTED]
  components/game/worlds/audit/hacker-arena.tsx → lib/utils.ts
- `JobCard()` --calls--> `cn()`  [EXTRACTED]
  components/game/worlds/erp/drone-level.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (86 total, 16 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.07
Nodes (27): ARENA_R, MalwareShots(), PatchShots(), SERVER, StaffModel(), ThreatModel(), Boss, BOSS_ATTACK_GAP (+19 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.06
Nodes (64): MissionPanel(), AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS, ChartLevel() (+56 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "lib/game.ts"
Cohesion: 0.12
Nodes (17): GameEntry(), supportsWebGL(), SOUNDS, useGameAudio(), calculateTrackScores(), clampScore(), DEFAULT_AUDIO, DEFAULT_GAME_PROGRESS (+9 more)

### Community 5 - "data-lab-world.tsx"
Cohesion: 0.08
Nodes (26): FirewallLevel(), firewallPace(), InspectLevel(), shuffle(), BAR_X(), BarColumn(), Belt(), BOARD (+18 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "ref_react"
Cohesion: 0.11
Nodes (18): RevealCard(), NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), TRACK_ICONS (+10 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.07
Nodes (30): ref_three_stdlib, InfoCenter(), TrackDetails(), Avatar(), CampusZone, isBlocked(), SPAWN, ZONES (+22 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "lib/types.ts"
Cohesion: 0.07
Nodes (36): ChatbotWidget(), KATEGORI_LIST, DataCleanScenario(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchScenarioByMenuId(), TESTIMONIALS (+28 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.11
Nodes (22): createTraffic(), fleetSize(), RaceScenery(), Traffic(), TrafficContext, nearestIndex(), sampleTrack(), desired (+14 more)

### Community 15 - "cn"
Cohesion: 0.10
Nodes (30): ref_clsx, ref_radix_ui_react_dialog, ref_radix_ui_react_tabs, ref_tailwind_merge, CampusAssistant(), CATEGORIES, StaggerChildren(), StaggerChildrenProps (+22 more)

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
Cohesion: 0.06
Nodes (52): BATTERY_SPOTS, HQ_TOWER, MAX_ALTITUDE, PAD_RADIUS, ringNear(), surfaceAt(), bearing(), Bug (+44 more)

### Community 20 - "arena-models.tsx"
Cohesion: 0.06
Nodes (28): ArenaVisualState, BossModel(), BOT_TINTS, CABINETS, CABLES, GHOST_TINTS, ICO_DIRS, INNER_RACKS (+20 more)

### Community 21 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.14
Nodes (11): ref_radix_ui_react_progress, auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission() (+3 more)

### Community 22 - "race-scenery.tsx"
Cohesion: 0.08
Nodes (35): DRY, FLEET, FOREST, GRASS_A, GRASS_B, Inst, inZone(), Lake() (+27 more)

### Community 23 - "public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 24 - "site-checkout/public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 25 - "drone-scenery.tsx"
Cohesion: 0.09
Nodes (38): COAST(), deckAt(), droneTerrain(), inPaddy(), inRect(), LAND_Y, polyDistance(), railDistance() (+30 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.06
Nodes (30): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, CampusSurroundings(), Instanced() (+22 more)

### Community 27 - "ref_lucide_react"
Cohesion: 0.12
Nodes (19): TRACK_ICONS, components_ui_tabs_tabs, ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS (+11 more)

### Community 28 - "components/ui/card.tsx"
Cohesion: 0.13
Nodes (16): initials(), TestimonialCard(), QuestionCard(), Avatar(), AvatarFallback(), AvatarImage(), Badge(), BadgeProps (+8 more)

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
Cohesion: 0.07
Nodes (38): ConeModel(), Countdown(), DroneModel(), Effects(), FxApi, HintCard(), PaperPile(), Particle (+30 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "cn"
Cohesion: 0.15
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

### Community 40 - "site-checkout/lib/data/index.ts"
Cohesion: 0.09
Nodes (26): ref_supabase_supabase_js, ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions() (+18 more)

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

### Community 62 - "site-checkout/lib/types.ts"
Cohesion: 0.09
Nodes (31): ref_radix_ui_react_slot, BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button, ButtonProps, buttonVariants (+23 more)

### Community 63 - "ops-layout.ts"
Cohesion: 0.07
Nodes (30): arrivalPath(), BAY_Z, bezier(), BOUNDS, Box, COFFEE_SPOTS, CONSOLES, CONVEYOR_PATH (+22 more)

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.12
Nodes (19): RevealCard(), TRACK_ICONS, ResultCard(), TRACK_ICONS, ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS (+11 more)

### Community 65 - "ops-scenery.tsx"
Cohesion: 0.07
Nodes (38): Borders, CAR_COLORS, CONTAINER_COLORS, DashData, DIRT, DockArea, DRY, ErpOffice (+30 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.05
Nodes (44): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+36 more)

### Community 67 - "world-kit.tsx"
Cohesion: 0.21
Nodes (15): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), SoundName, WorldInput, HudChip() (+7 more)

### Community 68 - "truck-models.tsx"
Cohesion: 0.14
Nodes (12): CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, TRAFFIC_SIZE, TrafficCar() (+4 more)

### Community 69 - "worlds.ts"
Cohesion: 0.08
Nodes (23): ARENA_ENEMIES, ArenaEnemyInfo, ArenaEnemyKind, BinId, BONUS_KINDS, BONUS_SPOTS, DataCube, DRONE_JOBS (+15 more)

### Community 70 - "seeded"
Cohesion: 0.14
Nodes (26): billboardTexture(), boxBatch(), City, gableGeometry(), houses(), Housing, Village, windowTexture() (+18 more)

### Community 71 - "mission-world.tsx"
Cohesion: 0.10
Nodes (19): MissionWorld, AffinityStep(), MISSION_THEME, MissionIntro(), AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS, LEVELS (+11 more)

### Community 72 - "race-track.ts"
Cohesion: 0.13
Nodes (14): insideTrack(), LAKE, LANES, Paddy, RAIL_OFFSET, ROAD_HALF, ROAD_WIDTH, SAMPLES (+6 more)

### Community 73 - "pointAt"
Cohesion: 0.33
Nodes (12): faceRoad(), LAYOUT, openSide(), headingAt(), indexAt(), pointAt(), GateRow(), HAZARDS (+4 more)

### Community 74 - "ops-models.tsx"
Cohesion: 0.10
Nodes (25): box(), CarriedStack(), CoffeeCup(), Conveyor(), FlatbedTruck(), Forklift(), GHOST_BOX, GHOST_EDGES (+17 more)

### Community 75 - "clampDelta"
Cohesion: 0.08
Nodes (41): FirewallScene(), PacketNode(), ServerRack(), CAR_COLORS, Construction, CONTAINER_COLORS, DroneCity(), GantryCrane() (+33 more)

### Community 76 - "ops-level.tsx"
Cohesion: 0.11
Nodes (31): distanceAt(), forkliftPose(), opsBlocked(), poseOnPath(), ARRIVAL_TIME, createSim(), DEPARTURE_TIME, FloorPallet (+23 more)

### Community 77 - "drone-layout.ts"
Cohesion: 0.11
Nodes (19): BUG_PATROLS, chaikin(), CITY, Flat, FLATS, HARD_RADIUS, ISLANDS, PADDY_ZONES (+11 more)

### Community 78 - "components/quiz/quiz-flow.tsx"
Cohesion: 0.21
Nodes (12): QuizFlow(), ResultCard(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId() (+4 more)

### Community 79 - "ArenaLevel"
Cohesion: 0.22
Nodes (10): arenaBlocked(), ArenaLevel(), ArenaScene(), burst(), createSim(), emit(), hudOf(), makeShots() (+2 more)

### Community 81 - "ref_next"
Cohesion: 0.22
Nodes (3): nextConfig, ref_next, nextConfig

### Community 82 - "site-checkout/components/info/testimonial-card.tsx"
Cohesion: 0.36
Nodes (6): ref_radix_ui_react_avatar, initials(), TestimonialCard(), Avatar(), AvatarFallback(), AvatarImage()

### Community 83 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 84 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 85 - "ArenaHall"
Cohesion: 0.53
Nodes (6): ArenaHall, canvasTexture(), makeAlertScreen(), makeArenaFloor(), makeGrating(), makeWallTexture()

## Knowledge Gaps
- **580 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+575 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 717 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `route-level.tsx`, `lib/game.ts`, `data-lab-world.tsx`, `world-kit.tsx`, `truck-models.tsx`, `ref_react`, `lib/types.ts`, `ops-level.tsx`, `ArenaLevel`, `drone-level.tsx`, `ref_lucide_react`, `components/ui/card.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `ops-scenery.tsx`, `inspektur-world.tsx`, `route-level.tsx`, `truck-models.tsx`, `data-lab-world.tsx`, `seeded`, `world-kit.tsx`, `ops-models.tsx`, `data-center.tsx`, `ops-level.tsx`, `race-world.tsx`, `ArenaLevel`, `drone-level.tsx`, `arena-models.tsx`, `race-scenery.tsx`, `drone-scenery.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `clampPercent()` connect `mission-kit.tsx` to `hacker-arena.tsx`, `inspektur-world.tsx`, `route-level.tsx`, `data-lab-world.tsx`, `mission-world.tsx`, `ops-level.tsx`, `ArenaLevel`, `drone-level.tsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _580 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06298904538341157 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._