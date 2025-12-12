"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import TournamentSelector from "@/src/components/tournaments/TournamentSelector";
import { TrashIcon, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pollSchema } from "@/src/utils/validation/poll";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { useTournamentStore } from "@/src/store/tournament";
import z from "zod";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "../../ui/select";
import { toast } from "sonner";
import { useAppContext } from "@/src/hooks/context/useAppContext";
import { useSeasonStore } from "@/src/store/season";
import { useTournament } from "@/src/hooks/tournament/useTournament";

type CreatePollDialogProps = {
  open: boolean;
  onValueChange: React.Dispatch<React.SetStateAction<boolean>>;
};

type PollForm = z.infer<typeof pollSchema>;

const pollDays = [
  "Monday",
  "Monday-Tuesday",
  "Tuesday",
  "Tuesday-Wednesday",
  "Wednesday",
  "Wednesday-Thursday",
  "Thursday",
  "Thursday-Friday",
  "Friday",
  "Friday-Saturday",
  "Saturday",
];

const VoteOptions = ["IN", "OUT", "SOLO"];

export const CreatePollDialog = ({
  open,
  onValueChange,
}: CreatePollDialogProps) => {
  const { tournamentId } = useTournamentStore();
  const { setSeasonId } = useSeasonStore();
  const queryClient = useQueryClient();

  const { activeSeason: data } = useAppContext();

  const { data: tournament } = useTournament({ id: tournamentId });

  const form = useForm({
    resolver: zodResolver(pollSchema.omit({ id: true })),
    defaultValues: {
      question: tournament?.name,
      tournamentId: tournamentId,
      options: [
        { name: "Nga Leh", vote: "IN" },
        { name: "Nga Leh rei", vote: "OUT" },
        { name: "Nga Leh solo", vote: "SOLO" },
      ],
      days: "Monday",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const onClose = (value: boolean) => {
    form.reset();
    onValueChange(value);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: PollForm) =>
      http.post<{ id: string }>("/admin/poll", data),
    onSuccess: (data) => {
      if (data.success) {
        toast(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
        onClose(false);
        return data.data;
      }
      toast.error(data.message);
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => mutate(data);

  useEffect(() => {
    if (data?.id) {
      setSeasonId(data.id);
    }
  }, [data?.id]);

  useEffect(() => {
    if (tournamentId) {
      form.setValue("tournamentId", tournamentId);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournament?.name) {
      form.setValue("question", tournament.name);
    }
  }, [tournamentId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] inset-0 translate-x-0 translate-y-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:max-w-md max-w-none p-0 gap-0 overflow-hidden rounded-none sm:rounded-lg flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b bg-muted/30">
          <DialogTitle className="text-base font-medium">
            Create Poll
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto">
              {/* Tournament Selector - Compact */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tournament</label>
                <TournamentSelector className="w-full" />
              </div>

              {/* Question - Minimal */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Question
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Poll question..."
                        className="h-9"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Days Selector */}
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Days
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Select days" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                          {pollDays.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Poll Options - Compact */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Options
                </label>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2"
                    >
                      <FormField
                        control={form.control}
                        name={`options.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={`Option ${index + 1}`}
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`options.${index}.vote`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-20 h-8 text-sm">
                                  <SelectValue placeholder="Vote" />
                                </SelectTrigger>
                                <SelectContent>
                                  {VoteOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => append({ name: "", vote: "IN" })}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="px-4 py-3 border-t bg-muted/30 flex-row gap-2 sm:gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => onValueChange(false)}
                className="flex-1 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || isPending}
                className="flex-1 h-9"
              >
                {isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
