export function extractASIN(input: string): string | null {
  const s = input.trim();

  const m1 = s.match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (m1) return m1[1].toUpperCase();

  const m2 = s.match(/\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (m2) return m2[1].toUpperCase();

  const m3 = s.match(/[?&](?:asin|ASIN)=([A-Z0-9]{10})(?:[&]|$)/i);
  if (m3) return m3[1].toUpperCase();

  const m4 = s.match(/^([A-Z0-9]{10})$/i);
  if (m4) return m4[1].toUpperCase();

  return null;
}