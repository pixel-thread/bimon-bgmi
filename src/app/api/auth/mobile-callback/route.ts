import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db/prisma";

/**
 * Mobile App Authentication Callback
 * 
 * This endpoint is called when a user successfully logs in via the mobile app.
 * It returns user data that the mobile app can use.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      // Not authenticated - redirect to login
      const loginUrl = new URL("/auth/sign-in", request.url);
      loginUrl.searchParams.set("redirect_url", "/api/auth/mobile-callback");
      return NextResponse.redirect(loginUrl);
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user with player data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        userName: true,
        displayName: true,
        email: true,
        role: true,
        balance: true,
        createdAt: true,
        player: {
          select: {
            id: true,
            category: true,
            isBanned: true,
            customProfileImageUrl: true,
            uc: {
              select: {
                balance: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Build user data for the app
    const userData = {
      id: user.player?.id || user.id,
      clerkUserId: user.clerkId,
      displayName: user.displayName || user.userName,
      email: user.email,
      imageUrl: clerkUser.imageUrl,
      customProfileImageUrl: user.player?.customProfileImageUrl,
      ucBalance: user.player?.uc?.balance || 0,
      role: user.role,
      category: user.player?.category,
      isBanned: user.player?.isBanned || false,
    };

    // Build the deep link URL to redirect back to the app
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    const deepLinkUrl = `pubgmi-games://auth?success=true&user=${userDataEncoded}`;

    // Return HTML that redirects to the deep link
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        p {
            color: #a1a1aa;
            margin-bottom: 20px;
        }
        .btn {
            background: #6366f1;
            color: white;
            padding: 14px 28px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="success-icon">✅</div>
    <h1>Login Successful!</h1>
    <p>Welcome back, ${userData.displayName}!</p>
    <a href="${deepLinkUrl}" class="btn">Return to App</a>
    <script>
        // Try to automatically redirect to the app
        setTimeout(function() {
            window.location.href = "${deepLinkUrl}";
        }, 500);
    </script>
</body>
</html>
        `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Mobile auth callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
