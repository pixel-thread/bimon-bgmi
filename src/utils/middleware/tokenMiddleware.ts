import { NextRequest } from "next/server";
import { UnauthorizedError } from "../errors/unAuthError";
import { verifyToken } from "@clerk/backend";
import { getUserByClerkId } from "@/src/services/user/getUserByClerkId";
import {
  createUser,
  createUserIfNotExistInDB,
} from "@/src/services/user/createUser";
import { clientClerk } from "@/src/lib/clerk/client";
import { getUserByUserName } from "@/src/services/user/getUserByUserName";
/**
 * Middleware to validate and manage authentication tokens
 *
 * @param req - NextRequest or Request object containing the authorization header
 * @throws {Error} When token is missing or invalid
 * @throws {Error} When token is not found or expired
 *
 * @description
 * - Extracts Bearer token from authorization header
 * - Validates token existence and activity status
 * - Automatically extends token expiration if within 3 days of expiry
 * - Token extension adds 7 days to current expiration date
 *
 * @example
 * ```typescript
 * // Usage in API route
 * await tokenMiddleware(request);
 * ```
 */
export async function tokenMiddleware(req: NextRequest | Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Unauthorized");
  }
  const claims = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY, // never expose in client code
  });

  if (!claims.sub) {
    throw new UnauthorizedError("Unauthorized");
  }

  let user = await getUserByClerkId({ id: claims.sub });

  if (!user) {
    const clerkUser = await clientClerk.users.getUser(claims.sub);

    const isUserExistbyUserName = await getUserByUserName({
      userName: clerkUser.username ?? claims.sub,
    });

    if (isUserExistbyUserName) {
      throw new UnauthorizedError("Unauthorized");
    }

    user = await createUserIfNotExistInDB({
      username: clerkUser.username || claims.sub,
      clerkId: clerkUser?.id,
    });
  }

  return user;
}
