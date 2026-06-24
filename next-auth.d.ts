import NextAuth, { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string | null;
      githubUsername?: string; // Add githubUsername to the user object
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    githubUsername?: string; // Add githubUsername to the JWT
  }
}
