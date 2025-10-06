import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  const { phoneNumber, password } = await req.json();

  // Normalize phone number format - ensure it has +91 prefix
  let normalizedPhoneNumber = phoneNumber;
  if (phoneNumber && !phoneNumber.startsWith("+")) {
    normalizedPhoneNumber = `+91${phoneNumber}`;
  }

  console.log(
    `Login attempt for ${normalizedPhoneNumber} with OTP: ${password}`
  );

  // Look up the user using the normalized phone number
  const userDoc = await getDoc(doc(db, "users", normalizedPhoneNumber));
  if (!userDoc.exists()) {
    console.log(`User not found: ${normalizedPhoneNumber}`);
    return NextResponse.json(
      { error: "Unauthorized phone number", requestPermission: true },
      { status: 401 }
    );
  }

  const userData = userDoc.data();
  if (userData.password !== password) {
    console.log(
      `Invalid OTP for ${normalizedPhoneNumber}. Expected: ${userData.password}, Got: ${password}`
    );
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const now = new Date();
  const expiresAt = new Date(userData.expiresAt);
  if (now > expiresAt) {
    console.log(
      `OTP expired for ${normalizedPhoneNumber}. Expires at: ${userData.expiresAt}`
    );
    return NextResponse.json(
      { error: "Password has expired" },
      { status: 401 }
    );
  }

  console.log(`Login successful for ${normalizedPhoneNumber}`);
  return NextResponse.json({
    success: true,
    userData: {
      phoneNumber: normalizedPhoneNumber,
      teamName: userData.teamName,
    },
  });
}
