import React, { useEffect, useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { seasonSchema, SeasonSchemaType } from "@/src/utils/validation/seasons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { useGetSeasons } from "@/src/hooks/season/useGetSeasons";

// Helper to parse and increment season version
function getNextSeasonVersion(currentName: string | undefined): string {
  if (!currentName) return "Season 1";

  // Try to extract version from name like "Season 4", "Season 4.2", etc.
  const match = currentName.match(/Season\s*(\d+)(?:\.(\d+))?/i);
  if (!match) return "Season 1";

  const major = parseInt(match[1], 10);
  const hasExplicitMinor = match[2] !== undefined; // Check if .X was present in name
  const minor = hasExplicitMinor ? parseInt(match[2], 10) : 0;

  // If no minor version in name (e.g., "Season 4"), start with .2
  // If has explicit minor (e.g., "Season 5.0" or "Season 5.1"), increment it
  const nextMinor = hasExplicitMinor ? minor + 1 : 2;

  return `Season ${major}.${nextMinor}`;
}

type Props = {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
};
export const CreateSeasonDialog = ({ open, onOpenChange }: Props) => {
  const { data: seasons } = useGetSeasons();

  // Get the current active season or the latest season
  const currentSeason = useMemo(() => {
    if (!seasons || seasons.length === 0) return undefined;
    return seasons.find((s) => s.status === "ACTIVE") || seasons[0];
  }, [seasons]);

  const suggestedName = useMemo(() => {
    return getNextSeasonVersion(currentSeason?.name);
  }, [currentSeason]);

  const form = useForm<SeasonSchemaType>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      description: "",
      name: suggestedName,
    },
  });

  // Update form when suggested name changes
  useEffect(() => {
    if (suggestedName && open) {
      form.setValue("name", suggestedName);
    }
  }, [suggestedName, open, form]);

  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    mutationFn: (data: SeasonSchemaType) => http.post("/admin/season", data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["seasons"] });
        onOpenChange(false);
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const onSubmit: SubmitHandler<SeasonSchemaType> = (data) => mutate(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Create New Season</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season Name</FormLabel>
                    <FormControl>
                      <Input placeholder="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Anniversary Update" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="bg-yellow-50 rounded-md p-2">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Creating a new season will end the
                  current active season and start fresh statistics tracking.
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="h-8 text-xs"
                disabled={!form.formState.isValid || isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
