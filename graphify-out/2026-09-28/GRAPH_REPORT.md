# Graph Report - sisfor-pilih-jalurmu  (2026-09-28)

## Corpus Check
- 182 files · ~138,614 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 1254 nodes · 2636 edges · 76 communities (62 shown, 14 thin omitted)
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
- clampDelta
- What You Must Do When Invoked
- ref_next
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
- ref_lucide_react
- components/workspace/scenario-dialog.tsx
- public/manifest.json
- site-checkout/public/manifest.json
- CitySkyline
- components/game/game-canvas.tsx
- components/workspace/workspace-shell.tsx
- cn
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- mission-world.tsx
- SISFOR UISI: Pilih Jalurmu
- components/game/campus-panels.tsx
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
- lib/utils.ts
- site-checkout/components/workspace/workspace-shell.tsx
- site-checkout/lib/data/index.ts
- inspektur-world.tsx
- data-lab-world.tsx
- data-mission.tsx
- worlds.ts
- ref_react
- world-controls.ts
- site-checkout/components/game/game-canvas.tsx
- ArenaLevel
- components/info/testimonial-card.tsx
- ArenaHall

## God Nodes (most connected - your core abstractions)
1. `cn()` - 84 edges
2. `cn()` - 57 edges
3. `clampPercent()` - 28 edges
4. `clampDelta()` - 28 edges
5. `Button` - 19 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `JalurId` - 14 edges
9. `JalurId` - 14 edges
10. `useThrottled()` - 13 edges

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

## Communities (76 total, 14 thin omitted)

### Community 0 - "hacker-arena.tsx"
Cohesion: 0.07
Nodes (24): ARENA_R, MalwareShots(), PatchShots(), SERVER, StaffModel(), ThreatModel(), Boss, BOSS_ATTACK_GAP (+16 more)

### Community 1 - "mission-kit.tsx"
Cohesion: 0.12
Nodes (24): AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, Affinity, FeedbackToast(), LearningCard() (+16 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.14
Nodes (20): CHARACTERS, GameEntry(), LiteCampus(), StartScreen(), supportsWebGL(), ZONE_LABELS, SOUNDS, useGameAudio() (+12 more)

### Community 5 - "clampDelta"
Cohesion: 0.14
Nodes (15): Virus(), CameraShake(), SparkLayer(), FirewallScene(), PacketNode(), ServerRack(), Belt(), ChartScene() (+7 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 7 - "ref_next"
Cohesion: 0.06
Nodes (15): app_globals, metadata, viewport, VALID, LegacyRedirect(), ServiceWorkerRegister(), nextConfig, ref_next (+7 more)

### Community 8 - "lib/types.ts"
Cohesion: 0.08
Nodes (32): DataChartScenario(), insightContent, WORKSPACE_MENUS, WORKSPACE_SCENARIOS, AccessPolicy, AccessRequest, AuditFinding, AuditItem (+24 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (19): BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, DASH_MATERIAL, FOREST_ACCENTS, FOREST_BALL, FOREST_CONE (+11 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.15
Nodes (18): GameEntry(), LiteCampus(), supportsWebGL(), ZONE_LABELS, SoundName, useGameAudio(), calculateTrackScores(), clampScore() (+10 more)

### Community 11 - "data-center.tsx"
Cohesion: 0.15
Nodes (20): canvasTexture(), DataCenterHall, DataCenterLights(), DataStream(), HALL, LED_COLORS, LED_ROWS, makeFloorTexture() (+12 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.09
Nodes (26): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions(), saveQuizResult() (+18 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "race-world.tsx"
Cohesion: 0.11
Nodes (33): clampPercent(), FirewallLevel(), firewallPace(), InspectLevel(), shuffle(), ChartLevel(), CityLevel(), ConveyorLevel() (+25 more)

### Community 15 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.18
Nodes (13): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), sites_runtime_site_checkout_components_ui_dialog_dialog, sites_runtime_site_checkout_components_ui_tabs_tabs, TabsContent(), TabsList() (+5 more)

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

### Community 21 - "ref_lucide_react"
Cohesion: 0.10
Nodes (22): ref_lucide_react, auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission() (+14 more)

### Community 22 - "components/workspace/scenario-dialog.tsx"
Cohesion: 0.27
Nodes (8): components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), DampakBadge(), ErpScenario()

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

### Community 27 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.14
Nodes (16): StaggerChildren(), StaggerChildrenProps, ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS (+8 more)

### Community 28 - "cn"
Cohesion: 0.17
Nodes (15): RevealCard(), TRACK_ICONS, QuestionCard(), ResultCard(), TRACK_ICONS, Badge(), BadgeProps, badgeVariants (+7 more)

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
Cohesion: 0.15
Nodes (15): MissionWorld, AffinityStep(), MISSION_THEME, MissionIntro(), SoundName, AUDIT_LEVELS, DATA_LEVELS, ERP_LEVELS (+7 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.18
Nodes (13): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), components_ui_tabs_tabs, TabsContent(), TabsList(), TabsTrigger() (+5 more)

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
Cohesion: 0.14
Nodes (16): MissionPanel(), BoardLevel(), ErpMission(), FlowLevel(), IMPACTS, Meter(), SimLevel(), OnMissionComplete (+8 more)

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
Cohesion: 0.08
Nodes (33): ref_radix_ui_react_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), ScenarioDialog(), DataChartScenario() (+25 more)

### Community 63 - "lib/utils.ts"
Cohesion: 0.13
Nodes (17): NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button, ButtonProps (+9 more)

### Community 64 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.21
Nodes (13): ResultCard(), ICONS, MenuGrid(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell(), fetchScenarioByMenuId() (+5 more)

### Community 65 - "site-checkout/lib/data/index.ts"
Cohesion: 0.14
Nodes (17): ChatbotWidget(), KATEGORI_LIST, QuizFlow(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), fetchQuizQuestions(), saveQuizResult() (+9 more)

### Community 66 - "inspektur-world.tsx"
Cohesion: 0.05
Nodes (44): ALARM, BONUS_INFO, BonusItem(), BonusItemData, CALM, ConceptQuiz(), CONE_HALF, CONE_RANGE (+36 more)

### Community 67 - "data-lab-world.tsx"
Cohesion: 0.10
Nodes (28): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), Feedback, BAR_X(), BarColumn() (+20 more)

### Community 68 - "data-mission.tsx"
Cohesion: 0.17
Nodes (14): CHART_OPTIONS, ChartLevel(), CleanLevel(), DataMission(), findIssue(), InsightLevel(), issueKey(), PALETTE (+6 more)

### Community 69 - "worlds.ts"
Cohesion: 0.10
Nodes (18): ARENA_ENEMIES, ARENA_STAFF, ArenaEnemyInfo, ArenaEnemyKind, BinId, BOARD_GATES, BONUS_KINDS, BONUS_SPOTS (+10 more)

### Community 70 - "ref_react"
Cohesion: 0.10
Nodes (25): ref_class_variance_authority, ref_gsap, ref_react, RevealCard(), StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, initials() (+17 more)

### Community 71 - "world-controls.ts"
Cohesion: 0.18
Nodes (10): MissionWorld(), TouchButton, TouchControls(), createInputState(), KEY_MAP, PRESS_FOR_KEY, PressName, useWorldInput() (+2 more)

### Community 72 - "site-checkout/components/game/game-canvas.tsx"
Cohesion: 0.15
Nodes (8): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, GameQuality

### Community 73 - "ArenaLevel"
Cohesion: 0.22
Nodes (10): arenaBlocked(), ArenaLevel(), ArenaScene(), burst(), createSim(), emit(), hudOf(), makeShots() (+2 more)

### Community 74 - "components/info/testimonial-card.tsx"
Cohesion: 0.33
Nodes (7): initials(), TestimonialCard(), Avatar(), AvatarFallback(), AvatarImage(), getTrack(), ref_radix_ui_react_avatar

### Community 75 - "ArenaHall"
Cohesion: 0.53
Nodes (6): ArenaHall, canvasTexture(), makeAlertScreen(), makeArenaFloor(), makeGrating(), makeWallTexture()

## Knowledge Gaps
- **446 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+441 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 571 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `hacker-arena.tsx`, `mission-kit.tsx`, `inspektur-world.tsx`, `data-lab-world.tsx`, `components/game/game-entry.tsx`, `components/game/campus-panels.tsx`, `data-mission.tsx`, `erp-mission.tsx`, `ArenaLevel`, `components/info/testimonial-card.tsx`, `lib/data/index.ts`, `race-world.tsx`, `components/workspace/scenario-dialog.tsx`, `components/workspace/workspace-shell.tsx`, `lib/utils.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `cn()` connect `ref_react` to `site-checkout/components/workspace/workspace-shell.tsx`, `site-checkout/lib/data/index.ts`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/game/campus-panels.tsx`, `ref_lucide_react`, `site-checkout/lib/types.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `clampDelta()` connect `clampDelta` to `hacker-arena.tsx`, `inspektur-world.tsx`, `data-lab-world.tsx`, `ArenaLevel`, `data-center.tsx`, `race-world.tsx`, `arena-models.tsx`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _446 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `hacker-arena.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `mission-kit.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._