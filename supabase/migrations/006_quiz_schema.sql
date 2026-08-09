-- =============================================================================
-- ThinkTok — Quiz Schema (006)
-- Run this in the Supabase SQL Editor.
-- =============================================================================

-- 1. Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for quiz_questions
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active quiz questions
CREATE POLICY "Anyone can read active quiz questions" ON quiz_questions
  FOR SELECT USING (is_active = true);

-- 2. Insert initial seed data
INSERT INTO quiz_questions (id, question, options, correct_index, explanation, is_active)
VALUES
(1, 'Apa ciri paling umum dari video deepfake yang dibuat AI?', '["Kualitas gambarnya selalu buram", "Gerakan bibir tidak sinkron dengan suara", "Videonya pasti hitam putih", "Selalu ada watermark AI di pojok layar"]', 1, 'Deepfake AI sering gagal mensinkronkan gerakan bibir dengan audio. Ini adalah salah satu cara termudah mendeteksi video palsu!', true),
(2, 'Kamu menerima pesan berantai yang bilang ''bagikan ke 10 orang atau sial 7 tahun''. Apa yang sebaiknya kamu lakukan?', '["Langsung dibagikan agar tidak sial", "Tanya teman dulu baru dibagikan", "Tidak dibagikan — ini adalah teknik manipulasi hoaks", "Simpan saja tapi jangan dibagikan ke siapa-siapa"]', 2, 'Ancaman sial atau janji keberuntungan adalah teknik klasik untuk memaksa orang menyebarkan hoaks. Pesan asli tidak perlu ancaman seperti ini!', true),
(3, 'Mana yang BUKAN merupakan cara yang baik untuk memverifikasi informasi?', '["Cek di situs berita resmi seperti ANTARA atau Kompas", "Lihat apakah banyak teman yang sudah share", "Cari di situs fact-checker seperti Cekfakta.com", "Baca laporan resmi dari pemerintah atau lembaga terpercaya"]', 1, 'Banyaknya yang share TIDAK menjamin kebenaran informasi. Hoaks justru sering viral! Selalu cek ke sumber terpercaya.', true),
(4, 'Sebuah foto menunjukkan banjir besar di Jakarta dengan ribuan orang terjebak. Foto yang sama ternyata diambil dari bencana di negara lain tahun 2010. Ini termasuk jenis hoaks apa?', '["Hoaks buatan AI (deepfake)", "Hoaks konteks yang salah (misleading context)", "Hoaks konten yang dibuat-buat", "Ini bukan hoaks, hanya kesalahan kecil"]', 1, 'Foto asli yang digunakan dengan konteks yang salah disebut ''misleading context''. Ini adalah jenis hoaks yang sangat umum karena fotonya nyata tapi informasinya menyesatkan.', true),
(5, 'AI seperti ChatGPT dan Gemini bisa membuat teks, gambar, dan video. Manakah pernyataan yang BENAR tentang konten AI?', '["Semua konten AI pasti berbahaya dan harus dihindari", "Konten AI yang diberi label jujur bisa bermanfaat dan kreatif", "AI tidak bisa membuat konten yang terlihat nyata", "Hanya orang dewasa yang bisa membuat konten AI"]', 1, 'Konten AI tidak selalu buruk! Yang penting adalah kejujuran — konten AI yang diberi label dengan benar bisa sangat kreatif dan bermanfaat. Yang berbahaya adalah AI yang digunakan untuk menipu.', true)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  explanation = EXCLUDED.explanation,
  is_active = EXCLUDED.is_active;

-- 3. Update student_quiz_answers to track selected_index
ALTER TABLE student_quiz_answers
ADD COLUMN IF NOT EXISTS selected_index INTEGER;
