import { NextRequest } from "next/server";
import { UnauthorizedError } from "../errors/unAuthError";
import { verifyToken } from "@clerk/backend";
import { getUserByClerkId } from "../../services/user/getUserByClerkId";
import { clientClerk } from "@/src/lib/clerk/client";
import { createUserIfNotExistInDB } from "@/src/services/user/createUser";
import { updateUser } from "@/src/services/user/updateUser";

export async function tokenMiddleware(req: NextRequest | Request) {
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

  const clerkUser = await clientClerk.users.getUser(claims.sub);

  if (!clerkUser) {
    throw new UnauthorizedError("Unauthorized");
  }
  // Try to find user in your backend
  let user = await getUserByClerkId({ id: clerkUser.id });

  if (!user) {
    const newUser = await createUserIfNotExistInDB({
      data: {
        password: "123Abc_@",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        userName: clerkUser.username || "",
        createdBy: clerkUser.id,
        clerkId: clerkUser.id,
      },
    });

    if (!newUser) {
      throw new UnauthorizedError("Unauthorized");
    }
    return newUser;
  }

  const reqMethod = req.method;

  if (user.role === "USER" && reqMethod !== "GET") {
    // Allow voting for USER role
    if (req.url.includes("/vote") && reqMethod === "POST") {
      // Allow
    } else if (req.url.includes("/payments/") && reqMethod === "POST") {
      // Allow payment endpoints for users
    } else if (req.url.includes("/onboarding") && reqMethod === "POST") {
      // Allow onboarding for new users to set their username
    } else if (req.url.includes("/profile") && reqMethod === "PATCH") {
      // Allow profile updates for users
    } else {
      throw new Error("Long ki ba jai jai se: Permission Denied");
    }
  }

  // Only sync username from Clerk if user has completed onboarding
  // Non-onboarded users will set their own username during onboarding
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
  // User is guaranteed to be non-null at this point
  return user!;
}
