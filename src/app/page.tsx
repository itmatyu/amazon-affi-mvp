import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>To get started, edit the page.tsx file.</h1>
          <p>
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className={styles.secondary}
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}

// src/app/store/[slug]/page.tsx
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // 常に最新を表示

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function StorePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  // ストア情報
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .single();

  if (storeErr || !store) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>ストアが見つかりません</h1>
        <p>slug: {slug}</p>
      </main>
    );
  }

  // 商品一覧
  const { data: items, error: itemsErr } = await supabase
    .from("store_items")
    .select("*")
    .eq("store_slug", slug)
    .order("sort_order", { ascending: true });

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 860, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>{store.name}</h1>
        <p style={{ margin: "8px 0 0", color: "#555" }}>
          ターゲット：{store.target_tag}
        </p>
        {store.intro ? (
          <p style={{ margin: "10px 0 0", lineHeight: 1.7 }}>{store.intro}</p>
        ) : null}
        <p style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
          状態：{store.status}
        </p>
      </header>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>商品一覧</h2>

        {itemsErr ? (
          <p style={{ color: "crimson" }}>商品取得エラー: {itemsErr.message}</p>
        ) : null}

        {(!items || items.length === 0) && !itemsErr ? (
          <p>商品がまだありません。</p>
        ) : null}

        <div style={{ display: "grid", gap: 12 }}>
          {items?.map((it) => (
            <article
              key={it.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#777" }}>ASIN: {it.asin}</div>
                  <h3 style={{ margin: "6px 0 0", fontSize: 16 }}>
                    {it.title || "おすすめアイテム"}
                  </h3>
                </div>

                <a
                  href={it.affiliate_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "black",
                    color: "white",
                    padding: "10px 14px",
                    borderRadius: 10,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    height: "fit-content",
                  }}
                >
                  Amazonで見る →
                </a>
              </div>

              {it.body_html ? (
                <div
                  style={{ marginTop: 10, lineHeight: 1.7, color: "#333" }}
                  dangerouslySetInnerHTML={{ __html: it.body_html }}
                />
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}