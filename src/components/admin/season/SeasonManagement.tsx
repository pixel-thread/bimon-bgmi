"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { PlusCircle, Calendar, Trophy, Loader2, Clock } from "lucide-react";
import { useGetSeasons } from "../../../hooks/season/useGetSeasons";
import { CreateSeasonDialog } from "./create-season-dialog";

export function SeasonManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isFetching: isLoading, data } = useGetSeasons();

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Not set";

    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);

      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/5 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Trophy className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Season Management</CardTitle>
              <CardDescription className="text-xs">
                Create and manage tournament seasons
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-600/90 hover:to-pink-600/90"
          >
            <PlusCircle className="w-4 h-4" />
            New Season
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-muted-foreground">
              No Seasons Yet
            </h3>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Create your first season to organize tournaments
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {data.map((season, index) => (
              <div
                key={season.id}
                className={`relative p-4 rounded-xl transition-all ${season.status === "ACTIVE"
                    ? "bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20"
                    : "bg-muted/30 border border-transparent hover:border-muted-foreground/20"
                  }`}
              >
                {/* Active indicator line */}
                {season.status === "ACTIVE" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-l-xl" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${season.status === "ACTIVE"
                          ? "bg-green-500/20"
                          : "bg-muted"
                        }`}
                    >
                      <Trophy
                        className={`h-4 w-4 ${season.status === "ACTIVE"
                            ? "text-green-600"
                            : "text-muted-foreground"
                          }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{season.name}</h3>
                        {season.status === "ACTIVE" && (
                          <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                            Active
                          </Badge>
                        )}
                        {index === 0 && season.status !== "ACTIVE" && (
                          <Badge variant="outline" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      {season.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {season.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Started: {formatDate(season.startDate)}</span>
                        </div>
                        {season.endDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Ended: {formatDate(season.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CreateSeasonDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </Card>
  );
}
