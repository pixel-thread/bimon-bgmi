import { UnauthorizedError } from "../errors/unAuthError";
import { tokenMiddleware } from "./tokenMiddleware";

export async function superAdminMiddleware(req: Request) {
  const user = await tokenMiddleware(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new UnauthorizedError("Permission Denied");
  }
  return user;
}
