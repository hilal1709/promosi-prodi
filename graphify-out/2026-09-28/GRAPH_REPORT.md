# Graph Report - sisfor-pilih-jalurmu  (2026-09-28)

## Corpus Check
- 165 files · ~100,190 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .glb 3, .gz 2)

## Summary
- 914 nodes · 1775 edges · 68 communities (54 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de05fc87`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/types.ts
- components/game/mission-panel.tsx
- package.json
- site-checkout/package.json
- components/game/game-entry.tsx
- cn
- What You Must Do When Invoked
- ref_next
- site-checkout/lib/types.ts
- campus-scenery.tsx
- site-checkout/components/game/game-entry.tsx
- components/quiz/quiz-flow.tsx
- lib/data/index.ts
- dependencies
- site-checkout/components/game/mission-panel.tsx
- site-checkout/components/game/campus-panels.tsx
- dependencies
- compilerOptions
- compilerOptions
- campus-building.tsx
- character-model.tsx
- ref_lucide_react
- ref_react
- public/manifest.json
- site-checkout/public/manifest.json
- scripts/generate-icons.py
- components/game/game-canvas.tsx
- components/quiz/result-card.tsx
- cn
- graphify reference: extra exports and benchmark
- Game characters (Arga & Nara)
- devDependencies
- devDependencies
- CREDITS.md
- components/workspace/workspace-shell.tsx
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
- site-checkout/components/game/game-canvas.tsx
- components/workspace/scenario-dialog.tsx
- components/info/testimonial-card.tsx
- components/chatbot/chatbot-widget.tsx
- components/pwa/install-pwa-prompt.tsx
- site-checkout/components/pwa/install-pwa-prompt.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 58 edges
2. `cn()` - 57 edges
3. `compilerOptions` - 16 edges
4. `compilerOptions` - 16 edges
5. `JalurId` - 14 edges
6. `JalurId` - 14 edges
7. `main()` - 13 edges
8. `Button` - 12 edges
9. `Button` - 12 edges
10. `What You Must Do When Invoked` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Step 2.5 - Transcribe video / audio files (only if video files detected)` --references--> `export()`  [INFERRED]
  .codex/skills/graphify/references/transcribe.md → tools/character/build_characters.py
- `StartScreen()` --calls--> `cn()`  [EXTRACTED]
  components/game/game-entry.tsx → lib/utils.ts
- `LiteCampus()` --calls--> `cn()`  [EXTRACTED]
  components/game/game-entry.tsx → lib/utils.ts
- `AuditMission()` --calls--> `cn()`  [EXTRACTED]
  components/game/mission-panel.tsx → lib/utils.ts
- `ErpMission()` --calls--> `cn()`  [EXTRACTED]
  components/game/mission-panel.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (68 total, 14 thin omitted)

### Community 0 - "lib/types.ts"
Cohesion: 0.17
Nodes (11): AuditItem, DataInsightOpsi, DataRow, ErpOpsi, GamePhase, MissionResult, QuizOption, QuizOptionBobot (+3 more)

### Community 1 - "components/game/mission-panel.tsx"
Cohesion: 0.12
Nodes (16): auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission(), META (+8 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 3 - "site-checkout/package.json"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, eslint, eslint-config-next, gsap, lucide-react, next, @radix-ui/react-avatar (+21 more)

### Community 4 - "components/game/game-entry.tsx"
Cohesion: 0.11
Nodes (24): CampusZone, CHARACTERS, GameCanvas, GameEntry(), LiteCampus(), StartScreen(), supportsWebGL(), ZONE_LABELS (+16 more)

### Community 5 - "cn"
Cohesion: 0.13
Nodes (24): RevealCard(), StaggerChildren(), StaggerChildrenProps, initials(), TestimonialCard(), QuestionCard(), ResultCard(), TRACK_ICONS (+16 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 7 - "ref_next"
Cohesion: 0.06
Nodes (15): app_globals, metadata, viewport, VALID, LegacyRedirect(), ServiceWorkerRegister(), nextConfig, ref_next (+7 more)

### Community 8 - "site-checkout/lib/types.ts"
Cohesion: 0.10
Nodes (28): ref_supabase_supabase_js, ChatbotWidget(), KATEGORI_LIST, TRACK_ICONS, WorkspaceShell(), ACHIEVEMENTS, FAQ_ITEMS, fetchFaqItems() (+20 more)

### Community 9 - "campus-scenery.tsx"
Cohesion: 0.08
Nodes (29): BoundaryHedge(), BOUNDS, CANOPY_COLORS, CITY_BOX, CITY_COLORS, CitySkyline(), DASH_MATERIAL, DistantForest() (+21 more)

### Community 10 - "site-checkout/components/game/game-entry.tsx"
Cohesion: 0.13
Nodes (20): GameEntry(), LiteCampus(), supportsWebGL(), ZONE_LABELS, SoundName, useGameAudio(), calculateTrackScores(), clampScore() (+12 more)

### Community 11 - "components/quiz/quiz-flow.tsx"
Cohesion: 0.23
Nodes (11): QuizFlow(), fetchQuizQuestions(), saveQuizResult(), QUIZ_QUESTIONS, hitungHasilKuis(), JALUR_URUTAN, getSessionId(), randomId() (+3 more)

### Community 12 - "lib/data/index.ts"
Cohesion: 0.23
Nodes (7): ACHIEVEMENTS, TESTIMONIALS, isSupabaseConfigured, supabase, Achievement, QuizResultPayload, Testimonial

### Community 13 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, gsap, lucide-react, next, @radix-ui/react-avatar, @radix-ui/react-dialog (+11 more)

### Community 14 - "site-checkout/components/game/mission-panel.tsx"
Cohesion: 0.13
Nodes (13): auditContent, AuditMission(), dataCleanContent, dataInsightContent, DataMission(), erpContent, ErpMission(), META (+5 more)

### Community 15 - "site-checkout/components/game/campus-panels.tsx"
Cohesion: 0.13
Nodes (18): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), TRACK_ICONS, sites_runtime_site_checkout_components_ui_dialog_dialog, sites_runtime_site_checkout_components_ui_tabs_tabs, TabsContent() (+10 more)

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
Cohesion: 0.36
Nodes (7): buildCharacter(), CharacterModel(), CharacterMotion, characterUrl(), prepareMaterials(), ref_react_three_fiber, ref_three

### Community 21 - "ref_lucide_react"
Cohesion: 0.12
Nodes (22): ref_lucide_react, NAV_LINKS, Navbar(), Button, ButtonProps, buttonVariants, DialogContent(), DialogDescription() (+14 more)

### Community 22 - "ref_react"
Cohesion: 0.15
Nodes (16): NAV_LINKS, Navbar(), Button, ButtonProps, buttonVariants, Progress(), AuditScenario(), DataCleanScenario() (+8 more)

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
Cohesion: 0.10
Nodes (18): CampusSurroundings(), Tree(), TreeKind, Avatar(), BUILDING_BOXES, cameraClearance(), FLOWER_COLORS, FLOWERS (+10 more)

### Community 27 - "components/quiz/result-card.tsx"
Cohesion: 0.14
Nodes (11): RevealCard(), StaggerChildren(), StaggerChildrenProps, ResultCard(), TRACK_ICONS, ICONS, MenuGrid(), getTrack() (+3 more)

### Community 28 - "cn"
Cohesion: 0.19
Nodes (13): TRACK_ICONS, QuestionCard(), Badge(), BadgeProps, badgeVariants, Card(), CardContent(), CardDescription() (+5 more)

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

### Community 34 - "components/workspace/workspace-shell.tsx"
Cohesion: 0.24
Nodes (9): ScenarioDialog(), TRACK_ICONS, TrackSwitcher(), TRACK_ICONS, WorkspaceShell(), fetchScenarioByMenuId(), fetchWorkspaceMenus(), WorkspaceMenu (+1 more)

### Community 35 - "SISFOR UISI: Pilih Jalurmu"
Cohesion: 0.29
Nodes (6): Menjalankan secara lokal, Menyambungkan Supabase (opsional, tapi direkomendasikan untuk data real), SISFOR UISI: Pilih Jalurmu, Struktur folder penting, Tech stack, Yang sudah selesai vs. yang masih bisa dikembangkan

### Community 36 - "components/game/campus-panels.tsx"
Cohesion: 0.20
Nodes (12): CampusAssistant(), CATEGORIES, InfoCenter(), TrackDetails(), components_ui_tabs_tabs, TabsContent(), TabsList(), TabsTrigger() (+4 more)

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

### Community 62 - "site-checkout/components/game/game-canvas.tsx"
Cohesion: 0.15
Nodes (8): ref_three_stdlib, Avatar(), CampusZone, isBlocked(), SPAWN, ZONES, GameCanvas, MissionId

### Community 63 - "components/workspace/scenario-dialog.tsx"
Cohesion: 0.26
Nodes (9): components_ui_dialog_dialog, DialogContent(), DialogDescription(), DialogHeader(), DialogOverlay(), DialogTitle(), DataChartScenario(), DataChartContent (+1 more)

### Community 64 - "components/info/testimonial-card.tsx"
Cohesion: 0.36
Nodes (6): initials(), TestimonialCard(), Avatar(), AvatarFallback(), AvatarImage(), ref_radix_ui_react_avatar

### Community 65 - "components/chatbot/chatbot-widget.tsx"
Cohesion: 0.43
Nodes (5): ChatbotWidget(), KATEGORI_LIST, FAQ_ITEMS, fetchFaqItems(), FaqItem

### Community 66 - "components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

### Community 67 - "site-checkout/components/pwa/install-pwa-prompt.tsx"
Cohesion: 0.60
Nodes (4): BeforeInstallPromptEvent, InstallPwaPrompt(), isIos(), isStandalone()

## Knowledge Gaps
- **346 isolated node(s):** `metadata`, `viewport`, `VALID`, `KATEGORI_LIST`, `CATEGORIES` (+341 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 447 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `components/info/testimonial-card.tsx`, `components/chatbot/chatbot-widget.tsx`, `components/game/mission-panel.tsx`, `components/workspace/workspace-shell.tsx`, `components/game/campus-panels.tsx`, `components/game/game-entry.tsx`, `ref_react`, `components/quiz/result-card.tsx`, `components/workspace/scenario-dialog.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `site-checkout/lib/types.ts`, `site-checkout/components/game/game-entry.tsx`, `site-checkout/components/game/mission-panel.tsx`, `site-checkout/components/game/campus-panels.tsx`, `ref_lucide_react`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `JalurId` connect `components/quiz/quiz-flow.tsx` to `lib/types.ts`, `components/workspace/workspace-shell.tsx`, `components/game/campus-panels.tsx`, `components/game/game-entry.tsx`, `ref_next`, `lib/data/index.ts`, `components/quiz/result-card.tsx`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `metadata`, `viewport`, `VALID` to the rest of the system?**
  _346 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/game/mission-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `site-checkout/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._