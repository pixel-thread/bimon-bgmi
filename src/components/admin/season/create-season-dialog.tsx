import React from "react";
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
type Props = {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
};
export const CreateSeasonDialog = ({ open, onOpenChange }: Props) => {
  const form = useForm({
    resolver: zodResolver(seasonSchema),
  });

  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    mutationFn: (data: SeasonSchemaType) => http.post("/admin/season", data),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["seasons"] });
        onOpenChange(false);
        return data;
      }
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="shadcn" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
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
                disabled={form.formState.isValid || isPending}
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
