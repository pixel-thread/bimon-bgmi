import { SignIn } from "@clerk/nextjs";

export default function page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn routing="hash" signUpUrl="/auth/signup" />;
    </div>
  );
}
