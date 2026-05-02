import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

// Extended user type to include githubUsername from profile callback
interface GitHubUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  githubUsername?: string
}

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
        // User comes from profile callback and includes githubUsername
        const githubUser = user as GitHubUser
        token.githubUsername = githubUser.githubUsername
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
