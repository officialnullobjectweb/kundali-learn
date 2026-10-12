// NextAuth options: email+password (always) + Google (only when its env
// keys exist). JWT sessions — nothing to store, perfect for serverless.
// Profiles bind to session.user.id once logged in; guests keep working
// anonymously exactly as before.
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { UserModel } from '@/lib/models/User';

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

export function googleEnabled(): boolean {
  return !!googleId && !!googleSecret;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password || !isMongoConfigured()) return null;
        await connectMongo();
        const user = await UserModel.findOne({ email }).lean();
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash as string);
        if (!ok) return null;
        return { id: String(user._id), name: user.name, email: user.email };
      },
    }),
    ...(googleEnabled()
      ? [GoogleProvider({ clientId: googleId as string, clientSecret: googleSecret as string })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.uid === 'string') {
        (session.user as { id?: string }).id = token.uid;
      }
      return session;
    },
  },
};
