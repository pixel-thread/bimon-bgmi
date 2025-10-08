import { ZodError } from "zod";
import { logger } from "../logger";
import { UnauthorizedError } from "./unAuthError";
import { EmailError } from "./EmailError";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { ErrorResponse } from "../next-response";

export const handleApiErrors = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ErrorResponse({ message: error.message, error, status: 400 });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ErrorResponse({ message: error.message, error, status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ErrorResponse({ message: error.message, error, status: 400 });
  }

  if (error instanceof ZodError) {
    logger.error({
      type: "ZodError",
      message: error.issues[0].message,
      error: error,
    });
    return ErrorResponse({
      message: error.issues[0].message,
      error: error.issues,
      status: 400,
    });
  }

  if (error instanceof EmailError) {
    return ErrorResponse({
      message: error.message || "Failed to send email",
      error,
      status: error.status,
    });
  }
  if (error instanceof UnauthorizedError) {
    return ErrorResponse({
      message: error.message || "Unauthorized",
      status: error.status,
    });
  }
  if (error instanceof Error) {
    logger.error({ type: "Error", message: error.message, error });
    return ErrorResponse({ message: error.message, error });
  }
  logger.error({
    type: "UnknownError",
    message: "Internal Server Error",
    error,
  });
  return ErrorResponse({ message: "Internal Server Error", error });
};
