import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createKundaliServer } from '@/lib/mcp-server';
import { hashSecret } from '@/lib/auth';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { ProfileModel } from '@/lib/models/Profile';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { handleOptions, withCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

/**
 * Personal MCP endpoint: the URL identifies the profile, the access secret
 * unlocks it. AI needs no ids and the user pastes no chart.
 *   POST https://<your-app>.vercel.app/api/mcp/<profileId>?access_token=<secret>
 * Get YOUR link: Kundali Learn → Settings → Profiles → Connect.
 * Limits: 60 calls/min per secret, 180/min per IP (protects the free database).
 */
export function OPTIONS() {
  return handleOptions();
}

export async function POST(req: Request, { params }: { params: { profileId: string } }) {
  const ip = checkRateLimit(`mcp:ip:${clientIp(req)}`, 180, 60_000);
  if (!ip.ok) {
    return withCors(Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Rate limit — please wait a few seconds and retry.' } },
      { status: 429 },
    ));
  }
  try {
    const body = (await req.json()) as { jsonrpc?: string; id?: unknown };
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('access_token');
    const auth = req.headers.get('authorization');
    const presented = (auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null) ?? queryToken(querySecret);

    let secretValid = false;
    if (isMongoConfigured() && presented && /^[0-9a-fA-F]{24}$/.test(params.profileId)) {
      await connectMongo();
      const doc = await ProfileModel.findById(params.profileId).select('apiSecretHash').lean();
      const hash = doc?.apiSecretHash as string | null | undefined;
      secretValid = !!hash && hash === hashSecret(presented);
      if (secretValid) {
        const key = checkRateLimit(`mcp:secret:${hash}`, 60, 60_000);
        if (!key.ok) {
          return withCors(Response.json(
            { jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32000, message: 'Rate limit for this link — please wait a minute and retry.' } },
            { status: 429 },
          ));
        }
      }
    }

    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    const server = createKundaliServer({ profileId: params.profileId, secretValid });
    await server.connect(transport);
    const res = await transport.handleRequest(req, { parsedBody: body });
    await transport.close().catch(() => undefined);
    return withCors(res);
  } catch (e) {
    return withCors(Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32603, message: e instanceof Error ? e.message : 'mcp error' } },
      { status: 500 },
    ));
  }
}

function queryToken(q: string | null): string | null {
  return q && q.length >= 8 ? q : null;
}

export async function GET(_req: Request, { params }: { params: { profileId: string } }) {
  return withCors(Response.json({
    name: 'kundali-learn',
    transport: 'streamable-http (stateless)',
    profile: params.profileId,
    usage: 'POST JSON-RPC to this URL from any MCP client — no identity arguments needed. Owned profiles need ?access_token=<secret> (Settings → Profiles → Connect).',
    limits: '60 calls/min per link, 180/min per IP',
    tools: ['list_natives', 'get_native', 'get_native_varga', 'get_kundali', 'get_varga'],
  }));
}
