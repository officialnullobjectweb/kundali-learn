// Who is calling? Resolves an account id from (in order):
// 1. Authorization: Bearer <token>   2. ?access_token=   3. x-account-id
// Bearer/query secrets are profile API secrets (checked per profile).
// x-account-id is a per-browser random id (unguessable); it authorizes the
// website's own CRUD only, never MCP profile reads.
import { createHash, randomBytes } from 'node:crypto';

export function newProfileSecret(): { secret: string; hash: string } {
  const secret = `klp_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(secret).digest('hex');
  return { secret, hash };
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function isUuidLike(s: string): boolean {
  return /^[0-9a-fA-F-]{8,64}$/.test(s);
}

export interface Caller {
  /** Account id when identified, else null (anonymous). */
  accountId: string | null;
  /** Raw presented secret (Bearer or query), if any. */
  secret: string | null;
}

export function callerFromRequest(req: Request): Caller {
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('access_token');
  const auth = req.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  const secret = bearer || queryToken;
  if (secret) return { accountId: null, secret };
  const headerAccount = req.headers.get('x-account-id');
  if (headerAccount && isUuidLike(headerAccount)) {
    return { accountId: headerAccount, secret: null };
  }
  return { accountId: null, secret: null };
}
