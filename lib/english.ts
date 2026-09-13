export const ENGLISH_ASPECTS = ["Listening", "Reading", "Speaking", "Writing", "Grammar", "Vocabulary", "Evaluation"] as const;
export type EnglishAspect = (typeof ENGLISH_ASPECTS)[number];

export const ASPECT_GUIDANCE: Record<EnglishAspect, string> = {
  Listening:
    "Start watching or listening to English podcast/vlog/anything, summarize it > 1 video/day. Try BBC's \"The English We Speak\".",
  Reading:
    "Start reading English books, take notes on new vocabulary, find the main idea, increase difficulty over time. Also try Breaking News English for practice.",
  Speaking: "Try talking with Miss Eve in English, take notes from her. Or start a conversation with a native speaker using AI.",
  Writing: "Improve your English on business deck presentations, check with an AI. Also try writing an essay about your 5-year plan.",
  Grammar:
    "Know your grammar level and difficulty, deep-dive via British Council or Duolingo — future tenses, conditionals, 'I wish'/'if only'/'used to', passive voice.",
  Vocabulary: "Take note of 5–7 new words/day, then make 5–10 sentences using them.",
  Evaluation: "Evaluate the past month's progress, identify your difficulty, and repeat practice on that specific aspect.",
};
