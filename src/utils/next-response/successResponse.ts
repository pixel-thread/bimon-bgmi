import { MetaT } from "@/src/types/meta";
import { HttpStatusCode } from "axios";
import { NextResponse } from "next/server";

interface Props<T> {
  message?: string;
  data?: T | unknown | null;
  meta?: MetaT;
  status?: HttpStatusCode;
  token?: string;
  headers?: Record<string, string>;
  // Birthday free entry fields
  isBirthdayPlayer?: boolean;
  userDateOfBirth?: Date | string | null;
}

export const SuccessResponse = <T>({
  message = "Request successfully",
  data,
  status = 200,
  meta,
  token,
  headers,
  isBirthdayPlayer,
  userDateOfBirth,
}: Props<T>) => {
  return NextResponse.json(
    {
      success: true,
      message: message || "Request successful",
      data: data,
      token: token,
      meta: meta,
      isBirthdayPlayer: isBirthdayPlayer,
      userDateOfBirth: userDateOfBirth,
      timeStamp: new Date().toISOString(),
    },
    { status: status, headers: headers },
  );
};

/**
 * Cache header presets for Vercel edge caching
 * s-maxage = CDN cache time, stale-while-revalidate = serve stale while fetching fresh
 */
export const CACHE_HEADERS = {
  /** Short cache: 1 min CDN, 5 min stale-while-revalidate */
  SHORT: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  /** Medium cache: 5 min CDN, 10 min stale-while-revalidate */
  MEDIUM: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  /** No cache: for user-specific or frequently changing data */
  NONE: { "Cache-Control": "no-store, no-cache, must-revalidate" },
};
