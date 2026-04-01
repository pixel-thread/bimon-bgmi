import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth v5 configuration.
 * Uses Google OAuth (same as Clerk did) with JWT sessions.
 * Links to existing DB users via email — no schema changes needed.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 365 * 24 * 60 * 60, // 1 year — users stay logged in forever
    },
    pages: {
        signIn: "/sign-in",
    },
    callbacks: {
        async jwt({ token, account, profile, trigger, session }) {
            // On initial sign-in, store Google profile data
            if (account && profile) {
                token.googleId = profile.sub;
                token.email = profile.email;
                token.name = profile.name;
                token.picture = profile.picture;
            }
            // On session update (e.g. email swap), sync the token
            if (trigger === "update" && session?.email) {
                token.email = session.email;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose the Google ID and token data to the session
            if (session.user) {
                session.user.id = token.sub!;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
            }
            return session;
        },
    },
});
