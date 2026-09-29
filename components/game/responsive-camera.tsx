"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * FOV kamera three.js bersifat vertikal, sehingga di layar HP potret sudut
 * pandang horizontalnya jadi sangat sempit (terasa "zoom in"). Komponen ini
 * menurunkan `camera.zoom` saat layar lebih tinggi daripada lebarnya agar
 * pemandangan tetap selebar di desktop. `zoom` dipakai (bukan `fov`) karena
 * beberapa level menganimasikan `fov` setiap frame.
 */
export function ResponsiveCamera() {
  useFrame(({ camera, size }) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const zoom = THREE.MathUtils.clamp(size.width / Math.max(1, size.height), 0.55, 1);
    if (Math.abs(camera.zoom - zoom) < 0.001) return;
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  });
  return null;
}
