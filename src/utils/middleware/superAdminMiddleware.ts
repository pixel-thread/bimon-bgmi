import { UnauthorizedError } from "../errors/unAuthError";
import { verifyToken } from "@clerk/backend";
import { getUserByClerkId } from "@/src/services/user/getUserByClerkId";

export async function superAdminMiddleware(req: Request) {
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

  const user = await getUserByClerkId({ id: claims.sub });

  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (user.role !== "SUPER_ADMIN") {
    throw new UnauthorizedError("Permission Denied");
  }
  return user;
}
