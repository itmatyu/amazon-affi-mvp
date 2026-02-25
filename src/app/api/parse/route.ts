import { NextResponse } from "next/server";
import { extractASIN } from "@/lib/asin";

export async function POST(req: Request) {
  const { url } = await req.json();

  const asin = extractASIN(String(url || ""));
  if (!asin) {
    return NextResponse.json(
      { ok: false, error: "ASINを抽出できませんでした" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, asin });
}