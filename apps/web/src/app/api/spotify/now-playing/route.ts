import { NextResponse } from "next/server";
import { SpotifyApiError } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";

/** Polling do player no navegador — sempre dados frescos, nunca cacheado. */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const source = await getSpotifySource();
  if (!source) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });

  try {
    return NextResponse.json({ nowPlaying: await source.getNowPlaying() }, { headers });
  } catch (error) {
    const kind = error instanceof SpotifyApiError ? error.kind : "unknown";
    return NextResponse.json({ error: kind }, { status: 502, headers });
  }
}
