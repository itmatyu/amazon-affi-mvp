// src/app/api/store/generate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

function extractASIN(url: string) {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
}

function makeSlug() {
  return `store-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const { storeName, targetTag, urls } = await req.json();

    if (!storeName || !targetTag || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: false, error: "invalid input" }, { status: 400 });
    }

    const slug = makeSlug();

    // 1) ストア作成（下書き）
    const { error: storeErr } = await supabase.from("stores").insert({
      slug,
      name: storeName,
      target_tag: targetTag,
      intro: `「${targetTag}」向けにセレクトしたストアです。`,
      status: "draft",
    });
    if (storeErr) throw storeErr;

    // 2) 商品作成
    for (let i = 0; i < urls.length; i++) {
      const asin = extractASIN(urls[i]);
      if (!asin) continue;

      const affiliateUrl = `https://www.amazon.co.jp/dp/${asin}/?tag=amazonaffimvp-22`;

      await supabase.from("store_items").insert({
        store_slug: slug,
        asin,
        body_html: `
<p>シンプルで使いやすく、大人の普段着にちょうどいいアイテム。</p>
<p>着回ししやすく、清潔感のある印象を作りやすいのが特徴です。</p>
        `,
        affiliate_url: affiliateUrl,
        sort_order: i,
      });
    }

    return NextResponse.json({ ok: true, storeSlug: slug });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}