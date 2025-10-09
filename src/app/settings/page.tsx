"use client";

import { useAuth } from "@/src/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { CharacterImageUpload } from "@/src/components/ui/character-image-upload";
import { FiUser } from "react-icons/fi";
import { UserAvatar } from "@clerk/nextjs";

export default function page() {
  const { user: playerUser, user } = useAuth();

  return (
    <div className="container mx-auto flex h-screen items-center justify-center px-4 py-8">
      <div className="max-w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={() => {}} className="space-y-6">
              <div className="flex justify-center">
                <UserAvatar rounded={false} />
              </div>

              <div className="flex justify-center">
                <CharacterImageUpload
                  currentImageBase64={user?.player?.characterUrl}
                  // onRemove={() => }
                  // disabled={}
                />
              </div>

              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FiUser className="h-4 w-4" />
                  Display Name
                </Label>
                <div className="relative mt-1 flex rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">
                      {user?.userName}
                    </span>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Account ID:</strong> {playerUser?.id}
                </p>
                <p>
                  <strong>Role Type:</strong>{" "}
                  {user?.role === "PLAYER" ? "Player" : "Admin"}
                </p>
                {user?.email && (
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                )}
                {playerUser && (
                  <p>
                    <strong>Player Category:</strong>
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {user?.player?.category || "None"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
