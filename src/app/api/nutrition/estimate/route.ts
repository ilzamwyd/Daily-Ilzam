import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MODEL = "claude-haiku-4-5-20251001"; // fast + cheap is fine for a single-number estimate

const SYSTEM_PROMPT = `You help someone log food quickly by giving a rough calorie estimate for a home-cooked
or everyday dish they describe, often in Indonesian. This is for casual personal tracking, not medical or
clinical nutrition advice — always a reasonable ballpark, not a precise lab figure.

Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{ "calories": <integer, best estimate for ONE typical serving as described>, "serving_label": "<short label, e.g. '1 piring' or '1 porsi'>" }

If the description already specifies a quantity (e.g. "2 potong ayam goreng"), estimate for that exact
described quantity and set serving_label to describe it (e.g. "2 potong"). Keep the estimate reasonable
and typical — do not hedge with a range, pick one number.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set on the server." }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { description } = await req.json();
  if (!description || typeof description !== "string" || description.trim().length < 2) {
    return NextResponse.json({ error: "Describe the food first." }, { status: 400 });
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
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: description }],
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

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: `Request failed: ${(err as Error).message}` }, { status: 500 });
  }
}
