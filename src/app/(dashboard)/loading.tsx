/**
 * Loading state for the dashboard route group.
 * Uses plain CSS skeletons to avoid hydration issues.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <div className="h-6 w-40 rounded-lg bg-default-200" />
                <div className="h-4 w-56 rounded-lg bg-default-200" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="h-24 rounded-xl bg-default-200" />
                <div className="h-24 rounded-xl bg-default-200" />
                <div className="h-24 rounded-xl bg-default-200" />
                <div className="h-24 rounded-xl bg-default-200" />
            </div>
            <div className="h-64 w-full rounded-xl bg-default-200" />
        </div>
    );
}
