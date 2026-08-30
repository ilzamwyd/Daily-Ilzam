import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Uses your own Anthropic API key (server-side only — never exposed to the browser).
// Get a key at https://console.anthropic.com, then add it in Vercel as ANTHROPIC_API_KEY.
// Swap the model below for "claude-haiku-4-5-20251001" if you want a cheaper/faster option;
// claude-sonnet-5 tends to do better at picking out names and dates buried in messy notes.
const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are helping someone turn rough meeting notes (often typed fast, in a mix of Indonesian and English, sometimes dictated) into a clean Minutes of Meeting.

Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "summary": "2-4 sentence plain-language summary of what was discussed and decided",
  "action_items": [
    { "description": "clear, specific action", "assignee": "person's name if mentioned (e.g. PIC Shifa), otherwise null", "deadline": "YYYY-MM-DD if a date/deadline is mentioned or clearly implied, otherwise null" }
  ]
}

Rules:
- Pull out every distinct follow-up action mentioned, including ones written like "PIC Name" or "[DL 28 Juli 2026]".
- If no year is given for a deadline, assume the current year unless the date has clearly already passed, in which case assume next year.
- If notes are in Indonesian, you may summarize in Indonesian to match; otherwise use English.
- If there are no clear action items, return an empty array — do not invent ones.`;

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

  const { rawNotes, title } = await req.json();
  if (!rawNotes || typeof rawNotes !== "string" || rawNotes.trim().length < 5) {
    return NextResponse.json({ error: "Notes are too short to summarize." }, { status: 400 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Today's date is ${today}. Meeting title: "${title || "Untitled meeting"}".\n\nRaw notes:\n${rawNotes}`,
          },
        ],
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
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: { summary: string; action_items: { description: string; assignee: string | null; deadline: string | null }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Could not parse the AI response. Try again." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: `Request failed: ${(err as Error).message}` }, { status: 500 });
  }
}
