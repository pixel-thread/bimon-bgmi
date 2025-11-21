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
    throw new UnauthorizedError("Token khlm sent");
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
  let user = await getUserByClerkId({ id: claims.sub });

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
    throw new Error("Long ki ba jai jai se: Permission Denied");
  }

  if (clerkUser.username !== user.userName) {
    user = await updateUser({
      where: { id: user.id },
      data: {
        userName:
          clerkUser.username ||
          clerkUser.firstName ||
          clerkUser.primaryEmailAddress?.emailAddress.split("@")[0] ||
          "",
        usernameLastChangeAt: new Date(),
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
      },
    });
  }
  return user;
}
