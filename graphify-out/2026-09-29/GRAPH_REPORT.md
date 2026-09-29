# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 217 files · ~242,136 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 2287 nodes · 5320 edges · 103 communities (88 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2bc848b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- hacker-arena.tsx
- mission-kit.tsx
- package.json
- site-checkout/package.json
- components/game/game-entry.tsx
- world-controls.ts
- What You Must Do When Invoked
- ref_next
- lib/types.ts
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- data-center.tsx
- inspect-extras.tsx
- dependencies
- race-world.tsx
- cn
- dependencies
- compilerOptions
- compilerOptions
- drone-level.tsx
- arena-models.tsx
- components/game/use-game-audio.ts
- race-scenery.tsx
- public/manifest.json
- site-checkout/public/manifest.json
- drone-scenery.tsx
- components/game/game-canvas.tsx
- river-scenery.tsx
- cn
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- route-level.tsx
- SISFOR UISI: Pilih Jalurmu
- lib/data/index.ts
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
- site-checkout/components/game/mission-panel.tsx
- ops-level.tsx
- lucide-react
- ops-scenery.tsx
- inspektur-world.tsx
- components/game/campus-panels.tsx
- truck-models.tsx
- worlds.ts
- seeded
- sea-scenery.tsx
- race-track.ts
- pointAt
- ops-models.tsx
- drone-city.tsx
- hunt-layout.ts
- river-layout.ts
- river-level.tsx
- site-checkout/components/game/campus-panels.tsx
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- sea-models.tsx
- hunt-scenery.tsx
- sea-level.tsx
- components/workspace/menu-grid.tsx
- sea-layout.ts
- site-checkout/components/quiz/quiz-flow.tsx
- hunt-level.tsx
- river-models.tsx
- site-checkout/components/ui/button.tsx
- fbm
- drone-layout.ts
- ArenaLevel
- clampDelta
- widthAt
- site-checkout/app/layout.tsx
- useThrottled
- ArenaHall
- groundAt
- app/layout.tsx
- world-kit.tsx
- canvasTexture
- campus-building.tsx

## God Nodes (most connected - your core abstractions)
1. `clampDelta()` - 140 edges
2. `cn()` - 102 edges
3. `seeded()` - 76 edges
4. `cn()` - 57 edges
5. `canvasTexture()` - 45 edges
6. `clampPercent()` - 32 edges
7. `fbm()` - 32 edges
8. `waterY()` - 29 edges
9. `toWorld()` - 29 edges
10. `terrainHeight()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Step 2.5 - Transcribe video / audio files (only if video files detected)` --references--> `export()`  [INFERRED]
  .codex/skills/graphify/references/transcribe.md → tools/character/build_characters.py
- `CampusAssistant()` --calls--> `cn()`  [EXTRACTED]
  components/game/campus-panels.tsx → lib/utils.ts
- `StartScreen()` --calls--> `cn()`  [EXTRACTED]
  components/game/game-entry.tsx → lib/utils.ts
- `Meter()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/erp-mission.tsx → lib/utils.ts
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/mission-kit.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (103 total, 15 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.06
Nodes (32): ARENA_R, MalwareShots(), StaffModel(), ThreatModel(), Boss, BOSS_ATTACK_GAP, BOSS_FINDINGS, BOSS_PATTERNS (+24 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.04
Nodes (82): MissionPanel, MissionWorld, AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS (+74 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (28): class-variance-authority, clsx, eslint, eslint-config-next, gsap, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+20 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.08
Nodes (32): CampusAssistant, CHARACTERS, GameEntry(), InfoCenter, loadPanels(), StartScreen(), supportsWebGL(), TrackDetails (+24 more)

### Community 5 - "world-controls.ts"
Cohesion: 0.20
Nodes (8): TouchButton, TouchControls(), KEY_MAP, PRESS_FOR_KEY, PressName, WorldInput, WorldInputState, components_ui_icons_iconchevronleft

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 7 - "ref_next"
Cohesion: 0.12
Nodes (5): VALID, LegacyRedirect(), nextConfig, ref_next, nextConfig

### Community 8 - "lib/types.ts"
Cohesion: 0.09
Nodes (28): DataChartScenario(), ERP_BOARD_SCORES, insightContent, WORKSPACE_MENUS, WORKSPACE_SCENARIOS, AccessPolicy, AccessRequest, AuditFinding (+20 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.07
Nodes (32): ref_three_stdlib, CampusAssistant(), InfoCenter(), TrackDetails(), Avatar(), CampusZone, isBlocked(), SPAWN (+24 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "inspect-extras.tsx"
Cohesion: 0.09
Nodes (22): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+14 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, next, @radix-ui/react-avatar, @radix-ui/react-dialog, @radix-ui/react-progress (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.12
Nodes (20): createTraffic(), fleetSize(), RaceScenery(), Traffic(), TrafficContext, nearestIndex(), sampleTrack(), desired (+12 more)

### Community 15 - "cn"
Cohesion: 0.14
Nodes (21): ref_clsx, ref_tailwind_merge, RevealCard(), StaggerChildren(), StaggerChildrenProps, initials(), TestimonialCard(), QuestionCard() (+13 more)

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
Cohesion: 0.05
Nodes (53): HQ_TOWER, MAX_ALTITUDE, PAD_RADIUS, ringNear(), RINGS, surfaceAt(), bearing(), Bug (+45 more)

### Community 20 - "arena-models.tsx"
Cohesion: 0.05
Nodes (31): ArenaVisualState, BossModel(), BOT_TINTS, CABINETS, CABLES, GHOST_TINTS, ICO_DIRS, INNER_RACKS (+23 more)

### Community 21 - "components/game/use-game-audio.ts"
Cohesion: 0.12
Nodes (21): createMusicPlayer(), degreeToMidi(), DORIAN, HARMONIC_MINOR, Layer, layerLevels(), LAYERS, MAJOR (+13 more)

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
Nodes (28): deckAt(), PYLON_LINE, VILLAGE, bridgeSpots(), DRY, FLOWER_COLORS, FOREST, GRASS_A (+20 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.09
Nodes (22): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone, FLOWER_COLORS (+14 more)

### Community 27 - "river-scenery.tsx"
Cohesion: 0.06
Nodes (37): isNear(), BED, CANYON_WATER, DEEP, EARTH, Fish(), FloraChunk, FOAM (+29 more)

### Community 28 - "cn"
Cohesion: 0.07
Nodes (34): GameLoader(), TIPS, SceneLoader(), RevealCard(), StaggerChildren(), StaggerChildrenProps, TrackIllustration(), initials() (+26 more)

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
Nodes (40): ConeModel(), Countdown(), DroneModel(), Effects(), FxApi, HintCard(), PaperPile(), Particle (+32 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "lib/data/index.ts"
Cohesion: 0.08
Nodes (30): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), components_ui_icons_iconarrowleft, components_ui_icons_iconchat, components_ui_icons_iconchevronright, components_ui_icons_iconsearch, ACHIEVEMENTS (+22 more)

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
Nodes (28): ChatbotWidget(), KATEGORI_LIST, DataCleanScenario(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchScenarioByMenuId(), TESTIMONIALS (+20 more)

### Community 41 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 42 - "Cara Menyambungkan Supabase (khusus project ini)"
Cohesion: 0.40
Nodes (4): Cara Menyambungkan Supabase (khusus project ini), Langkah 1: Buat tabel & isi datanya (sekali saja), Langkah 2: Ambil kunci API dan buat file `.env.local`, Penting soal keamanan

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

### Community 62 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.12
Nodes (14): ref_radix_ui_react_progress, auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission() (+6 more)

### Community 63 - "ops-level.tsx"
Cohesion: 0.06
Nodes (50): arrivalPath(), BAY_Z, bezier(), BOUNDS, Box, COFFEE_SPOTS, CONSOLES, CONVEYOR_PATH (+42 more)

### Community 64 - "lucide-react"
Cohesion: 0.19
Nodes (13): lucide-react, TRACK_ICONS, ResultCard(), TRACK_ICONS, ICONS, MenuGrid(), TRACK_ICONS, TrackSwitcher() (+5 more)

### Community 65 - "ops-scenery.tsx"
Cohesion: 0.07
Nodes (41): Borders, CAR_COLORS, CONTAINER_COLORS, DashData, DIRT, DockArea, DRY, ErpOffice (+33 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.06
Nodes (33): BOARD_LINES, Body, CARPET_TILES, Collider, COLLIDERS, DRONE_PATH, FirewallLevel(), firewallPace() (+25 more)

### Community 67 - "components/game/campus-panels.tsx"
Cohesion: 0.07
Nodes (36): CampusAssistant(), CATEGORIES, NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone() (+28 more)

### Community 68 - "truck-models.tsx"
Cohesion: 0.14
Nodes (12): CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, TRAFFIC_SIZE, TrafficCar() (+4 more)

### Community 69 - "worlds.ts"
Cohesion: 0.07
Nodes (25): ARENA_ENEMIES, ARENA_STAFF, ArenaEnemyInfo, BinId, BONUS_KINDS, BONUS_SPOTS, DATA_BINS, DATA_CUBES (+17 more)

### Community 70 - "seeded"
Cohesion: 0.13
Nodes (20): Fish(), at(), bankPoint(), HOUSES, MONTH_GATES, SHOP_HOUSES, SHOPS, SLICES (+12 more)

### Community 71 - "sea-scenery.tsx"
Cohesion: 0.05
Nodes (40): boatAt(), ASH, BEACH, CLIFF, CLIFF_B, CRATER, DEEP, FAR (+32 more)

### Community 72 - "race-track.ts"
Cohesion: 0.13
Nodes (14): insideTrack(), LAKE, LANES, Paddy, RAIL_OFFSET, ROAD_HALF, ROAD_WIDTH, SAMPLES (+6 more)

### Community 73 - "pointAt"
Cohesion: 0.33
Nodes (12): faceRoad(), LAYOUT, openSide(), headingAt(), indexAt(), pointAt(), GateRow(), HAZARDS (+4 more)

### Community 74 - "ops-models.tsx"
Cohesion: 0.09
Nodes (26): box(), CarriedStack(), CoffeeCup(), Conveyor(), ErpTerminal(), FlatbedTruck(), Forklift(), GHOST_BOX (+18 more)

### Community 75 - "drone-city.tsx"
Cohesion: 0.08
Nodes (39): boxBatch(), CAR_COLORS, City, Construction, CONTAINER_COLORS, DroneCity(), gableGeometry(), GantryCrane() (+31 more)

### Community 76 - "hunt-layout.ts"
Cohesion: 0.07
Nodes (36): biomeAt(), BiomeId, BIOMES, blocked(), CAMP, FIXED_SOLIDS, FLOWER_COLORS, HARD_RADIUS (+28 more)

### Community 77 - "river-layout.ts"
Cohesion: 0.06
Nodes (34): ARCH_S, BRIDGES, CHANNEL_LAT, CHUNKS, CLEAR, CONTROL, DIRTY, DOCK_START (+26 more)

### Community 78 - "river-level.tsx"
Cohesion: 0.07
Nodes (40): channelLat(), CHECKPOINTS, currentAt(), FORK_LEN, HAZARDS, isClear(), ISLAND_LAT, ORBS (+32 more)

### Community 79 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.15
Nodes (18): ref_radix_ui_react_dialog, CATEGORIES, sites_runtime_site_checkout_components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle() (+10 more)

### Community 81 - "sea-models.tsx"
Cohesion: 0.07
Nodes (35): Dock, DOCK_RADIUS, LIGHTHOUSE_DOCK, LIGHTHOUSE_ISLAND, SHOP_DOCKS, WHIRLPOOLS, WRECK, BAD_COLOR (+27 more)

### Community 82 - "hunt-scenery.tsx"
Cohesion: 0.06
Nodes (34): at(), Butterflies(), Critter, Flora, Focus, FOREST_FLOOR, GRASS_A, GRASS_B (+26 more)

### Community 83 - "sea-level.tsx"
Cohesion: 0.07
Nodes (35): ANOMALY_TOTAL, HARD_RADIUS, ISLANDS, KEEL, PLAY_RADIUS, pointOfSail(), rockHit(), sailEfficiency() (+27 more)

### Community 84 - "components/workspace/menu-grid.tsx"
Cohesion: 0.08
Nodes (29): ResultCard(), components_ui_icons_iconchartbar, components_ui_icons_iconclipboard, components_ui_icons_iconfilesearch, components_ui_icons_iconidea, components_ui_icons_icontype, components_ui_icons_iconusers, components_ui_icons_iconwallet (+21 more)

### Community 85 - "sea-layout.ts"
Cohesion: 0.07
Nodes (37): ANOMALIES, BAROKAH, CORAL, DOCK_DIR, DOCKS, FISHING_BOATS, FLOWERS, Forecast (+29 more)

### Community 86 - "site-checkout/components/quiz/quiz-flow.tsx"
Cohesion: 0.23
Nodes (11): QuizFlow(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId(), randomId() (+3 more)

### Community 87 - "hunt-level.tsx"
Cohesion: 0.07
Nodes (38): buildSolidGrid(), PATHS, Personality, Solid, TOWER, bearing(), BIN_HINT, ClassifyPanel() (+30 more)

### Community 88 - "river-models.tsx"
Cohesion: 0.08
Nodes (44): GATE_LAT, Hazard, headingAt(), L, PAIR_LAT, toWorld(), waterY(), resolvePair() (+36 more)

### Community 89 - "site-checkout/components/ui/button.tsx"
Cohesion: 0.14
Nodes (15): ref_radix_ui_react_slot, NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button (+7 more)

### Community 90 - "fbm"
Cohesion: 0.30
Nodes (14): seabed(), COAST(), droneTerrain(), inPaddy(), polyDistance(), railDistance(), riverDistance(), riverWidth() (+6 more)

### Community 91 - "drone-layout.ts"
Cohesion: 0.10
Nodes (21): BATTERY_SPOTS, BUG_PATROLS, chaikin(), CITY, Flat, FLATS, HARD_RADIUS, inRect() (+13 more)

### Community 92 - "ArenaLevel"
Cohesion: 0.22
Nodes (10): arenaBlocked(), ArenaLevel(), ArenaScene(), burst(), createSim(), emit(), hudOf(), makeShots() (+2 more)

### Community 93 - "clampDelta"
Cohesion: 0.09
Nodes (30): Buffalo(), Smoke(), StartDock(), WindClock(), BOTTLES, groundOf(), JELLIES, terrainHeight() (+22 more)

### Community 94 - "widthAt"
Cohesion: 0.32
Nodes (13): axisCoords(), forkAt(), frameAt(), heightFromFrame(), islandHalf(), pick(), scatterFlora(), terrainHeight() (+5 more)

### Community 95 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 96 - "useThrottled"
Cohesion: 0.24
Nodes (14): opsBlocked(), createSim(), guideTarget(), interact(), nearestStation(), needed(), openDemand(), OpsLevel() (+6 more)

### Community 97 - "ArenaHall"
Cohesion: 0.53
Nodes (6): ArenaHall, canvasTexture(), makeAlertScreen(), makeArenaFloor(), makeGrating(), makeWallTexture()

### Community 98 - "groundAt"
Cohesion: 0.23
Nodes (12): groundAt(), terrainHeight(), HuntController(), walkable(), TOWER_TOP_Y(), Campfire(), CampProps(), Critters() (+4 more)

### Community 99 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 100 - "world-kit.tsx"
Cohesion: 0.12
Nodes (23): AdaptiveResolution(), buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), ResponsiveCamera(), SoundName (+15 more)

### Community 101 - "canvasTexture"
Cohesion: 0.33
Nodes (11): Signposts(), IslandNames(), signTexture(), billboardTexture(), OpsTower(), siteSignTexture(), BILLBOARDS, canvasTexture() (+3 more)

### Community 102 - "campus-building.tsx"
Cohesion: 0.20
Nodes (8): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec

## Knowledge Gaps
- **736 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+731 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 938 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `data-center.tsx`, `race-world.tsx`, `drone-level.tsx`, `arena-models.tsx`, `race-scenery.tsx`, `drone-scenery.tsx`, `river-scenery.tsx`, `route-level.tsx`, `ops-level.tsx`, `ops-scenery.tsx`, `inspektur-world.tsx`, `truck-models.tsx`, `seeded`, `sea-scenery.tsx`, `ops-models.tsx`, `drone-city.tsx`, `river-level.tsx`, `sea-models.tsx`, `hunt-scenery.tsx`, `sea-level.tsx`, `hunt-level.tsx`, `river-models.tsx`, `ArenaLevel`, `widthAt`, `useThrottled`, `groundAt`, `world-kit.tsx`, `canvasTexture`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `site-checkout/package.json`, `site-checkout/lib/types.ts`, `site-checkout/components/game/game-entry.tsx`, `cn`, `site-checkout/components/game/campus-panels.tsx`, `site-checkout/components/quiz/quiz-flow.tsx`, `site-checkout/components/ui/button.tsx`, `site-checkout/components/game/mission-panel.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `components/game/campus-panels.tsx`, `lib/data/index.ts`, `components/game/game-entry.tsx`, `useThrottled`, `route-level.tsx`, `world-kit.tsx`, `truck-models.tsx`, `inspect-extras.tsx`, `river-level.tsx`, `sea-level.tsx`, `drone-level.tsx`, `components/workspace/menu-grid.tsx`, `hunt-level.tsx`, `ArenaLevel`, `ops-level.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _736 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.040611562350692784 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._