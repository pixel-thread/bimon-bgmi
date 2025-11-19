"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import TournamentSelector from "@/src/components/tournaments/TournamentSelector";
import { TrashIcon } from "lucide-react";
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
import { useActiveSeason } from "@/src/hooks/season/useActiveSeason";
import { useSeasonStore } from "@/src/store/season";
import { useTournament } from "@/src/hooks/tournament/useTournament";
import { usePoll } from "@/src/hooks/poll/usePoll";
import { useRouter } from "next/navigation";
import { logger } from "@/src/utils/logger";

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
  "Sat",
];

const VoteOptions = ["IN", "OUT", "SOLO"];

export const UpdatePollDialog = ({ open, id }: UpdatePollDialogProps) => {
  const { tournamentId } = useTournamentStore();
  const router = useRouter();
  const { setSeasonId } = useSeasonStore();
  const queryClient = useQueryClient();

  const { data: activeSeason } = useActiveSeason();

  const { data, isFetching } = usePoll({ id });

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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Update Poll
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Update a tournament participation poll
          </p>
        </DialogHeader>
        {!isFetching && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Question</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter your poll question..."
                          className="min-h-[80px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"days"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Choose Days</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger value={field.value} className="w-full">
                            <SelectValue
                              {...field}
                              placeholder="Select a day"
                            />
                          </SelectTrigger>
                          <SelectContent>
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
                <FormLabel>Poll Options</FormLabel>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <FormField
                        control={form.control}
                        name={`options.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="sr-only">
                              Option {index + 1}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={`Option ${index + 1}`}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`options.${index}.vote`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">
                              Choose Days
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger
                                  value={field.value}
                                  className="w-full"
                                >
                                  <SelectValue
                                    {...field}
                                    placeholder="Select Vote"
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {VoteOptions.map((day) => (
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

                      <Button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => remove(index)}
                        variant="destructive"
                        size={"icon-lg"}
                        aria-label="Remove option"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: "", vote: "IN" })}
                  >
                    Add Option
                  </Button>
                </div>
              </div>
              <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onClose(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || isPending}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
                >
                  Update Poll
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
