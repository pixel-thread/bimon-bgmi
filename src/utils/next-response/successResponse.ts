import { MetaT } from "@/types/meta";
import { HttpStatusCode } from "axios";
import { NextResponse } from "next/server";

interface Props<T> {
  message?: string;
  data?: T | unknown | null;
  meta?: MetaT;
  status?: HttpStatusCode;
  token?: string;
}

export const SuccessResponse = <T>({
  message = "Request successfully",
  data,
  status = 200,
  meta,
  token,
}: Props<T>) => {
  return NextResponse.json(
    {
      success: true,
      message: message || "Request successful",
      data: data,
      token: token,
      meta: meta,
      timeStamp: new Date().toISOString(),
    },
    { status: status },
  );
};
