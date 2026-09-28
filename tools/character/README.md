# Game characters (Arga & Nara)

`build_characters.py` generates `public/characters/{arga,nara}.glb` headlessly
with Blender + [MPFB](https://static.makehumancommunity.org/mpfb.html)
(MakeHuman for Blender). The looks follow the character-select portraits in
`public/characters/avatar-*-neutral.webp`; asset licences are in `CREDITS.md`.

## One-time setup

1. Blender 4.5 LTS (portable zip is fine), e.g. extracted to `D:\tools\blender`.
2. MPFB from the Blender extensions platform:
   `blender -b --online-mode -c extension install -s -e mpfb`
3. MakeHuman asset packs (https://static.makehumancommunity.org/assets/assetpacks/index.html):
   `makehuman_system_assets`, `hair01`, `hair03`, `shirts02`, `pants01`.
   Install them from Blender's MPFB "Apply assets → Library settings → Load pack",
   or headless with `AssetService.fix_and_extract_asset_pack_zip(zip, LocationService.get_user_data())`.

## Build

```bash
blender -b -P tools/character/build_characters.py -- --avatar arga --preview /tmp/preview
blender -b -P tools/character/build_characters.py -- --avatar nara --preview /tmp/preview
```

`--preview DIR` renders front/side/back/walk/face PNGs for checking against
the portraits; `--hair <asset>` swaps the hairstyle while auditioning.

What the script does: builds the human from an MPFB preset (Asian, ~20 years
old), bakes the shape, rebuilds materials as plain PBR (garment textures are
re-dyed red / beige, skin warmed), adds the lanyard, ID card and laptop/tablet,
then retargets UAL clips from `source/ual-standard.glb` onto MPFB's
`game_engine` rig (same bone names as UAL) and exports a GLB with WebP
textures. The exported clips are `Idle_Loop` (UAL `Idle_Loop` with the legs
straightened and the lean softened) and `Walk_Loop` (UAL `Walk_Formal_Loop`).
