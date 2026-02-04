"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
          <Gamepad2 className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Game Arcade</h1>
          <p className="text-sm text-muted-foreground">
            Take a break and have some fun with mini games!
          </p>
        </div>
      </div>

      {/* Download APK Banner */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-lg">Download PUBGMI Games App</h3>
              <p className="text-sm text-muted-foreground">
                Play games on your Android phone with the native app experience
              </p>
            </div>
            <a
              href="/squad-up-v1.0.1.apk"
              download="squad-up-v1.0.1.apk"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download APK
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="font-semibold text-lg">Games available on mobile only</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Download the PUBGMI Games app to play Memory Match and other games.
              Compete on the leaderboard and earn rewards!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

