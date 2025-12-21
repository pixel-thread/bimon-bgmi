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
import { TrashIcon, Plus, Calendar, Users, Edit3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import {
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
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
import { usePoll } from "@/src/hooks/poll/usePoll";
import { useRouter } from "next/navigation";

type UpdatePollDialogProps = {
  open: boolean;
  id: string;
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

const VoteOptions = [
  { value: "IN", label: "IN" },
  { value: "OUT", label: "OUT" },
  { value: "SOLO", label: "SOLO" },
];

const TeamTypes = [
  { value: "SOLO", label: "Solo", players: 1 },
  { value: "DUO", label: "Duo", players: 2 },
  { value: "TRIO", label: "Trio", players: 3 },
  { value: "SQUAD", label: "Squad", players: 4 },
];

export const UpdatePollDialog = ({ open, id }: UpdatePollDialogProps) => {
  const { tournamentId } = useTournamentStore();
  const router = useRouter();
  const { setSeasonId } = useSeasonStore();
  const queryClient = useQueryClient();

  const { activeSeason } = useAppContext();

  const { data } = usePoll({ id });

  const { data: tournament } = useTournament({ id: tournamentId });

  const form = useForm({
    resolver: zodResolver(pollSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const onClose = (value: boolean) => {
    form.reset();
    router.back();
    return value;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: PollForm) =>
      http.put<{ id: string }>(`/admin/poll/${data?.id}`, data),
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

  const onSubmit: SubmitHandler<PollForm> = (data) => mutate(data);

  useEffect(() => {
    if (activeSeason?.id) {
      setSeasonId(activeSeason.id);
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

  useEffect(() => {
    if (data?.id) {
      form.reset({
        id: id,
        question: data?.question,
        tournamentId: data?.tournamentId,
        options: data?.options,
        days: data?.days,
        teamType: data?.teamType || "DUO",
      });
    }
  }, [data?.id, form]);

  const watchDays = useWatch({
    control: form.control,
    name: "days",
  });

  useEffect(() => {
    if (watchDays === "" && data?.days !== "") {
      form.setValue("days", data?.days || "Monday");
    }
  }, [watchDays, data?.days, form]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] inset-0 translate-x-0 translate-y-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:max-w-lg max-w-none p-0 gap-0 overflow-hidden rounded-none sm:rounded-xl flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
              <Edit3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Poll
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Modify poll settings and options</p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
              {/* Question */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Poll Question
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your poll question..."
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Days & Team Type - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Days Selector */}
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Days
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-10">
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

                {/* Team Type Selector */}
                <FormField
                  control={form.control}
                  name="teamType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Type
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || "DUO"}
                          defaultValue="DUO"
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {TeamTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label} ({type.players}p)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Poll Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Poll Options
                </label>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 group"
                    >
                      <FormField
                        control={form.control}
                        name={`options.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1 space-y-0">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={`Option ${index + 1}`}
                                className="h-10"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`options.${index}.vote`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-[80px] h-10">
                                  <SelectValue placeholder="Vote" />
                                </SelectTrigger>
                                <SelectContent>
                                  {VoteOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                        className="h-10 w-10 text-gray-400 hover:text-red-500 shrink-0"
                        onClick={() => remove(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Option Button */}
                  <button
                    type="button"
                    onClick={() => append({ name: "", vote: "IN" })}
                    className="w-full h-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex-row gap-3 sm:gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => onClose(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || isPending}
                className="flex-1"
              >
                {isPending ? "Updating..." : "Update Poll"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
