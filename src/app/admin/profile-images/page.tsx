"use client";

import { ProfileImagesManager } from "@/src/components/admin/profile-images/ProfileImagesManager";
import { FiImage } from "react-icons/fi";

export default function ProfileImagesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
                            <FiImage className="h-8 w-8 text-indigo-600" />
                            Profile Images
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
                            Upload profile images that players can choose from on their profile page.
                        </p>
                    </div>
                </header>

                <ProfileImagesManager />
            </div>
        </div>
    );
}
