-- =====================================================================
-- SISFOR UISI: Pilih Jalurmu — Seed Data
-- Mengisi tabel dengan konten yang identik dengan data mock di
-- lib/data/*.ts, supaya begitu Supabase disambungkan, tampilan tidak
-- berubah drastis. Jalankan SETELAH schema.sql.
-- =====================================================================

-- quiz_questions
insert into quiz_questions (urutan, teks_pertanyaan, opsi_jawaban)
select v.urutan, v.teks_pertanyaan, v.opsi_jawaban::jsonb
from (values
(1, 'Kalau ada proses di kampus yang berantakan, kamu lebih tertarik untuk...', '[
  {"id":"q1a","teks":"Menyusun aturan main & memastikan semua orang mengikutinya","bobot":{"it-audit":3,"enterprise-system":1,"data-science":0}},
  {"id":"q1b","teks":"Merancang satu sistem terintegrasi supaya prosesnya otomatis","bobot":{"it-audit":0,"enterprise-system":3,"data-science":1}},
  {"id":"q1c","teks":"Mengumpulkan data dulu untuk tahu apa akar masalahnya","bobot":{"it-audit":1,"enterprise-system":0,"data-science":3}}
]'),
(2, 'Kamu lebih suka menyusun aturan atau membongkar pola dari angka?', '[
  {"id":"q2a","teks":"Menyusun aturan, checklist, dan standar yang jelas","bobot":{"it-audit":3,"enterprise-system":1,"data-science":0}},
  {"id":"q2b","teks":"Membongkar pola dari angka dan menemukan insight tersembunyi","bobot":{"it-audit":0,"enterprise-system":0,"data-science":3}},
  {"id":"q2c","teks":"Keduanya sama menariknya, tergantung konteksnya","bobot":{"it-audit":1,"enterprise-system":2,"data-science":1}}
]'),
(3, 'Kegiatan mana yang paling bikin kamu penasaran untuk dicoba?', '[
  {"id":"q3a","teks":"Mengecek apakah sebuah sistem sudah aman dari celah/risiko","bobot":{"it-audit":3,"enterprise-system":0,"data-science":1}},
  {"id":"q3b","teks":"Mendesain alur kerja gudang, keuangan, atau HR jadi satu sistem","bobot":{"it-audit":0,"enterprise-system":3,"data-science":0}},
  {"id":"q3c","teks":"Membuat grafik dari data mentah supaya orang lain paham cepat","bobot":{"it-audit":0,"enterprise-system":1,"data-science":3}}
]'),
(4, 'Saat kerja kelompok, peran yang paling nyaman buat kamu adalah...', '[
  {"id":"q4a","teks":"Yang mengecek ulang & memastikan tidak ada yang terlewat","bobot":{"it-audit":3,"enterprise-system":1,"data-science":1}},
  {"id":"q4b","teks":"Yang merancang bagaimana semua bagian saling terhubung","bobot":{"it-audit":1,"enterprise-system":3,"data-science":0}},
  {"id":"q4c","teks":"Yang mengolah hasil survei/data jadi kesimpulan akhir","bobot":{"it-audit":0,"enterprise-system":0,"data-science":3}}
]'),
(5, 'Berita/isu digital seperti apa yang paling menarik perhatianmu?', '[
  {"id":"q5a","teks":"Kebocoran data & bagaimana perusahaan seharusnya mencegahnya","bobot":{"it-audit":3,"enterprise-system":0,"data-science":1}},
  {"id":"q5b","teks":"Perusahaan yang berhasil efisien karena sistemnya terintegrasi","bobot":{"it-audit":0,"enterprise-system":3,"data-science":0}},
  {"id":"q5c","teks":"Prediksi tren berdasarkan data besar (big data, AI)","bobot":{"it-audit":0,"enterprise-system":1,"data-science":3}}
]'),
(6, 'Kalau boleh magang sekarang, kamu paling ingin ditempatkan di...', '[
  {"id":"q6a","teks":"Divisi Internal Audit / Risk & Compliance","bobot":{"it-audit":3,"enterprise-system":1,"data-science":0}},
  {"id":"q6b","teks":"Divisi IT yang mengelola sistem ERP perusahaan","bobot":{"it-audit":1,"enterprise-system":3,"data-science":0}},
  {"id":"q6c","teks":"Divisi Business Intelligence / Data Analytics","bobot":{"it-audit":0,"enterprise-system":0,"data-science":3}}
]')
) as v(urutan, teks_pertanyaan, opsi_jawaban)
where not exists (select 1 from quiz_questions);

-- workspace_menus
insert into workspace_menus (id, peminatan, nama_menu, deskripsi, icon_slug, urutan, tipe_interaksi) values
('erp-inventaris','enterprise-system','Modul Inventaris','Kelola stok gudang perusahaan manufaktur semen.','Warehouse',1,'erp-decision'),
('erp-keuangan','enterprise-system','Modul Keuangan','Rekonsiliasi arus kas antar-cabang secara real-time.','Wallet',2,'erp-decision'),
('erp-sdm','enterprise-system','Modul SDM','Otomatisasi proses cuti & penggajian karyawan.','Users',3,'erp-decision'),
('audit-kepatuhan','it-audit','Cek Kepatuhan','Nilai apakah proses akses data pelanggan sudah sesuai standar.','ClipboardCheck',1,'audit-checklist'),
('audit-temuan-risiko','it-audit','Temuan Risiko','Identifikasi celah keamanan sebelum sistem baru diluncurkan.','AlertTriangle',2,'audit-checklist'),
('audit-laporan','it-audit','Laporan Audit','Susun rekomendasi akhir dari hasil audit sistem HR.','FileSearch',3,'audit-checklist'),
('data-bersihkan','data-science','Bersihkan Data','Rapikan data penjualan yang masih berantakan.','Sparkles',1,'data-clean'),
('data-visualisasi','data-science','Buat Visualisasi','Ubah data bersih jadi grafik yang mudah dibaca.','BarChart3',2,'data-chart'),
('data-kesimpulan','data-science','Ambil Kesimpulan','Tentukan rekomendasi bisnis dari grafik yang sudah dibuat.','Lightbulb',3,'data-insight')
on conflict (id) do nothing;

-- workspace_scenarios (lengkap, 9 skenario untuk 3 jalur)
insert into workspace_scenarios (id, menu_id, tipe_interaksi, konten) values
('sc-erp-inventaris','erp-inventaris','erp-decision','{"situasi":"Stok semen di gudang Cabang Gresik menipis, tapi permintaan dari 3 proyek besar sedang naik. Sistem ERP mendeteksi selisih antara stok fisik dan stok di sistem sebesar 4%.","opsi":[{"id":"o1","label":"Langsung pesan stok tambahan besar-besaran ke pabrik","konsekuensi":"Stok aman sementara, tapi biaya gudang membengkak karena tidak tahu penyebab selisih datanya — masalah aslinya belum selesai.","dampak":{"efisiensi":-10,"biaya":-20,"risiko":10}},{"id":"o2","label":"Jalankan modul stock opname otomatis untuk cari akar selisih data dulu","konsekuensi":"Ditemukan kesalahan input saat barang keluar dari 2 minggu lalu. Setelah data dikoreksi, sistem bisa merekomendasikan jumlah pesan ulang yang akurat.","dampak":{"efisiensi":20,"biaya":10,"risiko":-15}},{"id":"o3","label":"Abaikan selisihnya karena kelihatannya kecil (cuma 4%)","konsekuensi":"Dalam 2 bulan, selisih membesar jadi 15% dan menyebabkan proyek besar nyaris kehabisan semen di tengah jalan.","dampak":{"efisiensi":-15,"biaya":-15,"risiko":25}}]}'),
('sc-erp-keuangan','erp-keuangan','erp-decision','{"situasi":"Laporan arus kas dari 5 cabang belum sinkron di akhir bulan. Tim finance pusat butuh laporan konsolidasi besok pagi untuk rapat direksi.","opsi":[{"id":"o1","label":"Minta tiap cabang kirim laporan manual lewat email/Excel","konsekuensi":"Laporan terkumpul tapi formatnya beda-beda, tim finance harus lembur menyamakan format dan rawan salah input.","dampak":{"efisiensi":-20,"biaya":-5,"risiko":15}},{"id":"o2","label":"Jalankan modul konsolidasi otomatis di ERP untuk semua cabang","konsekuensi":"Dalam hitungan menit, laporan konsolidasi tersaji dengan format seragam dan bisa ditelusuri sampai transaksi asalnya.","dampak":{"efisiensi":25,"biaya":15,"risiko":-10}},{"id":"o3","label":"Tunda laporan sampai semua cabang benar-benar sinkron manual","konsekuensi":"Rapat direksi jalan tanpa data lengkap, keputusan strategis jadi kurang akurat.","dampak":{"efisiensi":-25,"biaya":0,"risiko":20}}]}'),
('sc-erp-sdm','erp-sdm','erp-decision','{"situasi":"Musim akhir tahun, pengajuan cuti karyawan melonjak dan tim HR kewalahan mengecek sisa cuti tiap orang secara manual.","opsi":[{"id":"o1","label":"Tetap proses manual, HR kerja lembur untuk mengejar antrian","konsekuensi":"Beberapa pengajuan cuti disetujui melebihi sisa kuota karena human error, HR jadi kelelahan.","dampak":{"efisiensi":-15,"biaya":-10,"risiko":15}},{"id":"o2","label":"Aktifkan modul self-service cuti otomatis di ERP","konsekuensi":"Karyawan bisa cek sisa cuti & ajukan sendiri, sistem otomatis validasi kuota. HR tinggal approve, waktu proses turun drastis.","dampak":{"efisiensi":25,"biaya":10,"risiko":-10}},{"id":"o3","label":"Bekukan pengajuan cuti sementara sampai musim sibuk lewat","konsekuensi":"Karyawan kecewa, kepuasan kerja turun, beberapa memilih ambil cuti mendadak tanpa izin.","dampak":{"efisiensi":-10,"biaya":0,"risiko":10}}]}'),
('sc-audit-kepatuhan','audit-kepatuhan','audit-checklist','{"konteks":"Kamu ditugaskan mengaudit proses akses data pelanggan di sebuah aplikasi internal. Centang praktik yang SUDAH diterapkan tim pengembang berdasarkan dokumen yang kamu terima.","ambangAman":75,"item":[{"id":"i1","label":"Setiap akses data pelanggan tercatat dalam log audit","kategori":"Pencatatan","berisikoJikaTidakDicentang":true},{"id":"i2","label":"Password disimpan dalam bentuk terenkripsi (hashed)","kategori":"Keamanan","berisikoJikaTidakDicentang":true},{"id":"i3","label":"Ada pemisahan hak akses antara staf biasa dan admin","kategori":"Kontrol Akses","berisikoJikaTidakDicentang":true},{"id":"i4","label":"Dokumentasi kebijakan privasi diperbarui tahun ini","kategori":"Dokumentasi","berisikoJikaTidakDicentang":false},{"id":"i5","label":"Ada mekanisme hapus data atas permintaan pelanggan","kategori":"Kepatuhan Data","berisikoJikaTidakDicentang":true}]}'),
('sc-audit-temuan-risiko','audit-temuan-risiko','audit-checklist','{"konteks":"Sebuah sistem baru akan diluncurkan minggu depan. Centang kontrol keamanan yang sudah terbukti ada di sistem berdasarkan hasil wawancaramu dengan tim developer.","ambangAman":70,"item":[{"id":"i1","label":"Sudah ada uji penetrasi (penetration test) sebelum rilis","kategori":"Keamanan","berisikoJikaTidakDicentang":true},{"id":"i2","label":"Server produksi dipisah dari server development","kategori":"Infrastruktur","berisikoJikaTidakDicentang":true},{"id":"i3","label":"Ada rencana backup & pemulihan bencana (disaster recovery)","kategori":"Kontinuitas","berisikoJikaTidakDicentang":true},{"id":"i4","label":"Tim sudah dilatih menangani insiden keamanan","kategori":"Kesiapan Tim","berisikoJikaTidakDicentang":false}]}'),
('sc-audit-laporan','audit-laporan','audit-checklist','{"konteks":"Audit sistem HR selesai dilakukan. Centang rekomendasi yang paling relevan untuk dimasukkan ke laporan akhir berdasarkan temuan di lapangan.","ambangAman":60,"item":[{"id":"i1","label":"Rekomendasikan rotasi password berkala untuk akun admin HR","kategori":"Rekomendasi","berisikoJikaTidakDicentang":true},{"id":"i2","label":"Rekomendasikan pelatihan kesadaran keamanan untuk staf HR","kategori":"Rekomendasi","berisikoJikaTidakDicentang":true},{"id":"i3","label":"Ganti seluruh sistem HR meski belum ada bukti kebocoran","kategori":"Rekomendasi","berisikoJikaTidakDicentang":false},{"id":"i4","label":"Tetapkan jadwal audit ulang setiap 6 bulan","kategori":"Rekomendasi","berisikoJikaTidakDicentang":true}]}'),
('sc-data-bersihkan','data-bersihkan','data-clean','{"judul":"Data penjualan semen per toko, bulan lalu","kolom":["Toko","Unit Terjual","Harga Satuan (Rp)"],"baris":[{"id":"r1","data":{"Toko":"Toko Makmur","Unit Terjual":120,"Harga Satuan (Rp)":65000}},{"id":"r2","data":{"Toko":"toko sejahtera ","Unit Terjual":"95","Harga Satuan (Rp)":65000},"kolomKotor":["Toko","Unit Terjual"],"perbaikan":{"Toko":"Toko Sejahtera","Unit Terjual":95}},{"id":"r3","data":{"Toko":"Toko Barokah","Unit Terjual":-5,"Harga Satuan (Rp)":65000},"kolomKotor":["Unit Terjual"],"perbaikan":{"Unit Terjual":0}},{"id":"r4","data":{"Toko":"TOKO JAYA","Unit Terjual":210,"Harga Satuan (Rp)":"65rb"},"kolomKotor":["Toko","Harga Satuan (Rp)"],"perbaikan":{"Toko":"Toko Jaya","Harga Satuan (Rp)":65000}},{"id":"r5","data":{"Toko":"Toko Amanah","Unit Terjual":150,"Harga Satuan (Rp)":65000}}]}'),
('sc-data-visualisasi','data-visualisasi','data-chart','{"judul":"Total unit terjual per toko (setelah data dibersihkan)","satuan":"unit","kategori":[{"label":"Toko Makmur","nilai":120},{"label":"Toko Sejahtera","nilai":95},{"label":"Toko Barokah","nilai":0},{"label":"Toko Jaya","nilai":210},{"label":"Toko Amanah","nilai":150}]}'),
('sc-data-kesimpulan','data-kesimpulan','data-insight','{"pertanyaan":"Berdasarkan grafik penjualan, rekomendasi apa yang paling tepat untuk tim sales bulan depan?","opsi":[{"id":"o1","label":"Fokuskan promosi tambahan ke Toko Jaya karena sudah paling laris","benar":false,"penjelasan":"Toko yang sudah tinggi penjualannya bukan prioritas utama untuk tambahan promosi — potensi kenaikannya lebih kecil dibanding toko yang tertinggal."},{"id":"o2","label":"Selidiki Toko Barokah (0 unit) dan berikan dukungan/promosi khusus","benar":true,"penjelasan":"Tepat! Toko dengan penjualan 0 unit menandakan ada masalah (stok kosong, lokasi kurang ramai, atau kesalahan pencatatan) yang perlu ditindaklanjuti lebih dulu."},{"id":"o3","label":"Tutup saja Toko Barokah karena dianggap tidak menguntungkan","benar":false,"penjelasan":"Terlalu cepat mengambil keputusan drastis dari satu bulan data. Perlu digali dulu penyebabnya sebelum memutuskan menutup toko."}]}')
on conflict (id) do nothing;

-- faq_items
insert into faq_items (kategori, pertanyaan, jawaban)
select v.kategori, v.pertanyaan, v.jawaban
from (values
('PMB','Bagaimana cara mendaftar ke Sistem Informasi UISI?','Pendaftaran dilakukan sepenuhnya secara online lewat portal resmi PMB UISI di pmb.uisi.ac.id. Kamu bisa memilih Program Studi Sistem Informasi saat mengisi formulir pendaftaran.'),
('PMB','Jalur masuk apa saja yang tersedia?','UISI umumnya membuka beberapa jalur seperti jalur prestasi/rapor, jalur tes tulis, dan jalur mandiri. Jadwal dan syarat tiap jalur bisa berbeda tiap periode, jadi pastikan cek info terbaru langsung di pmb.uisi.ac.id.'),
('Kurikulum','Apa bedanya Sistem Informasi dengan Teknik Informatika?','Sistem Informasi lebih fokus pada bagaimana teknologi digunakan untuk menyelesaikan masalah bisnis dan organisasi, sementara Teknik Informatika lebih fokus pada pengembangan teknologi itu sendiri. Di SI UISI, kamu belajar keduanya lewat tiga peminatan.'),
('Kurikulum','Kapan mahasiswa memilih peminatan?','Mahasiswa mengambil mata kuliah dasar SI di semester awal, lalu mulai memperdalam salah satu dari tiga peminatan pada semester-semester berikutnya.'),
('Kurikulum','Apakah prodi ini punya akreditasi?','Ya, Program Studi Sistem Informasi UISI telah terakreditasi Baik Sekali oleh LAM INFOKOM.'),
('Beasiswa','Apakah ada beasiswa untuk mahasiswa baru?','UISI, sebagai bagian dari Semen Indonesia Group, umumnya menyediakan beberapa skema beasiswa/keringanan biaya kuliah. Detail terbaru bisa dicek di pmb.uisi.ac.id.'),
('Beasiswa','Bagaimana cara mengajukan beasiswa?','Pengajuan beasiswa biasanya dilakukan bersamaan dengan proses pendaftaran atau lewat formulir terpisah yang diumumkan di portal PMB UISI.'),
('PMB','Apakah lulusan SMK boleh mendaftar ke Sistem Informasi?','Boleh. Program Studi Sistem Informasi terbuka untuk lulusan SMA/MA semua jurusan maupun SMK.')
) as v(kategori, pertanyaan, jawaban)
where not exists (select 1 from faq_items);

-- testimonials
insert into testimonials (nama, jabatan_perusahaan, kutipan)
select v.nama, v.jabatan_perusahaan, v.kutipan
from (values
('Dimas Ardiansyah','IT Auditor, Kantor Akuntan Publik','Materi tata kelola & audit sistem yang saya pelajari langsung terpakai waktu magang. Saya jadi lebih percaya diri mengaudit sistem klien sejak semester akhir.'),
('Nabila Putri Ramadhani','ERP Consultant, Perusahaan Manufaktur','Belajar Enterprise System di sini bukan cuma teori. Saya sempat ikut simulasi implementasi modul inventaris yang mirip dengan kerjaan saya sekarang.'),
('Fajar Nur Hidayat','Data Analyst, Perusahaan E-commerce','Skill mengolah dan memvisualisasikan data yang saya asah jadi modal utama saya lolos seleksi data analyst.'),
('Sarah Wulandari','Business Process Analyst','Dosen-dosennya terbuka untuk diskusi dan banyak proyek berbasis studi kasus nyata.')
) as v(nama, jabatan_perusahaan, kutipan)
where not exists (select 1 from testimonials);

-- achievements
insert into achievements (judul, deskripsi, tahun)
select v.judul, v.deskripsi, v.tahun
from (values
('Finalis GEMASTIK — Divisi Penambangan Data','Tim mahasiswa Sistem Informasi UISI lolos ke babak final kompetisi teknologi mahasiswa tingkat nasional GEMASTIK.',2025),
('Juara Studi Kasus ERP Tingkat Regional','Mahasiswa peminatan Enterprise System meraih juara dalam kompetisi studi kasus implementasi sistem ERP antar-universitas.',2025),
('Best Paper — Seminar Nasional Sistem Informasi','Riset mahasiswa tentang tata kelola keamanan data terpilih sebagai salah satu makalah terbaik di seminar nasional.',2024),
('Juara Data Visualization Challenge','Tim dari peminatan Data Science menyabet juara dalam tantangan visualisasi data tingkat mahasiswa se-Jawa Timur.',2024)
) as v(judul, deskripsi, tahun)
where not exists (select 1 from achievements);

