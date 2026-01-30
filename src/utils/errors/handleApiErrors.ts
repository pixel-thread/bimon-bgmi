import { ZodError } from "zod";
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
    console.error("ZodError:", error.issues[0].message, error);
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
    return ErrorResponse({
      message: error.message,
      error,
    });
  }

  console.error("UnknownError:", "Internal Server Error", error);

  return ErrorResponse({ message: "Internal Server Error", error });
};
