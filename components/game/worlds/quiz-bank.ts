/* ------------------------------------------------------------------ */
/* Bank soal: varian studi kasus diundi ulang setiap kali level dimulai */
/* ------------------------------------------------------------------ */

/** Salinan array dengan urutan acak (Fisher–Yates). */
export function shuffled<T>(list: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickOne<T>(list: readonly T[], rand: () => number = Math.random): T {
  return list[Math.floor(rand() * list.length) % list.length];
}

/** Ambil `count` item acak tanpa pengulangan. */
export function sample<T>(list: readonly T[], count: number, rand: () => number = Math.random): T[] {
  return shuffled(list, rand).slice(0, count);
}

/** Satu varian per slot, lalu opsi tiap varian diacak (kunci `benar` ikut berpindah bersama opsinya). */
export function drawVariants<T extends { opsi: readonly unknown[] }>(slots: readonly (readonly T[])[], rand: () => number = Math.random): T[] {
  return slots.map((variants) => {
    const chosen = pickOne(variants, rand);
    return { ...chosen, opsi: shuffled(chosen.opsi, rand) };
  });
}
