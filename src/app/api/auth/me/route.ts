import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

/** Who am I (for rebinding local state after login). No secrets, just the id. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
  if (!user?.id) return NextResponse.json({});
  return NextResponse.json({ id: user.id, name: user.name ?? null, email: user.email ?? null });
}
