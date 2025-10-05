// app/api/renew-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      console.error("Missing phoneNumber in request body");
      return NextResponse.json({ error: "Missing phoneNumber" }, { status: 400 });
    }

    const userRef = doc(db, "users", phoneNumber);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error(`User not found for phoneNumber: ${phoneNumber}`);
      return NextResponse.json({ error: "User not approved" }, { status: 403 });
    }

    const { teamName, approvedAt } = userDoc.data();

    // Generate a new OTP (6-digit random number)
    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10-minute expiration

    console.log(`Renewing OTP for ${phoneNumber}. New OTP: ${newPassword}`);

    // Update Firestore with the new OTP
    await setDoc(
      userRef,
      {
        phoneNumber,
        password: newPassword, // Store the new OTP
        expiresAt, // Store the expiration time
        approvedAt: approvedAt || new Date().toISOString(),
        teamName: teamName || "N/A",
      },
      { merge: true } // Ensure we only update the necessary fields
    );

    return NextResponse.json({ success: true, message: "New OTP generated", password: newPassword });
  } catch (error: any) {
    console.error("Error in /api/renew-password:", error.message, error.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
