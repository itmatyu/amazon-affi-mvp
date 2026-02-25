import { createClient } from "@supabase/supabase-js";

// ────────────────────────────────────────────
// Supabase
// ────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
type Store = {
  slug: string;
  name: string;
  description?: string;
};

type StoreItem = {
  id: string;
  asin: string;
  title?: string;
  affiliate_url: string;
  image_url?: string;
  main_image_url?: string;
  images?: { url: string }[] | string[];
  sort_order: number;
};

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────
function resolveImage(item: StoreItem): string | null {
  if (item.image_url) return item.image_url;
  if (item.main_image_url) return item.main_image_url;
  const first = item.images?.[0];
  if (!first) return null;
  return typeof first === "string" ? first : first.url;
}

// ────────────────────────────────────────────
// Page
// ────────────────────────────────────────────
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Store>();

  if (!store) return null;

  const { data: items } = await supabase
    .from("store_items")
    .select("*")
    .eq("store_slug", slug)
    .order("sort_order", { ascending: true })
    .returns<StoreItem[]>();

  return (
    <>
      <style>{styles}</style>
      <div className="page">

        <header className="header">
          <div className="header-eyebrow">SELECT ITEMS</div>
          <h1 className="header-title">{store.name}</h1>
          {store.description && (
            <p className="header-desc">{store.description}</p>
          )}
          <div className="header-rule" />
        </header>

        {items && items.length > 0 && (
          <ul className="grid">
            {items.map((item, i) => {
              const title = item.title ?? item.asin;
              const img = resolveImage(item);
              const isFeature = i === 0;

              return (
                <li
                  key={item.id}
                  className={`card ${isFeature ? "card--feature" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <a
                    href={item.affiliate_url}
                    target="_blank"
                    rel="noreferrer"
                    className="card-link"
                  >
                    <div className="card-image-wrap">
                      {img ? (
                        <img src={img} alt={title} className="card-image" />
                      ) : (
                        <div className="card-image-placeholder">NO IMAGE</div>
                      )}
                      <div className="card-overlay">
                        <span className="card-overlay-text">Amazonで見る →</span>
                      </div>
                      {isFeature && (
                        <div className="card-badge">PICK UP</div>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="card-index">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <p className="card-title">{title}</p>
                      <div className="card-cta">Amazon →</div>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="footer">
          <p>© {store.name}</p>
        </footer>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Noto+Sans+JP:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #f5f2ec;
    --ink: #1a1714;
    --muted: #7a756e;
    --accent: #c8a96e;
    --white: #ffffff;
  }

  body {
    background: var(--cream);
    color: var(--ink);
    font-family: 'Noto Sans JP', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 480px;
    margin: 0 auto;
    padding: 0 0 80px;
  }

  .header {
    padding: 48px 24px 32px;
    text-align: center;
  }

  .header-eyebrow {
    font-family: 'Playfair Display', serif;
    font-size: 10px;
    letter-spacing: 0.3em;
    color: var(--accent);
    margin-bottom: 12px;
  }

  .header-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--ink);
  }

  .header-desc {
    margin-top: 12px;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.8;
    font-weight: 300;
  }

  .header-rule {
    margin: 24px auto 0;
    width: 40px;
    height: 2px;
    background: var(--accent);
  }

  .grid {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 16px;
  }

  .card {
    opacity: 0;
    animation: fadeUp 0.5s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    background: var(--white);
  }

  .card--feature .card-image-wrap {
    aspect-ratio: 3 / 4;
  }

  .card--feature .card-title {
    font-size: 16px;
  }

  .card-image-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #ece9e2;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .card-link:hover .card-image {
    transform: scale(1.06);
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(26, 23, 20, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .card-link:hover .card-overlay {
    opacity: 1;
  }

  .card-overlay-text {
    font-family: 'Playfair Display', serif;
    font-size: 14px;
    color: var(--white);
    letter-spacing: 0.1em;
    border-bottom: 1px solid var(--accent);
    padding-bottom: 4px;
  }

  .card-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    background: var(--accent);
    color: var(--white);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.2em;
    padding: 4px 10px;
  }

  .card-body {
    padding: 16px 20px 20px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1px solid #e8e4dc;
  }

  .card-index {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 900;
    color: #d9d4ca;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .card-title {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.6;
    color: var(--ink);
    flex: 1;
  }

  .card-cta {
    font-family: 'Playfair Display', serif;
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.05em;
    flex-shrink: 0;
    margin-top: 3px;
  }

  .footer {
    text-align: center;
    padding: 48px 24px 0;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.15em;
  }
`;
