import { redirect } from "next/navigation";

/**
 * /sign-up redirects to /sign-in
 * There is no separate sign-up page — Google OAuth handles both.
 */
export default function SignUpPage() {
    redirect("/sign-in");
}
