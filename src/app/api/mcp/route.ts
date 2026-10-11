import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createKundaliServer } from '@/lib/mcp-server';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { handleOptions, withCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

/**
 * MCP endpoint (Streamable HTTP, stateless: no sessions, every request is
 * independent — safe on Vercel serverless). Connect any MCP client to:
 *   POST https://<your-app>.vercel.app/api/mcp
 * Local: POST http://localhost:3002/api/mcp
 *
 * Stored data here is always owner-scoped (account id argument); full
 * readings live behind per-profile secret links (/api/mcp/<profileId>).
 * Limits: 180 calls/min per IP.
 */
export function OPTIONS() {
  return handleOptions();
}

export async function POST(req: Request) {
  const ip = checkRateLimit(`mcp:ip:${clientIp(req)}`, 180, 60_000);
  if (!ip.ok) {
    return withCors(Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Rate limit — please wait a few seconds and retry.' } },
      { status: 429 },
    ));
  }
  try {
    const body = (await req.json()) as unknown;
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    const server = createKundaliServer();
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

export async function GET() {
  return withCors(Response.json({
    name: 'kundali-learn',
    transport: 'streamable-http (stateless)',
    usage: 'POST JSON-RPC to this URL from any MCP client. Stored profiles are owner-scoped; full readings live behind per-profile secret links (/api/mcp/<profileId>?access_token=<secret>).',
    limits: '180 calls/min per IP; 60/min per profile link',
    tools: ['list_profiles', 'get_profile', 'get_kundali', 'get_varga'],
  }));
}
