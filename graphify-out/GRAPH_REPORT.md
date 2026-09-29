# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 209 files · ~237,592 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 2172 nodes · 5041 edges · 103 communities (87 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9825db6d`
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
- river-scenery.tsx
- cn
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- route-level.tsx
- SISFOR UISI: Pilih Jalurmu
- components/workspace/workspace-shell.tsx
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
- mission-world.tsx
- truck-models.tsx
- worlds.ts
- seeded
- sea-scenery.tsx
- race-track.ts
- pointAt
- ops-models.tsx
- clampDelta
- hunt-layout.ts
- river-layout.ts
- river-level.tsx
- toWorld
- ref_next
- sea-models.tsx
- hunt-scenery.tsx
- sea-level.tsx
- site-checkout/app/layout.tsx
- sea-layout.ts
- hunt-models.tsx
- hunt-level.tsx
- river-models.tsx
- site-checkout/components/game/campus-panels.tsx
- fbm
- drone-layout.ts
- campus-building.tsx
- terrainHeight
- RiverController
- lib/utils.ts
- ops-level.tsx
- components/game/campus-panels.tsx
- site-checkout/components/game/game-canvas.tsx
- groundAt
- ref_react_three_fiber
- ref_gsap
- site-checkout/components/pwa/install-pwa-prompt.tsx

## God Nodes (most connected - your core abstractions)
1. `clampDelta()` - 140 edges
2. `cn()` - 97 edges
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
- `Stars()` --calls--> `cn()`  [EXTRACTED]
  components/game/missions/mission-kit.tsx → lib/utils.ts
- `UnitNode()` --calls--> `cn()`  [EXTRACTED]
  components/game/worlds/audit/hacker-arena.tsx → lib/utils.ts
- `DeliveryPanel()` --calls--> `cn()`  [EXTRACTED]
  components/game/worlds/data/sea-level.tsx → lib/utils.ts
- `JobCard()` --calls--> `cn()`  [EXTRACTED]
  components/game/worlds/erp/drone-level.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (103 total, 16 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.07
Nodes (34): MalwareShots(), PatchShots(), StaffModel(), arenaBlocked(), ArenaLevel(), ArenaScene(), Boss, BOSS_ATTACK_GAP (+26 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.08
Nodes (54): AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, CHART_OPTIONS, ChartLevel(), CleanLevel() (+46 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.13
Nodes (22): CHARACTERS, GameCanvas, GameEntry(), MissionWorld, supportsWebGL(), ZONE_LABELS, MissionPanel(), SOUNDS (+14 more)

### Community 5 - "world-kit.tsx"
Cohesion: 0.17
Nodes (13): SoundName, Events, Events, WorldInput, HudChip(), HudMeter(), Walker(), WorldHud() (+5 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "lib/types.ts"
Cohesion: 0.07
Nodes (36): DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), DataChartScenario(), DataCleanScenario(), DataInsightScenario() (+28 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.16
Nodes (17): GameEntry(), supportsWebGL(), ZONE_LABELS, SoundName, useGameAudio(), calculateTrackScores(), clampScore(), DEFAULT_AUDIO (+9 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.10
Nodes (24): ChatbotWidget(), KATEGORI_LIST, QuestionCard(), QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions() (+16 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.12
Nodes (20): createTraffic(), fleetSize(), RaceScenery(), Traffic(), TrafficContext, nearestIndex(), sampleTrack(), desired (+12 more)

### Community 15 - "site-checkout/components/ui/card.tsx"
Cohesion: 0.12
Nodes (17): ref_class_variance_authority, TRACK_ICONS, initials(), TestimonialCard(), QuestionCard(), Avatar(), AvatarFallback(), AvatarImage() (+9 more)

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
Nodes (51): HQ_TOWER, MAX_ALTITUDE, PAD_RADIUS, ringNear(), RINGS, surfaceAt(), bearing(), Bug (+43 more)

### Community 20 - "arena-models.tsx"
Cohesion: 0.05
Nodes (37): ARENA_R, ArenaHall, ArenaVisualState, BossModel(), BOT_TINTS, CABINETS, CABLES, canvasTexture() (+29 more)

### Community 21 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.12
Nodes (16): auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission(), META (+8 more)

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
Cohesion: 0.08
Nodes (39): COAST(), deckAt(), droneTerrain(), inPaddy(), inRect(), LAND_Y, polyDistance(), railDistance() (+31 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.09
Nodes (19): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone, FLOWER_COLORS (+11 more)

### Community 27 - "river-scenery.tsx"
Cohesion: 0.05
Nodes (43): bankPoint(), isNear(), SHOP_HOUSES, BED, Buffalo(), CANYON_WATER, DEEP, EARTH (+35 more)

### Community 28 - "cn"
Cohesion: 0.10
Nodes (25): LiteCampus(), StartScreen(), Meter(), InspectLevel(), ChartPanel(), ForkQuestion(), RevealCard(), TRACK_ICONS (+17 more)

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

### Community 36 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.15
Nodes (17): StaggerChildren(), StaggerChildrenProps, ResultCard(), ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher() (+9 more)

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
Cohesion: 0.08
Nodes (34): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions(), saveQuizResult() (+26 more)

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
Cohesion: 0.14
Nodes (26): ref_lucide_react, ref_react, CampusAssistant(), LiteCampus(), RevealCard(), NAV_LINKS, Navbar(), TRACK_ICONS (+18 more)

### Community 63 - "ops-layout.ts"
Cohesion: 0.07
Nodes (30): arrivalPath(), BAY_Z, bezier(), BOUNDS, Box, COFFEE_SPOTS, CONSOLES, CONVEYOR_PATH (+22 more)

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.15
Nodes (17): StaggerChildren(), StaggerChildrenProps, ResultCard(), ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher() (+9 more)

### Community 65 - "ops-scenery.tsx"
Cohesion: 0.07
Nodes (40): Borders, CAR_COLORS, CONTAINER_COLORS, DIRT, DockArea, DRY, ErpOffice, Flags() (+32 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.05
Nodes (51): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+43 more)

### Community 67 - "mission-world.tsx"
Cohesion: 0.10
Nodes (18): AffinityStep(), MISSION_THEME, MissionIntro(), AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS, LEVELS, MissionWorld() (+10 more)

### Community 68 - "truck-models.tsx"
Cohesion: 0.14
Nodes (12): CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, TRAFFIC_SIZE, TrafficCar() (+4 more)

### Community 69 - "worlds.ts"
Cohesion: 0.07
Nodes (28): DATA_TABLE, ERP_ORDERS, ARENA_ENEMIES, ARENA_STAFF, ArenaEnemyInfo, ArenaEnemyKind, BinId, BONUS_KINDS (+20 more)

### Community 70 - "seeded"
Cohesion: 0.14
Nodes (27): DataMotes(), Signposts(), Water(), makeFallTexture(), makeWaterTexture(), DataMotes(), IslandNames(), Ocean() (+19 more)

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
Nodes (27): box(), CarriedStack(), CoffeeCup(), Conveyor(), ErpTerminal(), FlatbedTruck(), Forklift(), GHOST_BOX (+19 more)

### Community 75 - "clampDelta"
Cohesion: 0.09
Nodes (38): CAR_COLORS, Construction, CONTAINER_COLORS, DroneCity(), GantryCrane(), HqPlaza, Inst, KINDS (+30 more)

### Community 76 - "hunt-layout.ts"
Cohesion: 0.09
Nodes (22): BiomeId, CAMP, FIXED_SOLIDS, FLOWER_COLORS, Inst, LEAF, PERSONALITIES, PIER (+14 more)

### Community 77 - "river-layout.ts"
Cohesion: 0.06
Nodes (39): ARCH_S, at(), BRIDGES, CHANNEL_LAT, CHUNKS, CLEAR, CONTROL, DIRTY (+31 more)

### Community 78 - "river-level.tsx"
Cohesion: 0.08
Nodes (29): channelLat(), CHECKPOINTS, FORK_LEN, HAZARDS, isClear(), ISLAND_LAT, ORBS, PAR_TIME (+21 more)

### Community 79 - "toWorld"
Cohesion: 0.15
Nodes (27): headingAt(), sampanAt(), toWorld(), waterY(), widthAt(), resolvePair(), chartIcon(), FINALE_CENTER (+19 more)

### Community 80 - "ref_next"
Cohesion: 0.09
Nodes (9): app_globals, metadata, viewport, ServiceWorkerRegister(), nextConfig, ref_next, VALID, LegacyRedirect() (+1 more)

### Community 81 - "sea-models.tsx"
Cohesion: 0.07
Nodes (37): StiltHouse(), Dock, DOCK_RADIUS, LIGHTHOUSE_DOCK, LIGHTHOUSE_ISLAND, SHOP_DOCKS, WHIRLPOOLS, WRECK (+29 more)

### Community 82 - "hunt-scenery.tsx"
Cohesion: 0.06
Nodes (34): at(), Butterflies(), Critter, Fish(), Flora, Focus, FOREST_FLOOR, GRASS_A (+26 more)

### Community 83 - "sea-level.tsx"
Cohesion: 0.07
Nodes (35): ANOMALY_TOTAL, HARD_RADIUS, ISLANDS, KEEL, PLAY_RADIUS, pointOfSail(), rockHit(), sailEfficiency() (+27 more)

### Community 84 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 85 - "sea-layout.ts"
Cohesion: 0.07
Nodes (33): ANOMALIES, BAROKAH, CORAL, DOCK_DIR, DOCKS, FISHING_BOATS, FLOWERS, Forecast (+25 more)

### Community 86 - "hunt-models.tsx"
Cohesion: 0.18
Nodes (12): TOWER, Sim, BeamSim, DataLakeTower(), DataSprite(), HuntSimRef, HuntWorldSim, ScannerBeam() (+4 more)

### Community 87 - "hunt-level.tsx"
Cohesion: 0.08
Nodes (30): BIOMES, buildSolidGrid(), HARD_RADIUS, LAKE, PATHS, Personality, PLAY_RADIUS, Solid (+22 more)

### Community 88 - "river-models.tsx"
Cohesion: 0.10
Nodes (22): GATE_LAT, Hazard, L, PAIR_LAT, BAD_COLOR, Buoy(), CHART_COLOR, CHART_LABEL (+14 more)

### Community 89 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.23
Nodes (10): CATEGORIES, InfoCenter(), TrackDetails(), sites_runtime_site_checkout_components_ui_tabs_tabs, TabsContent(), TabsList(), TabsTrigger(), CURRICULUM (+2 more)

### Community 90 - "fbm"
Cohesion: 0.32
Nodes (12): biomeAt(), blocked(), pathDistance(), pick(), polyDistance(), scatterVegetation(), segDistance(), streamDistance() (+4 more)

### Community 91 - "drone-layout.ts"
Cohesion: 0.10
Nodes (20): BATTERY_SPOTS, BUG_PATROLS, chaikin(), Flat, FLATS, HARD_RADIUS, ISLANDS, OFFICES (+12 more)

### Community 92 - "campus-building.tsx"
Cohesion: 0.18
Nodes (9): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec (+1 more)

### Community 93 - "terrainHeight"
Cohesion: 0.12
Nodes (18): BOTTLES, groundOf(), islandAt(), JELLIES, nearStructure(), pick(), scatterFlora(), seabed() (+10 more)

### Community 94 - "RiverController"
Cohesion: 0.17
Nodes (20): axisCoords(), currentAt(), forkAt(), frameAt(), heightFromFrame(), islandHalf(), pick(), scatterFlora() (+12 more)

### Community 95 - "lib/utils.ts"
Cohesion: 0.13
Nodes (16): NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button, ButtonProps (+8 more)

### Community 96 - "ops-level.tsx"
Cohesion: 0.10
Nodes (32): distanceAt(), forkliftPose(), opsBlocked(), poseOnPath(), ARRIVAL_TIME, createSim(), DEPARTURE_TIME, FloorPallet (+24 more)

### Community 97 - "components/game/campus-panels.tsx"
Cohesion: 0.19
Nodes (12): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), components_ui_dialog_dialog, components_ui_tabs_tabs, TabsContent(), TabsList() (+4 more)

### Community 98 - "site-checkout/components/game/game-canvas.tsx"
Cohesion: 0.15
Nodes (8): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, GameQuality

### Community 99 - "groundAt"
Cohesion: 0.22
Nodes (10): groundAt(), HuntController(), walkable(), TOWER_TOP_Y(), Campfire(), CampProps(), Critters(), ServerRuins (+2 more)

### Community 100 - "ref_react_three_fiber"
Cohesion: 0.43
Nodes (6): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), ref_react_three_fiber

### Community 102 - "site-checkout/components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

## Knowledge Gaps
- **728 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+723 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 878 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `world-kit.tsx`, `data-center.tsx`, `race-world.tsx`, `drone-level.tsx`, `arena-models.tsx`, `race-scenery.tsx`, `drone-scenery.tsx`, `river-scenery.tsx`, `route-level.tsx`, `ops-scenery.tsx`, `inspektur-world.tsx`, `truck-models.tsx`, `seeded`, `sea-scenery.tsx`, `ops-models.tsx`, `river-level.tsx`, `toWorld`, `sea-models.tsx`, `hunt-scenery.tsx`, `sea-level.tsx`, `hunt-models.tsx`, `hunt-level.tsx`, `river-models.tsx`, `terrainHeight`, `RiverController`, `ops-level.tsx`, `groundAt`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `components/game/campus-panels.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `components/game/game-entry.tsx`, `ops-level.tsx`, `route-level.tsx`, `world-kit.tsx`, `truck-models.tsx`, `components/workspace/workspace-shell.tsx`, `lib/types.ts`, `lib/data/index.ts`, `river-level.tsx`, `sea-level.tsx`, `drone-level.tsx`, `hunt-level.tsx`, `lib/utils.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `seeded()` connect `seeded` to `race-scenery.tsx`, `drone-scenery.tsx`, `river-scenery.tsx`, `route-level.tsx`, `ops-scenery.tsx`, `sea-scenery.tsx`, `race-track.ts`, `pointAt`, `clampDelta`, `hunt-layout.ts`, `river-layout.ts`, `river-level.tsx`, `toWorld`, `hunt-scenery.tsx`, `sea-layout.ts`, `hunt-level.tsx`, `fbm`, `drone-layout.ts`, `terrainHeight`, `RiverController`, `groundAt`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _728 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06906906906906907 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0750925436277102 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._