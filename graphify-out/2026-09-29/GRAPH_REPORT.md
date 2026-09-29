# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 213 files · ~241,006 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 2273 nodes · 5253 edges · 99 communities (84 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f43f1f1`
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
- components/quiz/quiz-flow.tsx
- dependencies
- race-world.tsx
- cn
- dependencies
- compilerOptions
- compilerOptions
- drone-level.tsx
- arena-models.tsx
- game-music.ts
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
- ops-layout.ts
- site-checkout/components/workspace/workspace-shell.tsx
- ops-scenery.tsx
- inspektur-world.tsx
- icons.ts
- truck-models.tsx
- worlds.ts
- clampDelta
- sea-scenery.tsx
- race-track.ts
- pointAt
- ops-models.tsx
- drone-city.tsx
- hunt-layout.ts
- river-layout.ts
- river-level.tsx
- toWorld
- ref_next
- sea-models.tsx
- hunt-scenery.tsx
- sea-level.tsx
- components/workspace/menu-grid.tsx
- sea-layout.ts
- hunt-models.tsx
- hunt-level.tsx
- river-models.tsx
- site-checkout/components/game/campus-panels.tsx
- fbm
- drone-layout.ts
- campus-building.tsx
- terrainHeight
- scatterFlora
- ops-level.tsx
- app/layout.tsx
- character-model.tsx
- groundAt

## God Nodes (most connected - your core abstractions)
1. `clampDelta()` - 140 edges
2. `cn()` - 98 edges
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
- `Meter()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/erp-mission.tsx → lib/utils.ts
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/mission-kit.tsx → lib/utils.ts
- `ChartPanel()` --calls--> `cn()`  [EXTRACTED]
  components/game/worlds/data/river-level.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (99 total, 15 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.07
Nodes (34): ARENA_R, MalwareShots(), PatchShots(), arenaBlocked(), ArenaLevel(), ArenaScene(), Boss, BOSS_ATTACK_GAP (+26 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.04
Nodes (77): MissionWorld, AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS, ChartLevel() (+69 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (28): class-variance-authority, clsx, eslint, eslint-config-next, gsap, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+20 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.07
Nodes (39): CampusAssistant, CHARACTERS, GameEntry(), InfoCenter, loadPanels(), MissionPanel, supportsWebGL(), TrackDetails (+31 more)

### Community 5 - "world-kit.tsx"
Cohesion: 0.10
Nodes (20): TouchButton, TouchControls(), KEY_MAP, PRESS_FOR_KEY, PressName, readAxis(), WorldInput, WorldInputState (+12 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "lib/types.ts"
Cohesion: 0.07
Nodes (38): ACHIEVEMENTS, insightContent, TESTIMONIALS, getScenarioByMenuId(), WORKSPACE_MENUS, WORKSPACE_SCENARIOS, isSupabaseConfigured, supabase (+30 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.07
Nodes (31): ref_three_stdlib, CampusAssistant(), InfoCenter(), TrackDetails(), Avatar(), CampusZone, isBlocked(), SPAWN (+23 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "components/quiz/quiz-flow.tsx"
Cohesion: 0.18
Nodes (13): QuizFlow(), Progress(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId() (+5 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, next, @radix-ui/react-avatar, @radix-ui/react-dialog, @radix-ui/react-progress (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.12
Nodes (20): createTraffic(), fleetSize(), RaceScenery(), Traffic(), TrafficContext, nearestIndex(), sampleTrack(), desired (+12 more)

### Community 15 - "cn"
Cohesion: 0.12
Nodes (24): ref_class_variance_authority, ref_gsap, RevealCard(), StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, initials(), TestimonialCard() (+16 more)

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
Nodes (51): BUG_PATROLS, HQ_TOWER, MAX_ALTITUDE, PAD_RADIUS, ringNear(), surfaceAt(), bearing(), Bug (+43 more)

### Community 20 - "arena-models.tsx"
Cohesion: 0.05
Nodes (36): ArenaHall, ArenaVisualState, BossModel(), BOT_TINTS, CABINETS, CABLES, canvasTexture(), GHOST_TINTS (+28 more)

### Community 21 - "game-music.ts"
Cohesion: 0.16
Nodes (15): createMusicPlayer(), degreeToMidi(), DORIAN, HARMONIC_MINOR, Layer, layerLevels(), LAYERS, MAJOR (+7 more)

### Community 22 - "race-scenery.tsx"
Cohesion: 0.07
Nodes (37): DRY, Factory(), FLEET, FOREST, GRASS_A, GRASS_B, Inst, inZone() (+29 more)

### Community 23 - "public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 24 - "site-checkout/public/manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 25 - "drone-scenery.tsx"
Cohesion: 0.09
Nodes (37): COAST(), deckAt(), droneTerrain(), inPaddy(), inRect(), polyDistance(), railDistance(), riverDistance() (+29 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.08
Nodes (25): AdaptiveResolution(), CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone (+17 more)

### Community 27 - "river-scenery.tsx"
Cohesion: 0.05
Nodes (44): bankPoint(), isNear(), SHOP_HOUSES, SIDE_FALLS, BED, Buffalo(), CANYON_WATER, DEEP (+36 more)

### Community 28 - "cn"
Cohesion: 0.09
Nodes (29): StartScreen(), UnitNode(), RevealCard(), TrackIllustration(), initials(), TestimonialCard(), QuestionCard(), ResultCard() (+21 more)

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
Nodes (41): ConeModel(), Countdown(), DroneModel(), Effects(), FxApi, HintCard(), PaperPile(), Particle (+33 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.12
Nodes (19): ChatbotWidget(), KATEGORI_LIST, CampusAssistant(), CATEGORIES, components_ui_icons_iconarrowleft, components_ui_icons_iconchat, components_ui_icons_iconsearch, components_ui_tabs_tabs (+11 more)

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
Cohesion: 0.07
Nodes (39): ref_supabase_supabase_js, ChatbotWidget(), KATEGORI_LIST, QuizFlow(), DataChartScenario(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems() (+31 more)

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

### Community 62 - "ref_react"
Cohesion: 0.07
Nodes (31): lucide-react, ref_react, auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent (+23 more)

### Community 63 - "ops-layout.ts"
Cohesion: 0.07
Nodes (30): arrivalPath(), BAY_Z, bezier(), BOUNDS, Box, COFFEE_SPOTS, CONSOLES, CONVEYOR_PATH (+22 more)

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.19
Nodes (13): ResultCard(), MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell(), fetchScenarioByMenuId() (+5 more)

### Community 65 - "ops-scenery.tsx"
Cohesion: 0.07
Nodes (42): Borders, CAR_COLORS, CONTAINER_COLORS, DashData, DIRT, DockArea, DRY, ErpOffice (+34 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.04
Nodes (55): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+47 more)

### Community 67 - "icons.ts"
Cohesion: 0.07
Nodes (39): NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button, ButtonProps (+31 more)

### Community 68 - "truck-models.tsx"
Cohesion: 0.15
Nodes (11): CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, TRAFFIC_SIZE, TrafficCar() (+3 more)

### Community 69 - "worlds.ts"
Cohesion: 0.07
Nodes (26): ARENA_ENEMIES, ARENA_STAFF, ArenaEnemyInfo, ArenaEnemyKind, BinId, BONUS_KINDS, BONUS_SPOTS, DATA_BINS (+18 more)

### Community 70 - "clampDelta"
Cohesion: 0.11
Nodes (33): Virus(), CameraShake(), SparkLayer(), DataMotes(), Signposts(), Water(), makeFallTexture(), makeWaterTexture() (+25 more)

### Community 71 - "sea-scenery.tsx"
Cohesion: 0.04
Nodes (49): Person(), boatAt(), ASH, BEACH, ChannelBuoys(), CLIFF, CLIFF_B, Crane() (+41 more)

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
Cohesion: 0.10
Nodes (36): boxBatch(), CAR_COLORS, City, Construction, CONTAINER_COLORS, DroneCity(), gableGeometry(), houses() (+28 more)

### Community 76 - "hunt-layout.ts"
Cohesion: 0.09
Nodes (22): BiomeId, CAMP, FIXED_SOLIDS, FLOWER_COLORS, Inst, LEAF, PERSONALITIES, PIER (+14 more)

### Community 77 - "river-layout.ts"
Cohesion: 0.06
Nodes (38): ARCH_S, at(), BRIDGES, CHANNEL_LAT, CHUNKS, CLEAR, CONTROL, DIRTY (+30 more)

### Community 78 - "river-level.tsx"
Cohesion: 0.07
Nodes (31): Feedback, SoundName, Events, CHECKPOINTS, FORK_LEN, ISLAND_LAT, PAR_TIME, RAFT_START (+23 more)

### Community 79 - "toWorld"
Cohesion: 0.13
Nodes (31): headingAt(), sampanAt(), toWorld(), waterY(), widthAt(), zoneAt(), nearestChannel(), resolvePair() (+23 more)

### Community 80 - "ref_next"
Cohesion: 0.09
Nodes (9): nextConfig, ref_next, sites_runtime_site_checkout_app_globals, metadata, viewport, VALID, LegacyRedirect(), ServiceWorkerRegister() (+1 more)

### Community 81 - "sea-models.tsx"
Cohesion: 0.07
Nodes (37): StiltHouse(), Dock, DOCK_RADIUS, LIGHTHOUSE_DOCK, LIGHTHOUSE_ISLAND, SHOP_DOCKS, WHIRLPOOLS, WRECK (+29 more)

### Community 82 - "hunt-scenery.tsx"
Cohesion: 0.06
Nodes (34): at(), Butterflies(), Critter, Fish(), Flora, Focus, FOREST_FLOOR, GRASS_A (+26 more)

### Community 83 - "sea-level.tsx"
Cohesion: 0.07
Nodes (36): ANOMALY_TOTAL, HARD_RADIUS, ISLANDS, KEEL, PLAY_RADIUS, pointOfSail(), rockHit(), sailEfficiency() (+28 more)

### Community 84 - "components/workspace/menu-grid.tsx"
Cohesion: 0.12
Nodes (19): StaggerChildren(), StaggerChildrenProps, components_ui_icons_iconchartbar, components_ui_icons_iconclipboard, components_ui_icons_iconfilesearch, components_ui_icons_iconidea, components_ui_icons_icontype, components_ui_icons_iconusers (+11 more)

### Community 85 - "sea-layout.ts"
Cohesion: 0.07
Nodes (32): ANOMALIES, BAROKAH, CORAL, DOCK_DIR, DOCKS, FISHING_BOATS, FLOWERS, Forecast (+24 more)

### Community 86 - "hunt-models.tsx"
Cohesion: 0.18
Nodes (12): TOWER, Sim, BeamSim, DataLakeTower(), DataSprite(), HuntSimRef, HuntWorldSim, ScannerBeam() (+4 more)

### Community 87 - "hunt-level.tsx"
Cohesion: 0.08
Nodes (30): BIOMES, buildSolidGrid(), HARD_RADIUS, LAKE, PATHS, Personality, PLAY_RADIUS, Solid (+22 more)

### Community 88 - "river-models.tsx"
Cohesion: 0.09
Nodes (26): channelLat(), GATE_LAT, Hazard, HAZARDS, isClear(), L, ORBS, PAIR_LAT (+18 more)

### Community 89 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.17
Nodes (15): ref_radix_ui_react_dialog, ref_radix_ui_react_tabs, CATEGORIES, sites_runtime_site_checkout_components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay() (+7 more)

### Community 90 - "fbm"
Cohesion: 0.32
Nodes (12): biomeAt(), blocked(), pathDistance(), pick(), polyDistance(), scatterVegetation(), segDistance(), streamDistance() (+4 more)

### Community 91 - "drone-layout.ts"
Cohesion: 0.10
Nodes (20): BATTERY_SPOTS, chaikin(), Flat, FLATS, HARD_RADIUS, ISLANDS, LAND_Y, OFFICES (+12 more)

### Community 92 - "campus-building.tsx"
Cohesion: 0.20
Nodes (8): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec

### Community 93 - "terrainHeight"
Cohesion: 0.12
Nodes (18): BOTTLES, groundOf(), islandAt(), JELLIES, nearStructure(), pick(), scatterFlora(), seabed() (+10 more)

### Community 94 - "scatterFlora"
Cohesion: 0.23
Nodes (14): axisCoords(), currentAt(), forkAt(), frameAt(), heightFromFrame(), islandHalf(), pick(), scatterFlora() (+6 more)

### Community 96 - "ops-level.tsx"
Cohesion: 0.10
Nodes (34): distanceAt(), forkliftPose(), opsBlocked(), poseOnPath(), ARRIVAL_TIME, createSim(), DEPARTURE_TIME, FloorPallet (+26 more)

### Community 99 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 100 - "character-model.tsx"
Cohesion: 0.53
Nodes (5): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials()

### Community 101 - "groundAt"
Cohesion: 0.22
Nodes (10): groundAt(), HuntController(), walkable(), TOWER_TOP_Y(), Campfire(), CampProps(), Critters(), ServerRuins (+2 more)

## Knowledge Gaps
- **734 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+729 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 935 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `ref_react` to `site-checkout/components/workspace/workspace-shell.tsx`, `site-checkout/package.json`, `site-checkout/lib/types.ts`, `site-checkout/components/game/game-entry.tsx`, `cn`, `site-checkout/components/game/campus-panels.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `world-kit.tsx`, `data-center.tsx`, `race-world.tsx`, `drone-level.tsx`, `arena-models.tsx`, `race-scenery.tsx`, `drone-scenery.tsx`, `river-scenery.tsx`, `route-level.tsx`, `ops-scenery.tsx`, `inspektur-world.tsx`, `truck-models.tsx`, `sea-scenery.tsx`, `ops-models.tsx`, `drone-city.tsx`, `river-level.tsx`, `toWorld`, `sea-models.tsx`, `hunt-scenery.tsx`, `sea-level.tsx`, `hunt-models.tsx`, `hunt-level.tsx`, `river-models.tsx`, `terrainHeight`, `scatterFlora`, `ops-level.tsx`, `groundAt`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `ops-level.tsx`, `components/game/campus-panels.tsx`, `components/game/game-entry.tsx`, `route-level.tsx`, `world-kit.tsx`, `icons.ts`, `components/quiz/quiz-flow.tsx`, `river-level.tsx`, `sea-level.tsx`, `drone-level.tsx`, `components/workspace/menu-grid.tsx`, `hunt-level.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _734 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06906906906906907 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.042296918767507005 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._