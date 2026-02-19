import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background to-default-100">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-xl border border-divider",
                    },
                }}
            />
        </div>
    );
}
