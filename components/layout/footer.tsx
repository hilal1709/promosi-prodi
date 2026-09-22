import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-brand-navy-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-extrabold">SISFOR UISI</p>
            <p className="mt-2 text-sm text-white/70">
              Program Studi Sistem Informasi, Universitas Internasional Semen Indonesia.
              Terakreditasi Baik Sekali oleh LAM INFOKOM.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/60">Jelajahi</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li><Link href="/kuis" className="hover:text-white">Kuis Pilih Jalurmu</Link></li>
              <li><Link href="/ruang-kerja/enterprise-system" className="hover:text-white">Ruang Kerja Digital</Link></li>
              <li><Link href="/info" className="hover:text-white">Kurikulum & Prospek Karier</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/60">Pendaftaran</p>
            <p className="mt-3 text-sm text-white/80">
              Info resmi jalur masuk, jadwal, dan beasiswa tersedia di portal PMB UISI.
            </p>
            <a
              href="https://pmb.uisi.ac.id"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-navy hover:opacity-90"
            >
              pmb.uisi.ac.id →
            </a>
          </div>
        </div>
        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
          Dibuat untuk sayembara promosi Program Studi Sistem Informasi UISI. Beberapa data (mis. testimoni, prestasi) bersifat contoh dan dapat disesuaikan.
        </p>
      </div>
    </footer>
  );
}
