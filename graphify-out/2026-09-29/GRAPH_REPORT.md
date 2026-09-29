# Graph Report - sisfor-pilih-jalurmu  (2026-09-29)

## Corpus Check
- 205 files · ~218,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1995 nodes · 4632 edges · 100 communities (82 shown, 18 thin omitted)
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
- ops-level.tsx
- site-checkout/components/workspace/workspace-shell.tsx
- ops-scenery.tsx
- inspektur-world.tsx
- mission-world.tsx
- ref_three
- worlds.ts
- seeded
- world-controls.ts
- race-track.ts
- pointAt
- clampDelta
- drone-city.tsx
- hunt-layout.ts
- river-layout.ts
- river-level.tsx
- toWorld
- site-checkout/app/ruang-kerja/[jalur]/page.tsx
- ref_next
- hunt-scenery.tsx
- app/layout.tsx
- site-checkout/app/layout.tsx
- ArenaHall
- hunt-models.tsx
- hunt-level.tsx
- river-models.tsx
- site-checkout/components/game/campus-panels.tsx
- fbm
- inspect-extras.tsx
- campus-building.tsx
- CitySkyline
- RiverController
- ref_gsap
- OpsScene
- arrivalPath
- BossModel
- ServerCluster

## God Nodes (most connected - your core abstractions)
1. `clampDelta()` - 120 edges
2. `cn()` - 96 edges
3. `seeded()` - 66 edges
4. `cn()` - 57 edges
5. `canvasTexture()` - 34 edges
6. `clampPercent()` - 32 edges
7. `waterY()` - 29 edges
8. `toWorld()` - 29 edges
9. `fbm()` - 26 edges
10. `widthAt()` - 23 edges

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

## Communities (100 total, 18 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.08
Nodes (31): arenaBlocked(), ArenaLevel(), ArenaScene(), Boss, BOSS_ATTACK_GAP, BOSS_FINDINGS, BOSS_PATTERNS, BOSS_PHASE_HP (+23 more)

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
Nodes (24): CampusAssistant(), InfoCenter(), CHARACTERS, GameEntry(), LiteCampus(), StartScreen(), supportsWebGL(), ZONE_LABELS (+16 more)

### Community 5 - "world-kit.tsx"
Cohesion: 0.12
Nodes (24): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), SoundName, BOARD, CITY (+16 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "lib/types.ts"
Cohesion: 0.06
Nodes (46): components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), AuditScenario(), DataChartScenario() (+38 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (19): BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, DASH_MATERIAL, FOREST_ACCENTS, FOREST_BALL, FOREST_CONE (+11 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.07
Nodes (31): ref_three_stdlib, CampusAssistant(), InfoCenter(), TrackDetails(), Avatar(), CampusZone, isBlocked(), SPAWN (+23 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.10
Nodes (25): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions(), fetchScenarioByMenuId() (+17 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.12
Nodes (20): createTraffic(), fleetSize(), RaceScenery(), Traffic(), TrafficContext, nearestIndex(), sampleTrack(), desired (+12 more)

### Community 15 - "cn"
Cohesion: 0.15
Nodes (18): ref_class_variance_authority, TRACK_ICONS, initials(), TestimonialCard(), QuestionCard(), Avatar(), AvatarFallback(), AvatarImage() (+10 more)

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
Nodes (54): BUG_PATROLS, HARD_RADIUS, HQ_TOWER, PAD_RADIUS, ringNear(), SOLIDS, surfaceAt(), bearing() (+46 more)

### Community 20 - "arena-models.tsx"
Cohesion: 0.05
Nodes (31): ARENA_R, ArenaVisualState, BOT_TINTS, CABINETS, CABLES, GHOST_TINTS, ICO_DIRS, INNER_RACKS (+23 more)

### Community 21 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.12
Nodes (13): auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission(), META (+5 more)

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
Cohesion: 0.06
Nodes (60): BATTERY_SPOTS, chaikin(), COAST(), deckAt(), droneTerrain(), Flat, FLATS, inPaddy() (+52 more)

### Community 26 - "components/game/game-canvas.tsx"
Cohesion: 0.09
Nodes (20): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), CampusZone, FLOWER_COLORS (+12 more)

### Community 27 - "river-scenery.tsx"
Cohesion: 0.05
Nodes (43): bankPoint(), isNear(), SHOP_HOUSES, BED, Buffalo(), CANYON_WATER, DEEP, EARTH (+35 more)

### Community 28 - "cn"
Cohesion: 0.09
Nodes (30): RevealCard(), StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, initials(), TestimonialCard(), NAV_LINKS, Navbar() (+22 more)

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
Nodes (37): ConeModel(), Countdown(), DroneModel(), Effects(), FxApi, HintCard(), PaperPile(), Particle (+29 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.13
Nodes (22): CATEGORIES, TrackDetails(), ResultCard(), components_ui_tabs_tabs, TabsContent(), TabsList(), TabsTrigger(), ICONS (+14 more)

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
Nodes (31): ref_supabase_supabase_js, ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions() (+23 more)

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
Cohesion: 0.12
Nodes (23): ref_lucide_react, ref_react, RevealCard(), NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos() (+15 more)

### Community 63 - "ops-level.tsx"
Cohesion: 0.06
Nodes (43): BAY_Z, BOUNDS, Box, COFFEE_SPOTS, CONSOLES, CONVEYOR_PATH, CROSS_ROAD_Z, distanceAt() (+35 more)

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.13
Nodes (18): StaggerChildren(), StaggerChildrenProps, ResultCard(), ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher() (+10 more)

### Community 65 - "ops-scenery.tsx"
Cohesion: 0.07
Nodes (41): Borders, CAR_COLORS, CONTAINER_COLORS, DIRT, DockArea, DRY, ErpOffice, Flags() (+33 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.06
Nodes (34): BOARD_LINES, Body, CARPET_TILES, Collider, COLLIDERS, DRONE_PATH, FirewallLevel(), firewallPace() (+26 more)

### Community 67 - "mission-world.tsx"
Cohesion: 0.15
Nodes (13): MissionWorld, AffinityStep(), MISSION_THEME, MissionIntro(), AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS, LEVELS (+5 more)

### Community 68 - "ref_three"
Cohesion: 0.13
Nodes (13): CementTruck(), DRUM_PROFILE, DrumHelix, drumRadius(), MotionRef, PLAYER_LIVERY, TRAFFIC_SIZE, TrafficCar() (+5 more)

### Community 69 - "worlds.ts"
Cohesion: 0.07
Nodes (26): DATA_TABLE, ERP_ORDERS, ARENA_ENEMIES, ARENA_STAFF, ArenaEnemyInfo, BinId, BONUS_KINDS, BONUS_SPOTS (+18 more)

### Community 70 - "seeded"
Cohesion: 0.19
Nodes (19): RUINS, DataMotes(), Signposts(), Water(), makeFallTexture(), makeWaterTexture(), billboardTexture(), City (+11 more)

### Community 71 - "world-controls.ts"
Cohesion: 0.18
Nodes (9): CityScene(), TouchButton, TouchControls(), KEY_MAP, PRESS_FOR_KEY, PressName, usePressReader(), WorldInput (+1 more)

### Community 72 - "race-track.ts"
Cohesion: 0.13
Nodes (14): insideTrack(), LAKE, LANES, Paddy, RAIL_OFFSET, ROAD_HALF, ROAD_WIDTH, SAMPLES (+6 more)

### Community 73 - "pointAt"
Cohesion: 0.33
Nodes (12): faceRoad(), LAYOUT, openSide(), headingAt(), indexAt(), pointAt(), GateRow(), HAZARDS (+4 more)

### Community 74 - "clampDelta"
Cohesion: 0.08
Nodes (34): CityClock(), GantryCrane(), Sailboat(), TowerCrane(), GuideArrow(), PlayerExtras(), box(), CarriedStack() (+26 more)

### Community 75 - "drone-city.tsx"
Cohesion: 0.10
Nodes (32): boxBatch(), CAR_COLORS, Construction, CONTAINER_COLORS, DroneCity(), gableGeometry(), houses(), Housing (+24 more)

### Community 76 - "hunt-layout.ts"
Cohesion: 0.09
Nodes (22): BiomeId, BIOMES, CAMP, FIXED_SOLIDS, FLOWER_COLORS, Inst, LEAF, PERSONALITIES (+14 more)

### Community 77 - "river-layout.ts"
Cohesion: 0.06
Nodes (39): ARCH_S, at(), BRIDGES, CHANNEL_LAT, CHUNKS, CLEAR, CONTROL, DIRTY (+31 more)

### Community 78 - "river-level.tsx"
Cohesion: 0.07
Nodes (31): channelLat(), CHECKPOINTS, FORK_LEN, HAZARDS, isClear(), ISLAND_LAT, ORBS, PAR_TIME (+23 more)

### Community 79 - "toWorld"
Cohesion: 0.13
Nodes (30): headingAt(), sampanAt(), toWorld(), waterY(), widthAt(), resolvePair(), Buoy(), chartIcon() (+22 more)

### Community 81 - "ref_next"
Cohesion: 0.22
Nodes (3): nextConfig, ref_next, nextConfig

### Community 82 - "hunt-scenery.tsx"
Cohesion: 0.06
Nodes (41): groundAt(), at(), Butterflies(), Campfire(), CampProps(), Critter, Critters(), Fish() (+33 more)

### Community 83 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 84 - "site-checkout/app/layout.tsx"
Cohesion: 0.33
Nodes (4): sites_runtime_site_checkout_app_globals, metadata, viewport, ServiceWorkerRegister()

### Community 85 - "ArenaHall"
Cohesion: 0.53
Nodes (6): ArenaHall, canvasTexture(), makeAlertScreen(), makeArenaFloor(), makeGrating(), makeWallTexture()

### Community 86 - "hunt-models.tsx"
Cohesion: 0.18
Nodes (12): TOWER, Sim, BeamSim, DataLakeTower(), DataSprite(), HuntSimRef, HuntWorldSim, ScannerBeam() (+4 more)

### Community 87 - "hunt-level.tsx"
Cohesion: 0.09
Nodes (29): buildSolidGrid(), HARD_RADIUS, LAKE, PATHS, Personality, Solid, START, WATER_Y (+21 more)

### Community 88 - "river-models.tsx"
Cohesion: 0.10
Nodes (20): GATE_LAT, Hazard, L, PAIR_LAT, BAD_COLOR, CHART_COLOR, CHART_LABEL, DashboardFinale (+12 more)

### Community 89 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.17
Nodes (16): CATEGORIES, sites_runtime_site_checkout_components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), sites_runtime_site_checkout_components_ui_tabs_tabs (+8 more)

### Community 90 - "fbm"
Cohesion: 0.25
Nodes (15): biomeAt(), blocked(), pathDistance(), pick(), polyDistance(), scatterVegetation(), segDistance(), streamDistance() (+7 more)

### Community 91 - "inspect-extras.tsx"
Cohesion: 0.11
Nodes (19): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+11 more)

### Community 92 - "campus-building.tsx"
Cohesion: 0.20
Nodes (8): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec

### Community 93 - "CitySkyline"
Cohesion: 0.24
Nodes (10): BoundaryHedge(), CitySkyline(), DistantForest(), GrassPatches(), Hills(), insideRect(), makeFacadeTexture(), rectRing() (+2 more)

### Community 94 - "RiverController"
Cohesion: 0.21
Nodes (17): axisCoords(), currentAt(), forkAt(), frameAt(), heightFromFrame(), islandHalf(), pick(), scatterFlora() (+9 more)

### Community 95 - "ref_gsap"
Cohesion: 0.22
Nodes (5): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), ref_gsap

### Community 96 - "OpsScene"
Cohesion: 0.27
Nodes (13): opsBlocked(), createSim(), guideTarget(), interact(), nearestStation(), needed(), openDemand(), OpsLevel() (+5 more)

### Community 97 - "arrivalPath"
Cohesion: 0.40
Nodes (6): arrivalPath(), bezier(), departurePath(), seg(), ARRIVALS, DEPARTURES

## Knowledge Gaps
- **673 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+668 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 819 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `OpsScene`, `components/game/game-entry.tsx`, `components/game/campus-panels.tsx`, `world-kit.tsx`, `route-level.tsx`, `lib/types.ts`, `lib/data/index.ts`, `river-level.tsx`, `drone-level.tsx`, `hunt-level.tsx`, `inspect-extras.tsx`, `ops-level.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `world-kit.tsx`, `data-center.tsx`, `race-world.tsx`, `drone-level.tsx`, `arena-models.tsx`, `race-scenery.tsx`, `drone-scenery.tsx`, `river-scenery.tsx`, `route-level.tsx`, `ops-level.tsx`, `ops-scenery.tsx`, `inspektur-world.tsx`, `ref_three`, `seeded`, `drone-city.tsx`, `river-level.tsx`, `toWorld`, `hunt-scenery.tsx`, `hunt-models.tsx`, `hunt-level.tsx`, `river-models.tsx`, `fbm`, `RiverController`, `OpsScene`, `BossModel`, `ServerCluster`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `seeded()` connect `seeded` to `ops-scenery.tsx`, `route-level.tsx`, `race-track.ts`, `pointAt`, `clampDelta`, `drone-city.tsx`, `hunt-layout.ts`, `river-layout.ts`, `river-level.tsx`, `toWorld`, `hunt-scenery.tsx`, `race-scenery.tsx`, `hunt-level.tsx`, `drone-scenery.tsx`, `fbm`, `river-scenery.tsx`, `RiverController`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _673 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0766488413547237 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07644110275689223 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._