import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email public_repo" } },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubUsername: profile.login,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
      }
      if (user) {
        token.githubUsername = (user as any).githubUsername // Cast user to any to access githubUsername
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.githubUsername = token.githubUsername
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
  },
})
