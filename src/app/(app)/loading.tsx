/**
 * Loading state for the app route group.
 * Uses plain CSS skeletons to avoid hydration issues.
 */
export default function AppLoading() {
    return (
        <div className="mx-auto max-w-4xl space-y-6 p-4 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-default-200" />
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-32 rounded-xl bg-default-200" />
                <div className="h-32 rounded-xl bg-default-200" />
            </div>
            <div className="h-64 w-full rounded-xl bg-default-200" />
        </div>
    );
}
