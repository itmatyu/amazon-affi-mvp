import { NextResponse } from "next/server";
import { paapiGetItems } from "@/lib/paapi";
import { supabase } from "@/lib/supabase";

function countImages(item: any) {
  const primary = item?.Images?.Primary?.Large ? 1 : 0;
  const variants = Array.isArray(item?.Images?.Variants)
    ? item.Images.Variants.length
    : 0;
  return primary + variants;
}

function getTitle(item: any) {
  return item?.ItemInfo?.Title?.DisplayValue ?? null;
}

function getBullets(item: any): string[] {
  const f = item?.ItemInfo?.Features?.DisplayValues;
  return Array.isArray(f) ? f.slice(0, 6) : [];
}

function getPrice(item: any) {
  const price = item?.Offers?.Listings?.[0]?.Price;
  if (!price) return { amount: null, currency: null, display: null };
  return {
    amount: price.Amount ?? null,
    currency: price.Currency ?? null,
    display: price.DisplayAmount ?? null,
  };
}

export async function POST(req: Request) {
  const { asin } = await req.json();

  if (!asin) {
    return NextResponse.json(
      { ok: false, error: "asin required" },
      { status: 400 }
    );
  }

  const json = await paapiGetItems([String(asin).toUpperCase()]);
  const item = json?.ItemsResult?.Items?.[0];

  if (!item) {
    return NextResponse.json(
      { ok: false, error: "商品が取得できませんでした" },
      { status: 502 }
    );
  }

  const title = getTitle(item);
  const bullets = getBullets(item);
  const imgCount = countImages(item);
  const price = getPrice(item);
  const detailUrl = item?.DetailPageURL ?? null;

  const { data, error } = await supabase
    .from("items")
    .insert({
      asin: String(asin).toUpperCase(),
      marketplace: process.env.PAAPI_MARKETPLACE || "www.amazon.co.jp",
      title,
      price_amount: price.amount,
      currency: price.currency,
      image_count: imgCount,
      detail_page_url: detailUrl,
      raw_json: json,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    item: {
      id: data.id,
      asin: data.asin,
      title,
      bullets,
      imageCount: imgCount,
      priceText: price.display,
      detailPageUrl: detailUrl,
    },
  });
}