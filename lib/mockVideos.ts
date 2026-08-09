/**
 * lib/mockVideos.ts
 *
 * Hardcoded sample video data for the prototype.
 * Used as fallback when Supabase is not configured (no .env.local),
 * or when the DB fetch fails. Swap these Google sample videos for your
 * own Supabase Storage URLs once the DB is set up.
 *
 * The battery focus mechanism (startVideoTimer / deductFocusTimer) is
 * exercised by these videos — durasi_total drives Set-A/B thresholds.
 */
import type { VideoRow } from "./types";

export const MOCK_VIDEOS: VideoRow[] = [
  {
    id: "mock-1",
    author_username: "@beritakita_id",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    caption:
      "Pemerintah resmi meluncurkan program makan siang gratis untuk 82 juta pelajar SD dan SMP mulai tahun ajaran baru. Program ini sudah diverifikasi oleh Kementerian Pendidikan. ✅",
    category: "Real News",
    ai_clue:
      "Video ini tidak menunjukkan tanda-tanda rekayasa AI. Wajah pembicara bergerak natural, tidak ada glitch aneh di tepi tubuh atau rambut, dan suaranya konsisten. Ini adalah rekaman nyata dari konferensi pers resmi.",
    ai_clue_image_url: null,
    real_fact:
      "Benar! Pemerintah memang meluncurkan program makan siang bergizi gratis (MBG) melalui Badan Gizi Nasional. Datanya bisa kamu cek di situs resmi bgn.go.id.",
    real_fact_image_url: null,
    reveal_message:
      "Kamu sedang melihat berita asli yang sudah terverifikasi! Menyebarkan informasi yang benar adalah tindakan yang sangat bertanggung jawab. 💪",
    durasi_total: 28,
    initial_likes: 15420,
    initial_shares: 3210,
  },
  {
    id: "mock-2",
    author_username: "@kucing_lucu",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    caption:
      "Kucing oranye ini SELALU masuk kantong belanja sendiri setiap habis belanja. Tingkahnya bikin ngakak setiap hari! 😂🛍️ #kucing #cat #lucu",
    category: "Entertainment Non AI",
    ai_clue:
      "Video ini adalah rekaman kucing sungguhan, bukan hasil AI. Bulu dan gerakan kucingnya tampak alami, tidak ada distorsi pada ekor atau telinga yang biasanya muncul pada hewan hasil AI generator.",
    ai_clue_image_url: null,
    real_fact:
      "Ini adalah video kucing viral yang asli dari pemiliknya di Bandung. Tidak ada unsur hoaks atau rekayasa digital di sini — murni hiburan lucu!",
    real_fact_image_url: null,
    reveal_message:
      "Video hiburan yang menyenangkan dan asli! Tidak ada yang perlu dikhawatirkan di sini. Nikmati saja kelucuan si kucing! 🐱",
    durasi_total: 45,
    initial_likes: 189000,
    initial_shares: 45000,
  },
  {
    id: "mock-3",
    author_username: "@ai_seni",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    caption:
      "AI bikin Monas jadi istana kristal di tahun 3000! Keren banget kan? ✨ #AIart #Monas #future #aigenerated",
    category: "Entertainment AI",
    ai_clue:
      "Video ini 100% dibuat oleh AI! Perhatikan: tekstur kaca terlalu sempurna dan mengkilap, tidak ada manusia di sekitarnya, dan transisi antar frame terasa 'glitchy' seperti ciri khas video AI generator.",
    ai_clue_image_url: null,
    real_fact:
      "Ini adalah konten yang dibuat menggunakan AI video generator seperti Sora atau Runway. Kreatornya sudah jujur mencantumkan #aigenerated. Konten AI untuk hiburan itu boleh, asal jujur!",
    real_fact_image_url: null,
    reveal_message:
      "Kamu berhasil mengenali konten AI yang dibuat untuk tujuan hiburan! Konten AI yang jujur dan kreatif itu oke-oke saja. 🤖✨",
    durasi_total: 18,
    initial_likes: 55000,
    initial_shares: 8900,
  },
  {
    id: "mock-4",
    author_username: "@berita_viral99",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    caption:
      "BREAKING! Presiden umumkan sekolah libur 2 bulan mulai besok karena ada badai matahari! Semua siswa wajib di rumah! ⚠️🌞",
    category: "AI Hoax",
    ai_clue:
      "Waspada! Ada banyak tanda AI di sini: bibir pembicara tidak sinkron dengan suaranya (lip sync error), tepi rambut tampak blur dan tidak natural, dan ekspresi wajah terasa kaku seperti robot.",
    ai_clue_image_url: null,
    real_fact:
      "Ini adalah HOAKS berbahaya! Tidak ada pengumuman resmi mengenai libur sekolah karena badai matahari. Informasi resmi dari Kemendikbud selalu diumumkan melalui kanal resmi, bukan video viral seperti ini.",
    real_fact_image_url: null,
    reveal_message:
      "Kamu baru saja melihat deepfake berbahaya! Video ini dibuat AI untuk menyebarkan informasi palsu. Selalu cek informasi ke sumber resmi! 🔍",
    durasi_total: 32,
    initial_likes: 95000,
    initial_shares: 78000,
  },
  {
    id: "mock-5",
    author_username: "@sehat_alami",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    caption:
      "PENTING! Minum air rebusan bawang putih 7 siung setiap hari bisa sembuhkan kanker stadium 4 dalam 3 minggu! Dokter tidak mau kasih tau ini! 🧄",
    category: "Hoax",
    ai_clue:
      "Video ini tidak menggunakan AI untuk membuat konten, tapi informasinya tetap berbahaya. Tidak ada watermark AI, tapi klaim medisnya tidak memiliki dasar ilmiah sama sekali.",
    ai_clue_image_url: null,
    real_fact:
      "Ini adalah HOAKS kesehatan yang sangat berbahaya! Tidak ada makanan atau minuman tunggal yang bisa menyembuhkan kanker. Selalu konsultasi dengan dokter asli!",
    real_fact_image_url: null,
    reveal_message:
      "Awas, informasi kesehatan palsu seperti ini bisa membahayakan jiwa! Bawang putih memang sehat, tapi tidak bisa menyembuhkan kanker. ⚠️",
    durasi_total: 40,
    initial_likes: 67000,
    initial_shares: 52000,
  },
  {
    id: "mock-6",
    author_username: "@sains_anak",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    caption:
      "Ilmuwan BRIN berhasil kembangkan vaksin demam berdarah dengue buatan Indonesia! Uji klinis fase 3 sudah selesai dan hasilnya memuaskan. 🇮🇩🔬",
    category: "Real News",
    ai_clue:
      "Tidak ada indikasi AI generatif di sini. Rekaman laboratorium menunjukkan detail realistis seperti bayangan dan tekstur permukaan yang natural.",
    ai_clue_image_url: null,
    real_fact:
      "Faktanya memang benar! BRIN sedang mengembangkan vaksin dengue lokal. Ini merupakan pencapaian besar untuk sains Indonesia.",
    real_fact_image_url: null,
    reveal_message:
      "Kabar ilmu pengetahuan yang membanggakan ini 100% nyata! Kamu sudah membantu menyebarkan berita baik. ⭐️",
    durasi_total: 35,
    initial_likes: 22100,
    initial_shares: 4890,
  },
  {
    id: "mock-7",
    author_username: "@nusantara_ai",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    caption:
      "Coba bayangin kalau hewan mitologi Nusantara kayak Garuda dan Naga Baru Klinting hidup di dunia modern! 🐉 #AIart #mitologi",
    category: "Entertainment AI",
    ai_clue:
      "Ini adalah ilustrasi yang dibuat AI! Tanda-tandanya: bulu Garuda terlalu simetris dan sempurna, mata hewan tampak 'kosong' khas AI, dan warna latar belakang terlalu gradient tanpa noise alami.",
    ai_clue_image_url: null,
    real_fact:
      "Ini adalah karya seni AI yang kreatif dan terinspirasi dari mitologi Indonesia. Kreatornya menggunakannya untuk tujuan edukasi budaya.",
    real_fact_image_url: null,
    reveal_message:
      "Hebat! Kamu bisa membedakan seni AI dari gambar asli. Karya AI untuk mengeksplorasi budaya seperti ini termasuk penggunaan AI yang positif! 🏆",
    durasi_total: 25,
    initial_likes: 43000,
    initial_shares: 7200,
  },
  {
    id: "mock-8",
    author_username: "@hot_news_id",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    caption:
      "VIRAL! Ilmuwan temukan dinosaurus hidup di hutan Kalimantan! Sudah difilmkan oleh penduduk setempat. Pemerintah berusaha merahasiakan ini! 🦕🌿",
    category: "AI Hoax",
    ai_clue:
      "Video ini BUKAN rekaman nyata! Tanda-tanda AI yang jelas: dinosaurus tampak terlalu sempurna seperti CGI film Hollywood, pergerakannya tidak natural, dan tidak ada bayangan yang konsisten.",
    ai_clue_image_url: null,
    real_fact:
      "Dinosaurus sudah punah 66 juta tahun yang lalu. Video ini dibuat menggunakan AI video generator untuk menciptakan sensasi palsu.",
    real_fact_image_url: null,
    reveal_message:
      "Video dinosaurus ini kelihatan keren ya? Tapi ini adalah kreasi AI yang sengaja dibuat untuk menyesatkan! 🦕❌",
    durasi_total: 29,
    initial_likes: 234000,
    initial_shares: 167000,
  },
];
