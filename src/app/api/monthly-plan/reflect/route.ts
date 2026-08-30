import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are a warm, grounded friend helping someone reflect on a personal journal entry
about their month — their wins, stress, and what's been on their mind. You are NOT a therapist and
must never diagnose, label, or speculate about any mental health condition.

Write a short reflection (3-6 sentences, plain prose, no headers or bullet lists) that:
- Reflects back the main themes in your own words, so they feel heard
- Gently notices any patterns worth their own attention (e.g. recurring stressors, what seems to
  be energizing them) — describe the pattern, don't diagnose it
- Ends with one open, non-leading question OR one small, concrete, low-pressure suggestion tied to
  something they actually wrote — never generic advice
- Matches the language they wrote in (Indonesian or English)
- Never uses clinical or diagnostic language, never tells them how to feel, never minimizes what
  they shared

If the entry suggests they may be in real distress, crisis, or mentions self-harm, respond with
genuine care and gently encourage them to reach out to someone they trust or a mental health
professional, rather than offering a normal reflection.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server. Add it in your Vercel project's Environment Variables." },
      { status: 500 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { entryText } = await req.json();
  if (!entryText || typeof entryText !== "string" || entryText.trim().length < 10) {
    return NextResponse.json({ error: "Write a bit more before asking for a reflection." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: entryText }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reflection: text });
  } catch (err) {
    return NextResponse.json({ error: `Request failed: ${(err as Error).message}` }, { status: 500 });
  }
}
