import { NextRequest } from "next/server";
import { UnauthorizedError } from "../errors/unAuthError";
import { verifyToken } from "@clerk/backend";
import { getUserByClerkId } from "../../services/user/getUserByClerkId";
import { clientClerk } from "@/src/lib/clerk/client";
import { createUserIfNotExistInDB } from "@/src/services/user/createUser";
import { updateUser } from "@/src/services/user/updateUser";
import { prisma } from "@/src/lib/db/prisma";

/**
 * Lightweight user lookup for auth - returns user without heavy player includes.
 * Used for most GET requests to avoid loading full player data with nested relations.
 * The performance gain comes from skipping the player include, not from limiting user fields.
 */
async function getLightweightUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    // Don't use select - return all User fields
    // The optimization is skipping the heavy player/characterImage/uc includes
  });
}

/**
 * Optimized token middleware that avoids unnecessary Clerk API calls.
 * 
 * For GET requests with existing users, we use lightweight lookup
 * to avoid loading full player data. This saves significant DB time.
 * 
 * Options:
 * - requireFullUser: If true, always loads full user with player data (for /api/auth)
 */
export async function tokenMiddleware(
  req: NextRequest | Request,
  options?: { requireFullUser?: boolean }
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Token khlem sent");
  }

  // Parse the Clerk session JWT and get claims
  const claims = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  if (!claims.sub) {
    throw new UnauthorizedError("Unauthorized");
  }

  const clerkId = claims.sub;
  const reqMethod = req.method;
  const requireFullUser = options?.requireFullUser ?? false;

  // OPTIMIZATION: For GET requests (except when requireFullUser is true),
  // use lightweight lookup to avoid loading full player data
  if (reqMethod === "GET" && !requireFullUser) {
    const lightweightUser = await getLightweightUserByClerkId(clerkId);

    if (lightweightUser) {
      // User exists and it's a read operation - no need to call Clerk
      return lightweightUser;
    }
  }

  // For write operations, /api/auth, or new users - use full lookup
  let user = await getUserByClerkId({ id: clerkId });

  // If user exists and it's a GET (and requireFullUser), return without Clerk call
  if (user && reqMethod === "GET") {
    return user;
  }

  // For new users or write operations, we need to call Clerk
  const clerkUser = await clientClerk.users.getUser(clerkId);

  if (!clerkUser) {
    throw new UnauthorizedError("Unauthorized");
  }

  // If user doesn't exist in our DB, create them
  if (!user) {
    const newUser = await createUserIfNotExistInDB({
      data: {
        password: "123Abc_@",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        userName: clerkUser.username || "",
        createdBy: clerkUser.id,
        clerkId: clerkUser.id,
        imageUrl: clerkUser.imageUrl || null,
      },
    });

    if (!newUser) {
      throw new UnauthorizedError("Unauthorized");
    }
    return newUser;
  }

  // Permission checks for non-GET requests
  if (user.role === "USER" && reqMethod !== "GET") {
    if (req.url.includes("/vote") && reqMethod === "POST") {
      // Allow
    } else if (req.url.includes("/payments/") && reqMethod === "POST") {
      // Allow payment endpoints for users
    } else if (req.url.includes("/onboarding") && reqMethod === "POST") {
      // Allow onboarding for new users to set their username
    } else if (req.url.includes("/profile") && reqMethod === "PATCH") {
      // Allow profile updates for users
    } else if (req.url.includes("/player/merit") && reqMethod === "POST") {
      // Allow merit ratings for players
    } else if (req.url.includes("/player/claim-") && reqMethod === "POST") {
      // Allow all claiming endpoints (streak, winner, solo support, referral bonus)
    } else if (req.url.includes("/uc-transfers") && (reqMethod === "POST" || reqMethod === "PATCH")) {
      // Allow UC transfer send/request and approve/reject for users
    } else {
      throw new Error("Long ki ba jai jai se: Permission Denied");
    }
  }

  // Only sync username from Clerk if user has completed onboarding
  if (user.isOnboarded && clerkUser.username !== user.userName) {
    const newUserName =
      clerkUser.username ||
      clerkUser.firstName ||
      clerkUser.primaryEmailAddress?.emailAddress.split("@")[0] ||
      "";

    const isVerified = clerkUser.primaryEmailAddress ? true : false;

    user = await updateUser({
      where: { id: user.id },
      data: {
        isEmailLinked: isVerified,
        isVerified: isVerified,
        userName: newUserName,
        usernameLastChangeAt: new Date(),
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
      },
    });
  }

  return user!;
}
