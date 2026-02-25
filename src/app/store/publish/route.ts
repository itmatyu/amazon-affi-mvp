// src/app/api/store/publish/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { storeSlug } = await req.json();
    if (!storeSlug) {
      return NextResponse.json({ ok: false, error: "storeSlug required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("stores")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("slug", storeSlug);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      publishedUrl: `http://localhost:3000/store/${storeSlug}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}