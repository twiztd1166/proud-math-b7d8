const ISSUER = 'https://token.actions.githubusercontent.com';
const AUDIENCE = 'paradise-shows-ci';
const JWKS_URL = 'https://token.actions.githubusercontent.com/.well-known/jwks';
const REPOSITORY = 'twiztd1166/proud-math-b7d8';
const REPOSITORY_ID = '950980051';
const MAX_TOKEN_AGE_SECONDS = 10 * 60;
const CLOCK_SKEW_SECONDS = 60;
const WORKFLOW_REF_RE = /^twiztd1166\/proud-math-b7d8\/\.github\/workflows\/(?:debug-paradise-shows-live|verify-paradise-shows-annual-read)\.yml@refs\//;
const ALLOWED_EVENTS = new Set(['push', 'pull_request', 'workflow_dispatch']);

type JwtHeader = { alg?: string; kid?: string; typ?: string };
type JwtClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  repository_id?: string;
  repository_visibility?: string;
  runner_environment?: string;
  workflow_ref?: string;
  event_name?: string;
};

let jwksCache: { expiresAt: number; keys: JsonWebKey[] } | null = null;

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function decodeJsonPart<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(part))) as T;
}

function audienceMatches(aud: JwtClaims['aud']) {
  return typeof aud === 'string' ? aud === AUDIENCE : Array.isArray(aud) && aud.includes(AUDIENCE);
}

async function githubJwks(): Promise<JsonWebKey[]> {
  const now = Date.now();
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache.keys;
  const response = await fetch(JWKS_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('GITHUB_OIDC_JWKS_UNAVAILABLE');
  const payload = await response.json() as { keys?: JsonWebKey[] };
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  if (!keys.length) throw new Error('GITHUB_OIDC_JWKS_EMPTY');
  jwksCache = { keys, expiresAt: now + 15 * 60 * 1000 };
  return keys;
}

async function verifySignature(signingInput: string, signaturePart: string, header: JwtHeader) {
  if (header.alg !== 'RS256' || !header.kid) return false;
  const keys = await githubJwks();
  const jwk = keys.find(key => key.kid === header.kid && (!key.alg || key.alg === 'RS256'));
  if (!jwk) return false;
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    decodeBase64Url(signaturePart),
    new TextEncoder().encode(signingInput),
  );
}

function claimsAllowed(claims: JwtClaims) {
  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== ISSUER || !audienceMatches(claims.aud)) return false;
  if (typeof claims.exp !== 'number' || claims.exp < now - CLOCK_SKEW_SECONDS) return false;
  if (typeof claims.nbf === 'number' && claims.nbf > now + CLOCK_SKEW_SECONDS) return false;
  if (typeof claims.iat !== 'number' || claims.iat > now + CLOCK_SKEW_SECONDS || claims.iat < now - MAX_TOKEN_AGE_SECONDS) return false;
  if (claims.repository !== REPOSITORY || String(claims.repository_id || '') !== REPOSITORY_ID) return false;
  if (claims.repository_visibility !== 'public' || claims.runner_environment !== 'github-hosted') return false;
  if (!claims.workflow_ref || !WORKFLOW_REF_RE.test(claims.workflow_ref)) return false;
  if (!claims.event_name || !ALLOWED_EVENTS.has(claims.event_name)) return false;
  return true;
}

export async function verifyGithubActionsCiOidc(request: Request): Promise<boolean> {
  const token = String(request.headers.get('x-paradise-ci-oidc') || '').trim();
  if (!token || token.length > 12000) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = decodeJsonPart<JwtHeader>(headerPart);
    const claims = decodeJsonPart<JwtClaims>(payloadPart);
    if (!claimsAllowed(claims)) return false;
    return await verifySignature(`${headerPart}.${payloadPart}`, signaturePart, header);
  } catch {
    return false;
  }
}
