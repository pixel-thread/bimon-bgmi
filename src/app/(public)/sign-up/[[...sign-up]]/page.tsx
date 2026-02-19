import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background to-default-100">
            <SignUp
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
