"use client";

import { useLayoutEffect, type RefObject } from "react";

// Elemen HUD tetap di baris atas. Tingginya berubah-ubah: chip statistik dan
// judul membungkus ke beberapa baris di layar sempit.
const OBSTACLES = ".world-hud-title, .world-hud-stats > *, .world-hud-pause";

// Panel yang ditumpuk otomatis di bawah HUD, berurutan menurut prioritas:
// bilah tengah (kompas/progres), radar kanan, panel kiri, lalu kartu petunjuk.
const FLOW_GROUPS = [
  ".drone-compass, .river-progress, .world-boss-bar",
  ".drone-radar",
  ".race-minimap, .world-side, .drone-job, .river-chart, .sea-wind",
  ".race-hint, .river-question, .hunt-warn",
];

const TOUCH_CONTROLS = ".world-touch-left > *, .world-touch-right > *";
const GAP = 8;

/**
 * Menata panel HUD level agar tidak saling menimpa di layar mana pun: setiap
 * panel diletakkan tepat di bawah elemen yang berada di atasnya secara
 * horizontal (HUD atau panel yang sudah ditata). Nilai `top` di CSS tetap
 * menjadi batas minimum, jadi tampilan desktop tidak berubah. Panel ikut
 * ditata hanya bila CSS-nya memberi `--hud-flow: 1`, sehingga media query bisa
 * mengecualikannya (mis. radar di desktop yang menempel di bawah).
 *
 * Hook ini juga menulis `--touch-clear` ke stage: tinggi area tombol sentuh
 * dari bawah layar, dipakai `.world-prompt` agar tidak tertutup tombol.
 */
export function useHudLayout(stageRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const layout = () => {
      const bounds = stage.getBoundingClientRect();
      const placed: DOMRect[] = [];
      stage.querySelectorAll(OBSTACLES).forEach((node) => {
        const box = node.getBoundingClientRect();
        if (box.height > 0) placed.push(box);
      });

      for (const group of FLOW_GROUPS) {
        stage.querySelectorAll<HTMLElement>(group).forEach((node) => {
          node.style.top = "";
          // `top` hanya bisa dihitung relatif terhadap stage bila stage-lah induk posisinya.
          if (node.offsetParent !== stage) return;
          if (getComputedStyle(node).getPropertyValue("--hud-flow").trim() !== "1") return;
          const base = node.getBoundingClientRect();
          if (base.width === 0 || base.height === 0) return;
          let top = base.top;
          for (const box of placed) {
            const overlapsX = box.left < base.right && box.right > base.left;
            if (overlapsX) top = Math.max(top, box.bottom + GAP);
          }
          node.style.top = `${top - bounds.top}px`;
          placed.push(new DOMRect(base.left, top, base.width, base.height));
        });
      }

      let touchClear = 0;
      stage.querySelectorAll(TOUCH_CONTROLS).forEach((node) => {
        const box = node.getBoundingClientRect();
        if (box.height > 0) touchClear = Math.max(touchClear, bounds.bottom - box.top);
      });
      stage.style.setProperty("--touch-clear", `${touchClear}px`);
    };

    // Banyak pemicu bisa datang dalam satu frame; tata ulang sekali saja.
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        layout();
      });
    };

    const resize = new ResizeObserver(schedule);
    const observeAll = () => {
      resize.observe(stage);
      stage.querySelectorAll(`.world-hud-top, .world-hud-stats, .world-touch, ${OBSTACLES}, ${FLOW_GROUPS.join(", ")}`).forEach((node) => resize.observe(node));
    };
    // Panel muncul/hilang (kartu petunjuk, chip combo) → amati elemen baru lalu tata ulang.
    const mutation = new MutationObserver(() => {
      observeAll();
      schedule();
    });
    mutation.observe(stage, { childList: true });
    const stats = stage.querySelector(".world-hud-stats");
    if (stats) mutation.observe(stats, { childList: true });

    observeAll();
    layout();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [stageRef]);
}

/**
 * Label jarak di strip kompas bisa saling tumpang-tindih bila dua target
 * searah (terutama di layar sempit). Label yang bertabrakan diturunkan ke
 * baris berikutnya. Dipanggil setiap frame setelah posisi marker diperbarui.
 */
export function stackCompassLabels(strip: HTMLElement) {
  const labels = Array.from(strip.querySelectorAll<HTMLElement>("[data-marker] > span")).filter(
    (label) => label.style.display !== "none" && label.parentElement?.style.display !== "none",
  );
  labels.forEach((label) => (label.style.marginTop = ""));
  const rows: DOMRect[][] = [];
  labels
    .map((label) => ({ label, box: label.getBoundingClientRect() }))
    .sort((a, b) => a.box.left - b.box.left)
    .forEach(({ label, box }) => {
      let row = 0;
      while (rows[row]?.some((other) => other.left < box.right + 4 && other.right + 4 > box.left)) row++;
      (rows[row] ??= []).push(box);
      if (row > 0) label.style.marginTop = `calc(.55rem + ${row * 1.25}rem)`;
    });
}
