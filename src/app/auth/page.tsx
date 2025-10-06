import { SignIn } from "@clerk/nextjs";

export default function page() {
  return <SignIn signUpUrl="/auth/signup" />;
}
