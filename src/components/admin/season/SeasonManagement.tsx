"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { PlusCircle, Calendar, Trophy } from "lucide-react";
import { useGetSeasons } from "../../../hooks/season/useGetSeasons";
import { CreateSeasonDialog } from "./create-season-dialog";

export function SeasonManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isFetching: isLoading, data } = useGetSeasons();

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Not set";

    try {
      // Handle Firestore Timestamp objects
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="text-center text-xs">Loading seasons...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Seasons
            </CardTitle>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="sm"
              className="h-6 gap-1 text-xs"
            >
              <PlusCircle className="w-3 h-3" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {data?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No seasons found.
              </div>
            ) : (
              data?.map((season) => (
                <div
                  key={season.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-muted/20 rounded-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{season.name}</h3>
                      {season.status === "ACTIVE" && (
                        <Badge className="bg-green-100 text-green-800 text-[10px] py-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        Started: {formatDate(season.startDate)}
                      </span>
                      {season?.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Ended: {formatDate(season.endDate)}
                        </span>
                      )}
                    </div>
                    {season?.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                        {season.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateSeasonDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
