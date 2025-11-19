import { UnauthorizedError } from "../errors/unAuthError";
import { getUserById } from "@/src/services/user/getUserById";
import { verifyToken } from "@clerk/backend";

export async function adminMiddleware(req: Request) {
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

  const user = await getUserById({ id: claims.sub });

  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new UnauthorizedError("Permission Denied");
  }

  return user;
}
