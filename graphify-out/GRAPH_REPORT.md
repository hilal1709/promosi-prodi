# Graph Report - sisfor-pilih-jalurmu  (2026-09-28)

## Corpus Check
- 170 files · ~108,256 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 983 nodes · 1981 edges · 66 communities (52 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a8ce6e6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/types.ts
- erp-mission.tsx
- package.json
- site-checkout/package.json
- components/game/game-entry.tsx
- ref_react
- What You Must Do When Invoked
- ref_next
- site-checkout/lib/types.ts
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- components/quiz/quiz-flow.tsx
- lib/data/index.ts
- dependencies
- site-checkout/components/workspace/workspace-shell.tsx
- site-checkout/components/game/campus-panels.tsx
- dependencies
- compilerOptions
- compilerOptions
- campus-building.tsx
- character-model.tsx
- cn
- lib/utils.ts
- public/manifest.json
- site-checkout/public/manifest.json
- scripts/generate-icons.py
- components/game/game-canvas.tsx
- components/workspace/workspace-shell.tsx
- cn
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- audit-mission.tsx
- SISFOR UISI: Pilih Jalurmu
- components/game/campus-panels.tsx
- SISFOR UISI: Pilih Jalurmu
- graphify reference: query, path, explain
- eslint.config.mjs
- site-checkout/components/quiz/quiz-flow.tsx
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
- data-mission.tsx
- components/workspace/scenario-dialog.tsx
- site-checkout/components/info/testimonial-card.tsx
- mission-kit.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 71 edges
2. `cn()` - 57 edges
3. `compilerOptions` - 16 edges
4. `compilerOptions` - 16 edges
5. `Button` - 15 edges
6. `JalurId` - 14 edges
7. `JalurId` - 14 edges
8. `clampPercent()` - 13 edges
9. `main()` - 13 edges
10. `Button` - 12 edges

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

## Communities (66 total, 14 thin omitted)

### Community 0 - "lib/types.ts"
Cohesion: 0.12
Nodes (23): insightContent, WORKSPACE_SCENARIOS, AccessPolicy, AccessRequest, AuditFinding, AuditItem, AuditLogEntry, ChartQuestion (+15 more)

### Community 1 - "erp-mission.tsx"
Cohesion: 0.14
Nodes (16): MissionPanel(), BoardLevel(), ErpMission(), FlowLevel(), IMPACTS, Meter(), OnMissionComplete, ERP_BOARD (+8 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.11
Nodes (25): CampusAssistant(), InfoCenter(), TrackDetails(), CHARACTERS, GameCanvas, GameEntry(), LiteCampus(), StartScreen() (+17 more)

### Community 5 - "ref_react"
Cohesion: 0.13
Nodes (15): ref_class_variance_authority, ref_gsap, ref_react, RevealCard(), QuestionCard(), TRACK_ICONS, Badge(), BadgeProps (+7 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 7 - "ref_next"
Cohesion: 0.06
Nodes (15): app_globals, metadata, viewport, VALID, LegacyRedirect(), ServiceWorkerRegister(), nextConfig, ref_next (+7 more)

### Community 8 - "site-checkout/lib/types.ts"
Cohesion: 0.11
Nodes (23): ChatbotWidget(), KATEGORI_LIST, ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), TESTIMONIALS, getScenarioByMenuId(), WORKSPACE_MENUS (+15 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.09
Nodes (26): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, GameEntry() (+18 more)

### Community 11 - "components/quiz/quiz-flow.tsx"
Cohesion: 0.23
Nodes (11): QuizFlow(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId(), randomId() (+3 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.13
Nodes (15): ChatbotWidget(), KATEGORI_LIST, ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems(), TESTIMONIALS, isSupabaseConfigured, supabase (+7 more)

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "site-checkout/components/workspace/workspace-shell.tsx"
Cohesion: 0.13
Nodes (17): StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, ResultCard(), ICONS, MenuGrid(), ScenarioDialog(), TRACK_ICONS (+9 more)

### Community 15 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.21
Nodes (12): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), sites_runtime_site_checkout_components_ui_dialog_dialog, sites_runtime_site_checkout_components_ui_tabs_tabs, TabsContent(), TabsList() (+4 more)

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
Cohesion: 0.18
Nodes (9): BuildingStyle, CampusBuilding(), FRAME_MATERIAL, GLASS_MATERIAL, PANE_GEOMETRY, Vec3, Instanced(), InstanceSpec (+1 more)

### Community 20 - "character-model.tsx"
Cohesion: 0.31
Nodes (8): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), GameAvatarId, ref_react_three_fiber, ref_three

### Community 21 - "cn"
Cohesion: 0.09
Nodes (39): ref_lucide_react, auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission() (+31 more)

### Community 22 - "lib/utils.ts"
Cohesion: 0.13
Nodes (16): NAV_LINKS, Navbar(), BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone(), Button, ButtonProps (+8 more)

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

### Community 27 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.12
Nodes (19): RevealCard(), StaggerChildren(), StaggerChildrenProps, TRACK_ICONS, ResultCard(), TRACK_ICONS, ICONS, MenuGrid() (+11 more)

### Community 28 - "cn"
Cohesion: 0.19
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

### Community 34 - "audit-mission.tsx"
Cohesion: 0.18
Nodes (17): AuditMission(), GateLevel(), LogLevel(), ReportLevel(), RISKS, SimLevel(), clampPercent(), FeedbackToast() (+9 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.25
Nodes (10): CATEGORIES, components_ui_dialog_dialog, components_ui_tabs_tabs, TabsContent(), TabsList(), TabsTrigger(), CURRICULUM, CurriculumSummary (+2 more)

### Community 37 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 38 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 39 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint, ref_eslint_config_next, eslintConfig

### Community 40 - "site-checkout/components/quiz/quiz-flow.tsx"
Cohesion: 0.23
Nodes (11): QuizFlow(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId(), randomId() (+3 more)

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

### Community 62 - "data-mission.tsx"
Cohesion: 0.15
Nodes (15): CHART_OPTIONS, ChartLevel(), CleanLevel(), DataMission(), findIssue(), InsightLevel(), issueKey(), PALETTE (+7 more)

### Community 63 - "components/workspace/scenario-dialog.tsx"
Cohesion: 0.12
Nodes (19): DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), DataChartScenario(), DataCleanScenario(), DataInsightScenario() (+11 more)

### Community 64 - "site-checkout/components/info/testimonial-card.tsx"
Cohesion: 0.36
Nodes (6): ref_radix_ui_react_avatar, initials(), TestimonialCard(), Avatar(), AvatarFallback(), AvatarImage()

### Community 65 - "mission-kit.tsx"
Cohesion: 0.16
Nodes (10): Affinity, Feedback, LearningCard(), LevelComplete(), LevelProps, LevelShell(), Stars(), starsFor() (+2 more)

## Knowledge Gaps
- **351 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 454 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `erp-mission.tsx`, `audit-mission.tsx`, `mission-kit.tsx`, `components/game/game-entry.tsx`, `components/game/campus-panels.tsx`, `lib/data/index.ts`, `lib/utils.ts`, `components/workspace/workspace-shell.tsx`, `data-mission.tsx`, `components/workspace/scenario-dialog.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `site-checkout/components/info/testimonial-card.tsx`, `ref_react`, `site-checkout/lib/types.ts`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/workspace/workspace-shell.tsx`, `site-checkout/components/game/campus-panels.tsx`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `JalurId` connect `site-checkout/components/game/campus-panels.tsx` to `ref_react`, `ref_next`, `site-checkout/components/quiz/quiz-flow.tsx`, `site-checkout/lib/types.ts`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/workspace/workspace-shell.tsx`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._
- **Should `erp-mission.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._