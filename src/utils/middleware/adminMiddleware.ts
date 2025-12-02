import { UnauthorizedError } from "../errors/unAuthError";
import { tokenMiddleware } from "./tokenMiddleware";

export async function adminMiddleware(req: Request) {
  const user = await tokenMiddleware(req);

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new UnauthorizedError("Permission Denied");
  }

  return user;
}
