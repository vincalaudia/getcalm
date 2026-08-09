import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from("student_sessions")
    .insert({
      student_name: "Test Student",
      class_code: "TEST1",
      game_mode: "NORMAL",
      focus_battery_final: 100,
      fact_score_final: 0,
      correct_guesses: 0,
      incorrect_guesses: 0,
      total_likes: 0,
      total_shares: 0,
      hoax_reports: 0,
      ai_reports: 0,
      most_watched_seconds: 0,
      quiz_score: 0,
      total_score: 0,
      true_positives: 0,
      false_positives: 0,
      true_negatives: 0,
      false_negatives: 0
    })
    .select("id")
    .single();

  console.log("Insert result:", { data, error });

  if (data?.id) {
    const { error: updateError } = await supabase
      .from("student_sessions")
      .update({ focus_battery_final: 50 })
      .eq("id", data.id);
    console.log("Update error:", updateError);
  }
}
run();
