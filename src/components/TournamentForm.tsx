import { Button } from "@/src/components/ui/button";
import { TournamentConfig } from "@/src/lib/types";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useTournamentStore } from "../store/tournament";
import { useTournament } from "@/src/hooks/tournament/useTournament";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "../utils/validation/tournament";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "../utils/http";
import { ConfirmDeleteTournamentDialog } from "./tournaments/confirm-delete-tournament";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import z from "zod";
import { useSeasonStore } from "../store/season";

const schema = tournamentSchema.pick({ name: true, fee: true });

type FormValueT = z.infer<typeof schema>;

export default function TournamentForm() {
  const { tournamentId } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  const { data: selectedTournament, isLoading } = useTournament({
    id: tournamentId,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: selectedTournament?.name || "",
      fee: selectedTournament?.fee || 0,
    },
  });

  const { mutate: updateTournament, isPending } = useMutation({
    mutationFn: (data: FormValueT) =>
      http.put("/admin/tournament/" + tournamentId, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Tournament updated successfully!");
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
      }
    },
  });

  const handleUpdate: SubmitHandler<FormValueT> = async (data) =>
    updateTournament(data);

  useEffect(() => {
    if (selectedTournament) {
      form.reset({
        name: selectedTournament.name,
        fee: selectedTournament.fee || 0,
      });
    }
  }, [selectedTournament]);

  const isUpdating = isLoading || !tournamentId || !seasonId || isPending;

  return (
    <div className="">
      <Form {...form}>
        <form
          className="flex flex-col w-full"
          onSubmit={form.handleSubmit(handleUpdate)}
        >
          <div className="flex w-full p-4 space-x-2">
            <FormField
              name={"name"}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name={"fee"}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Entry Fee</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="entry fee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-full flex items-center justify-end gap-3 mt-6">
            <Button disabled={isUpdating}>
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
            <Button variant="destructive" disabled={isUpdating}>
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </form>
      </Form>
      <ConfirmDeleteTournamentDialog
        open={showDeleteConfirm}
        onValueChange={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
