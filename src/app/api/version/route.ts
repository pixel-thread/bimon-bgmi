import { NextResponse } from "next/server";

export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || Date.now().toString();
  const buildTime =
    process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH;

  const versionInfo = {
    version,
    buildTime,
    ...(commitHash && { commitHash }),
    timestamp: Date.now(),
  };

  return NextResponse.json(versionInfo, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Version": version,
      "X-Build-Time": buildTime,
    },
  });
}
