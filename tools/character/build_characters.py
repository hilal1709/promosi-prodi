"""Builds the Arga and Nara game characters with Blender + MPFB (MakeHuman).

Run headless (see README.md):

    blender -b -P tools/character/build_characters.py -- --avatar arga [--preview DIR]

Produces public/characters/<avatar>.glb: a rigged, textured human dressed like
the character-select portrait, with the Idle_Loop and Walk_Loop clips from the
Universal Animation Library retargeted onto MPFB's "game_engine" skeleton.
"""

import argparse
import importlib
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Euler, Matrix, Quaternion, Vector

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ANIMATION_SOURCE = os.path.join(REPO, "tools", "character", "source", "ual-standard.glb")
# Exported clip name -> (UAL source clip, calm). UAL's Idle_Loop is a wide,
# forward-leaning "ready" stance; a calm idle keeps its breathing and arm sway
# but stands the legs straight and halves the torso lean.
CLIPS = {"Idle_Loop": ("Idle_Loop", True), "Walk_Loop": ("Walk_Formal_Loop", False)}
LEGS = ("thigh", "calf", "foot", "ball")
# MPFB's game_engine rest pose stands with legs splayed outward (bind pose
# made for skinning, not for standing still) - each leg bone gets rotated a
# few degrees back towards vertical for the idle pose. Left/right mirror.
NARROW_STANCE_DEG = {"thigh": 6.0, "calf": 5.0}
TORSO = ("pelvis", "spine", "neck", "head")
# Only the arms differ between the two rest poses (T-pose vs A-pose).
ARMS = ("clavicle", "upperarm", "lowerarm", "hand", "thumb", "index", "middle", "ring", "pinky")
FINGERS_R = ("thumb_01_r", "thumb_02_r", "index_01_r", "index_02_r", "index_03_r",
             "middle_01_r", "middle_02_r", "middle_03_r", "ring_01_r", "ring_02_r", "ring_03_r",
             "pinky_01_r", "pinky_02_r", "pinky_03_r")

# The right arm's carrying pose, fixed for every frame of both clips (so the
# hand doesn't swing an object that is supposed to be held steady against the
# body), tuned by eye against the character-select portraits: Arga's laptop
# hangs vertically at the hip, gripped from its side edge; Nara's tablet is
# hugged against her ribs with the forearm raised across her body. Each entry
# is a world-space axis/degrees rotation applied on top of the bone's own
# animation, innermost bone first.
HOLD_POSE = {
    "arga": [],
    "nara": [],
}
FINGER_CURL_DEG = {"arga": 50, "nara": 42}


def mpfb(name):
    return importlib.import_module(f"bl_ext.blender_org.mpfb.services.{name}")


HumanService = mpfb("humanservice").HumanService
TargetService = mpfb("targetservice").TargetService
ObjectService = mpfb("objectservice").ObjectService

# Colours sampled from the character-select portraits.
RED_SHIRT = (0.66, 0.15, 0.18)
BLACK_TEE = (0.12, 0.12, 0.13)
BEIGE_PANTS = (0.85, 0.79, 0.69)
HAIR = (0.075, 0.062, 0.058)


def face_targets(values):
    """Expand {target_stem: weight} into MPFB's target-stack entries.

    A stem with no l-/r- variant is used as-is (whole-head macro shapes); a
    stem that only exists per side (eyes, cheeks) is applied to both.
    """
    paired = ("eye-", "cheek-")
    targets = []
    for stem, weight in values.items():
        if stem.startswith(paired):
            targets.append({"target": f"l-{stem}", "value": weight})
            targets.append({"target": f"r-{stem}", "value": weight})
        else:
            targets.append({"target": stem, "value": weight})
    return targets


# The character-select portraits are realistic photos, not anime art - keep
# these subtle. Just enough to soften MPFB's default adult proportions towards
# something younger and friendlier, without reading as cartoonish.
FACE_ARGA = face_targets({
    "head-round": 0.15,
    "eye-scale-incr": 0.2,
    "eye-height1-incr": 0.1,
    "cheek-volume-incr": 0.15,
    "nose-flaring-decr": 0.15,
    "nose-nostrils-width-decr": 0.15,
    "nose-point-width-decr": 0.12,
    "nose-compression-compress": 0.1,
    "mouth-lowerlip-volume-incr": 0.1,
    "chin-width-decr": 0.08,
    "chin-prominent-decr": 0.08,
    "forehead-scale-vert-decr": 0.05,
})
FACE_NARA = face_targets({
    "head-round": 0.25,
    "eye-scale-incr": 0.3,
    "eye-height1-incr": 0.15,
    "cheek-volume-incr": 0.2,
    "nose-flaring-decr": 0.2,
    "nose-nostrils-width-decr": 0.2,
    "nose-point-width-decr": 0.18,
    "nose-compression-compress": 0.15,
    "mouth-lowerlip-volume-incr": 0.18,
    "mouth-cupidsbow-incr": 0.1,
    "chin-width-decr": 0.12,
    "chin-prominent-decr": 0.12,
    "forehead-scale-vert-decr": 0.05,
})

LOOKS = {
    "arga": {
        "phenotype": {"gender": 1.0, "age": 0.4, "muscle": 0.5, "weight": 0.42, "proportions": 0.65,
                      "height": 0.52, "cupsize": 0.5, "firmness": 0.5,
                      "race": {"asian": 1.0, "caucasian": 0.0, "african": 0.0}},
        "skin": "young_asian_male/young_asian_male.mhmat",
        "skin_tint": (1.0, 0.95, 0.9),
        "hair": "short02/short02.mhclo",
        "eyebrows": "eyebrow009/eyebrow009.mhclo",
        "eyelashes": "eyelashes02/eyelashes02.mhclo",
        "clothes": {
            "elvs_male_shirt_untucked_bd1/elvs_male_shirt_untucked_bd1.mhclo": RED_SHIRT,
            "cortu_cargo_pants/cortu_cargo_pants.mhclo": BEIGE_PANTS,
            "shoes05/shoes05.mhclo": None,
        },
        "targets": FACE_ARGA,
        "device": (0.30, 0.215, 0.018),  # laptop
        "device_pose": ((-0.03, 0.04, -0.08), (0, 0, 0)),
    },
    "nara": {
        "phenotype": {"gender": 0.0, "age": 0.38, "muscle": 0.45, "weight": 0.4, "proportions": 0.65,
                      "height": 0.45, "cupsize": 0.45, "firmness": 0.5,
                      "race": {"asian": 1.0, "caucasian": 0.0, "african": 0.0}},
        "skin": "young_asian_female/young_asian_female.mhmat",
        "skin_tint": (1.0, 0.9, 0.82),
        "hair": "elvs_hazel_hair/elvs_hazel_hair.mhclo",
        "eyebrows": "eyebrow006/eyebrow006.mhclo",
        "eyelashes": "eyelashes01/eyelashes01.mhclo",
        "clothes": {
            "elvs_male_shirt_untucked_bd1/elvs_male_shirt_untucked_bd1.mhclo": RED_SHIRT,
            "cortu_cargo_pants/cortu_cargo_pants.mhclo": BEIGE_PANTS,
            "shoes05/shoes05.mhclo": None,
        },
        "targets": FACE_NARA,
        "device": (0.24, 0.17, 0.012),  # tablet
        "device_pose": ((-0.02, 0.03, -0.09), (0, 0, 0)),
    },
}


def build_human(avatar):
    look = LOOKS[avatar]
    info = HumanService._create_default_human_info_dict()  # pylint: disable=protected-access
    info.update({
        "name": avatar.capitalize(),
        "phenotype": look["phenotype"],
        "rig": "game_engine",
        "eyes": "low-poly/low-poly.mhclo",
        "eyebrows": look["eyebrows"],
        "eyelashes": look["eyelashes"],
        "hair": look["hair"],
        "clothes": list(look["clothes"].keys()),
        "skin_mhmat": look["skin"],
        "skin_material_type": "GAMEENGINE",
        "clothes_material_type": "MAKESKIN",
        "targets": look["targets"],
        "alternative_materials": {},
    })
    settings = HumanService.get_default_deserialization_settings()
    settings["subdiv_levels"] = 0
    basemesh = HumanService.deserialize_from_dict(info, settings)
    rig = basemesh.parent
    return basemesh, rig


def children_meshes(rig):
    return [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig]


def bake_shape(basemesh):
    # Freeze the phenotype into the mesh so modifiers can be applied on export.
    TargetService.bake_targets(basemesh)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.data.shape_keys:
            bpy.context.view_layer.objects.active = obj
            obj.shape_key_add(name="__freeze", from_mix=True)
            obj.active_shape_key_index = len(obj.data.shape_keys.key_blocks) - 1
            for block in list(obj.data.shape_keys.key_blocks)[:-1]:
                obj.shape_key_remove(block)
            obj.shape_key_remove(obj.data.shape_keys.key_blocks[0])


def apply_non_armature_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        if mod.type == "ARMATURE":
            continue
        with bpy.context.temp_override(object=obj, active_object=obj):
            if mod.show_viewport:
                bpy.ops.object.modifier_apply(modifier=mod.name)
            else:
                obj.modifiers.remove(mod)


# --- Materials -----------------------------------------------------------------

def find_images(material):
    images = {}
    if not material or not material.use_nodes:
        return images
    for node in material.node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image:
            name = node.image.name.lower()
            key = "normal" if "normal" in name else "diffuse"
            if "rough" in name or "spec" in name or "bump" in name or "displace" in name:
                continue
            images.setdefault(key, node.image)
    return images


def resize(image, limit):
    width, height = image.size
    if max(width, height) > limit:
        scale = limit / max(width, height)
        image.scale(max(1, int(width * scale)), max(1, int(height * scale)))


def tint(image, colour, name):
    """Re-dye a garment texture, keeping its folds and seams as shading."""
    width, height = image.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape(-1, 4)
    luminance = pixels[:, 0] * 0.2126 + pixels[:, 1] * 0.7152 + pixels[:, 2] * 0.0722
    visible = pixels[:, 3] > 0.5
    mean = float(np.median(luminance[visible])) if visible.any() else float(np.median(luminance))
    shade = np.clip(luminance / max(mean, 1e-3), 0.0, 1.6) ** 0.85
    for channel in range(3):
        pixels[:, channel] = np.clip(shade * colour[channel], 0, 1)
    dyed = bpy.data.images.new(name, width, height, alpha=True)
    dyed.pixels.foreach_set(pixels.reshape(-1))
    dyed.pack()
    return dyed


def warm(image, factor):
    """Multiply a skin texture towards the portraits' warmer tone."""
    width, height = image.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    pixels = pixels.reshape(-1, 4)
    pixels[:, :3] *= np.asarray(factor, dtype=np.float32)
    image.pixels.foreach_set(pixels.reshape(-1))
    image.pack()


def simple_material(name, diffuse, normal, roughness, alpha):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0
    if diffuse:
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = diffuse
        links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha:
            links.new(texture.outputs["Alpha"], bsdf.inputs["Alpha"])
    if normal:
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = normal
        texture.image.colorspace_settings.name = "Non-Color"
        normal_map = nodes.new("ShaderNodeNormalMap")
        links.new(texture.outputs["Color"], normal_map.inputs["Color"])
        links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def rebuild_materials(rig, look):
    """Swap MPFB's node setups for plain glTF-friendly PBR materials."""
    hair_file = os.path.basename(look["hair"]).split(".")[0]
    clothes = {os.path.basename(k).split(".")[0]: v for k, v in look["clothes"].items()}
    for obj in children_meshes(rig):
        name = obj.name.lower()
        kind = ObjectService.get_object_type(obj).lower()
        for slot_index, slot in enumerate(obj.material_slots):
            images = find_images(slot.material)
            diffuse, normal = images.get("diffuse"), images.get("normal")
            for image in (diffuse, normal):
                if image:
                    resize(image, 2048 if kind == "basemesh" else 1024)
            if kind == "hair" or hair_file in name:
                if diffuse:
                    diffuse = tint(diffuse, HAIR, "hair_dyed")
                material = simple_material("hair", diffuse, normal, 0.55, True)
            elif kind in ("eyebrows", "eyelashes"):
                material = simple_material("hair_" + kind, diffuse, None, 0.8, True)
            elif kind == "eyes":
                material = simple_material("eyes", diffuse, None, 0.15, False)
            elif any(key in name for key in clothes) or kind == "clothes":
                key = next((key for key in clothes if key in name), name)
                colour = clothes.get(key)
                if diffuse and colour:
                    diffuse = tint(diffuse, colour, f"{key}_dyed")
                material = simple_material(f"cloth_{key}", diffuse, normal, 0.9, False)
            else:
                if diffuse and kind == "basemesh":
                    warm(diffuse, look["skin_tint"])
                material = simple_material("skin", diffuse, normal, 0.6, False)
            obj.material_slots[slot_index].material = material


# --- Accessories -----------------------------------------------------------------

def add_box(name, size, material, bevel=0.004):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    modifier = obj.modifiers.new("bevel", "BEVEL")
    modifier.width = bevel
    modifier.segments = 3
    obj.data.materials.append(material)
    return obj


def flat_material(name, colour, roughness=0.8, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*colour, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return material


def parent_to_bone(obj, rig, bone_name):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    bpy.context.view_layer.update()
    obj.matrix_world = world


def front_surface_y(obj, x, z):
    """Y of the frontmost surface (the character faces -Y) at (x, z)."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    inverse = evaluated.matrix_world.inverted()
    origin = inverse @ Vector((x, -2.0, z))
    direction = (inverse.to_3x3() @ Vector((0, 1, 0))).normalized()
    hit, location, *_ = evaluated.ray_cast(origin, direction)
    return (evaluated.matrix_world @ location).y if hit else None


def add_accessories(rig, look):
    shirt = next(o for o in children_meshes(rig) if "shirt_untucked" in o.name.lower())
    neck = rig.matrix_world @ rig.data.bones["neck_01"].head_local
    chest_z = neck.z - 0.2
    chest_y = front_surface_y(shirt, 0.0, chest_z) or neck.y - 0.12

    strap = flat_material("lanyard", (0.09, 0.15, 0.3), 0.9)
    card = flat_material("idcard", (0.93, 0.94, 0.95), 0.5)
    clip = flat_material("metal", (0.6, 0.62, 0.65), 0.35, 0.6)
    parts = []
    for side in (-1, 1):
        curve = bpy.data.curves.new(f"lanyard_{side}", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = 0.006
        curve.bevel_resolution = 2
        spline = curve.splines.new("BEZIER")
        points = [
            Vector((side * 0.06, neck.y + 0.03, neck.z - 0.01)),
            Vector((side * 0.055, chest_y - 0.01, neck.z - 0.08)),
            Vector((0.0, chest_y - 0.012, chest_z + 0.02)),
        ]
        spline.bezier_points.add(len(points) - 1)
        for point, co in zip(spline.bezier_points, points):
            point.co = co
            point.handle_left_type = point.handle_right_type = "AUTO"
        obj = bpy.data.objects.new(f"lanyard_{side}", curve)
        bpy.context.collection.objects.link(obj)
        obj.data.materials.append(strap)
        parts.append(obj)
    badge = add_box("idcard", (0.055, 0.004, 0.08), card, 0.003)
    badge.location = (0.0, chest_y - 0.014, chest_z - 0.03)
    holder = add_box("idclip", (0.012, 0.006, 0.02), clip, 0.002)
    holder.location = (0.0, chest_y - 0.014, chest_z + 0.018)
    parts += [badge, holder]
    for obj in parts:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target="MESH")
        parent_to_bone(obj, rig, "spine_03")


def add_device(rig, look):
    """Laptop / tablet gripped in the already-posed (held) right hand."""
    assign_action(rig, bpy.data.actions["Idle_Loop"])
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    length, width, thickness = look["device"]
    shell = flat_material("device", (0.55, 0.56, 0.59), 0.35, 0.6)
    device = add_box("device", (thickness, width, length), shell, 0.006)
    hand = rig.pose.bones["hand_r"]
    grip = rig.matrix_world @ hand.head
    offset, euler_deg = look["device_pose"]
    device.location = (grip.x + offset[0], grip.y + offset[1], grip.z + offset[2])
    device.rotation_euler = [math.radians(v) for v in euler_deg]
    bpy.context.view_layer.update()
    parent_to_bone(device, rig, "hand_r")
    rig.animation_data.action = None
    for pose_bone in rig.pose.bones:
        pose_bone.matrix_basis = Matrix()
    bpy.context.view_layer.update()


# --- Animation retargeting ---------------------------------------------------------

def import_animation_source():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=ANIMATION_SOURCE)
    imported = set(bpy.data.objects) - before
    source = next(o for o in imported if o.type == "ARMATURE")
    return source, imported


def assign_action(obj, action):
    # Blender 4.4+ layered actions only animate once a slot is bound.
    obj.animation_data.action = action
    if action and action.slots and obj.animation_data.action_slot is None:
        obj.animation_data.action_slot = action.slots[0]


def bone_order(rig):
    order = []

    def visit(bone):
        order.append(bone.name)
        for child in bone.children:
            visit(child)

    for bone in rig.data.bones:
        if bone.parent is None:
            visit(bone)
    return order


def retarget(source, target, avatar):
    """Copy source clips onto the target by matching world-space bone directions.

    The UAL rig rests in a T-pose while MPFB rests in an A-pose, so each arm
    bone first gets the world rotation that swings its rest direction onto the
    source's rest direction. Every bone then receives the source bone's
    per-frame world-space rotation delta from its rest pose.
    """
    hold = HOLD_POSE[avatar]
    finger_curl = math.radians(FINGER_CURL_DEG[avatar])
    source_bones = {b.name.lower(): b.name for b in source.data.bones}
    mapping = [(name, source_bones[name.lower()]) for name in bone_order(target)
               if name.lower() in source_bones and name.lower() not in ("root",)]

    align = {}
    target_rest = {}
    source_rest = {}
    for tname, sname in mapping:
        t0 = (target.matrix_world @ target.data.bones[tname].matrix_local).to_quaternion()
        s0 = (source.matrix_world @ source.data.bones[sname].matrix_local).to_quaternion()
        t_dir = t0 @ Vector((0, 1, 0))
        s_dir = s0 @ Vector((0, 1, 0))
        align[tname] = t_dir.rotation_difference(s_dir) if tname.startswith(ARMS) else Quaternion()
        target_rest[tname] = t0
        source_rest[sname] = s0

    pelvis_src = source.matrix_world @ source.data.bones["pelvis"].head_local
    pelvis_tgt = target.matrix_world @ target.data.bones["pelvis"].head_local
    ratio = pelvis_tgt.z / pelvis_src.z

    for pose_bone in target.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
    scene = bpy.context.scene
    target.animation_data_create()
    actions = []
    for clip, (source_clip, calm) in CLIPS.items():
        action = next(a for a in bpy.data.actions if a.name == source_clip)
        assign_action(source, action)
        baked = bpy.data.actions.new(f"{clip}__retargeted")
        baked.use_fake_user = True
        target.animation_data.action = baked
        start, end = (int(round(v)) for v in action.frame_range)
        for frame in range(start, end + 1):
            scene.frame_set(frame)
            for tname, sname in mapping:
                pose_bone = target.pose.bones[tname]
                s_world = (source.matrix_world @ source.pose.bones[sname].matrix)
                delta = s_world.to_quaternion() @ source_rest[sname].inverted()
                rotation = delta @ align[tname] @ target_rest[tname]
                if calm and tname.startswith(LEGS):
                    rotation = target_rest[tname]
                elif calm and tname.startswith(TORSO):
                    # Keep the chin up: UAL's idle looks at the floor.
                    keep = 0.2 if tname.startswith(("neck", "head")) else 0.5
                    rotation = Quaternion().slerp(delta, keep) @ align[tname] @ target_rest[tname]
                # MPFB's rest pose stands with legs splayed outward (a bind
                # pose made for skinning, not for standing); pull the thighs
                # and calves back towards vertical in every clip, not just
                # the idle, or the walk cycle inherits the same wide stance.
                narrow = next((b for b in NARROW_STANCE_DEG if tname.startswith(b)), None)
                if narrow:
                    side = 1.0 if tname.endswith("_l") else -1.0
                    angle = math.radians(NARROW_STANCE_DEG[narrow]) * side
                    rotation = Quaternion((0, 1, 0), angle) @ rotation
                # Hold the carried object steady: override the right arm's
                # animation with a fixed pose, then curl its fingers around
                # the object, in every frame of both clips.
                for bone, axis, degrees in hold:
                    if tname == bone:
                        rotation = Quaternion(axis, math.radians(degrees)) @ rotation
                if tname in FINGERS_R:
                    rotation = Quaternion((1, 0, 0), finger_curl) @ rotation
                current = target.matrix_world @ pose_bone.matrix
                location = current.to_translation()
                if tname == "pelvis":
                    offset = s_world.to_translation() - pelvis_src
                    location = pelvis_tgt if calm else pelvis_tgt + offset * ratio
                world = Matrix.LocRotScale(location, rotation, Vector((1, 1, 1)))
                pose_bone.matrix = target.matrix_world.inverted() @ world
                bpy.context.view_layer.update()
                pose_bone.keyframe_insert("rotation_quaternion", frame=frame, group=tname)
                if tname == "pelvis":
                    pose_bone.keyframe_insert("location", frame=frame, group=tname)
        actions.append(baked)
    target.animation_data.action = None
    for pose_bone in target.pose.bones:
        pose_bone.matrix_basis = Matrix()
    return actions


def push_to_nla(rig, actions):
    for action in actions:
        track = rig.animation_data.nla_tracks.new()
        track.name = action.name
        track.strips.new(action.name, int(action.frame_range[0]), action)
        track.mute = True


# --- Preview & export -------------------------------------------------------------

def render_previews(rig, directory, avatar):
    os.makedirs(directory, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = 720, 1080
    scene.render.film_transparent = False
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.8, 0.8, 0.82, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
    sun = bpy.data.objects.new("key", bpy.data.lights.new("key", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
    scene.collection.objects.link(sun)
    camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    camera.data.lens = 60
    scene.collection.objects.link(camera)
    scene.camera = camera
    assign_action(rig, bpy.data.actions["Idle_Loop"])
    scene.frame_set(1)
    height = max((rig.matrix_world @ rig.data.bones["head"].tail_local).z, 1.6)
    for label, angle in (("front", 0), ("side", 90), ("back", 180)):
        radians = math.radians(angle)
        distance = 4.6
        camera.location = (math.sin(radians) * distance, -math.cos(radians) * distance, height * 0.55)
        camera.rotation_euler = (math.radians(90), 0, radians)
        scene.render.filepath = os.path.join(directory, f"{avatar}-{label}.png")
        bpy.ops.render.render(write_still=True)
    assign_action(rig, bpy.data.actions["Walk_Loop"])
    scene.frame_set(8)
    camera.location = (math.sin(math.radians(60)) * 4.6, -math.cos(math.radians(60)) * 4.6, height * 0.55)
    camera.rotation_euler = (math.radians(90), 0, math.radians(60))
    scene.render.filepath = os.path.join(directory, f"{avatar}-walk.png")
    bpy.ops.render.render(write_still=True)
    assign_action(rig, bpy.data.actions["Idle_Loop"])
    scene.frame_set(1)
    # Close-up of the face.
    camera.location = (0, -1.3, height - 0.12)
    camera.rotation_euler = (math.radians(90), 0, 0)
    scene.render.filepath = os.path.join(directory, f"{avatar}-face.png")
    bpy.ops.render.render(write_still=True)
    rig.animation_data.action = None


def export(rig, path):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for obj in bpy.data.objects:
        if obj.parent == rig:
            obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_def_bones=False,
        export_image_format="WEBP",
        export_image_quality=82,
        export_morph=False,
        export_extras=False,
        export_cameras=False,
        export_lights=False,
    )


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--avatar", choices=sorted(LOOKS), required=True)
    parser.add_argument("--out", default=None)
    parser.add_argument("--preview", default=None)
    parser.add_argument("--hair", default=None, help="override the hair asset while auditioning styles")
    args = parser.parse_args(argv)
    look = LOOKS[args.avatar]
    if args.hair:
        look["hair"] = f"{args.hair}/{args.hair}.mhclo"

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24
    basemesh, rig = build_human(args.avatar)
    bake_shape(basemesh)
    for obj in children_meshes(rig):
        apply_non_armature_modifiers(obj)
    rebuild_materials(rig, look)
    add_accessories(rig, look)

    source, imported = import_animation_source()
    actions = retarget(source, rig, args.avatar)
    for obj in imported:
        bpy.data.objects.remove(obj, do_unlink=True)
    for action in list(bpy.data.actions):
        if action not in actions:
            bpy.data.actions.remove(action)
    for action in actions:
        action.name = action.name.replace("__retargeted", "")
    add_device(rig, look)
    push_to_nla(rig, actions)

    if args.preview:
        render_previews(rig, args.preview, args.avatar)
    out = args.out or os.path.join(REPO, "public", "characters", f"{args.avatar}.glb")
    export(rig, out)
    print("EXPORTED", out, os.path.getsize(out))


main()
