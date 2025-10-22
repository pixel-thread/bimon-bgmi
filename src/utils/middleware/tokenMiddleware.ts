import { NextRequest } from "next/server";
import { UnauthorizedError } from "../errors/unAuthError";
import { verifyToken } from "@clerk/backend";
import { getUserByClerkId } from "../../services/user/getUserByClerkId";
import { clientClerk } from "@/src/lib/clerk/client";
import { createUserIfNotExistInDB } from "@/src/services/user/createUser";

export async function tokenMiddleware(req: NextRequest | Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Unauthorized 1");
  }
  // Parse the Clerk session JWT and get claims
  const claims = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  if (!claims.sub) {
    throw new UnauthorizedError("Unauthorized 2");
  }

  // Try to find user in your backend
  let user = await getUserByClerkId({ id: claims.sub });

  if (!user) {
    // if (process.env.NODE_ENV === "development") {
    //   await createUserIfNotExistInDB({
    //     clerkId: claims.sub,
    //     username: "dev",
    //   });
    // }
    // If the user is not found, revoke this session at Clerk
    if (claims.sid) {
      await clientClerk.sessions.revokeSession(claims.sid);
    }
    throw new UnauthorizedError("Unauthorized");
  }

  return user;
}
