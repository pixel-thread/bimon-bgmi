import { NextRequest } from "next/server";
import { UnauthorizedError } from "../errors/unAuthError";
import { verifyToken } from "@clerk/backend";
import { getUserByClerkId } from "../../services/user/getUserByClerkId";
import { clientClerk } from "@/src/lib/clerk/client";
import {
  createUser,
  createUserIfNotExistInDB,
} from "@/src/services/user/createUser";

export async function tokenMiddleware(req: NextRequest | Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Unauthorized");
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
  const user = await getUserByClerkId({ id: claims.sub });

  if (!user) {
    const newUser = await createUser({
      data: {
        password: "123Abc_@",
        userName: clerkUser.username || "",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        createdBy: "Self",
      },
    });

    if (!newUser) {
      throw new UnauthorizedError("Unauthorized");
    }
    return newUser;
  }

  return user;
}
