import { UnauthorizedError } from "../errors/unAuthError";
import { tokenMiddleware } from "./tokenMiddleware";

export async function adminMiddleware(req: Request) {
  const user = await tokenMiddleware(req);

  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  switch (user.role) {
    case "ADMIN":
      break;
    case "SUPER_ADMIN":
      break;
    default:
      throw new UnauthorizedError("Permission Denied");
  }

  return user;
}
