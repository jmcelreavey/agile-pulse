/**
 * Webhook signature checks. Both GitHub and Jira Cloud sign the raw body with HMAC-SHA256 and
 * send `sha256=<hex>`. Uses Web Crypto so it runs the same in Node and on Cloudflare Workers.
 */
export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Compare in constant time so the check doesn't leak how much of the signature matched. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySha256Signature(secret: string | undefined, body: string, header: string | null): Promise<boolean> {
  if (!secret || !header) return false;
  const provided = header.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(provided)) return false;
  const expected = await hmacSha256Hex(secret, body);
  return timingSafeEqual(expected, provided);
}

/** SHA-256 of a token, hex encoded. API tokens are stored only as this hash. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A random URL-safe token. */
export function randomToken(bytes = 24): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
