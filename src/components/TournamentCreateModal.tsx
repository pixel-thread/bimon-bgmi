import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { useTournaments } from "@/src/hooks/useTournaments";
import { TournamentConfig, Season } from "@/src/lib/types";
import { toast } from "sonner";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useActiveSeason } from "../hooks/season/useActiveSeason";
import { SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { tournamentSchema } from "../utils/validation/tournament";
import { useMutation } from "@tanstack/react-query";
import http from "../utils/http";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";

interface TournamentCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  setSelectedTournament: (id: string | null) => void;
}

type TournamentT = z.infer<typeof tournamentSchema>;

export default function TournamentCreateModal({
  showCreateModal,
  setShowCreateModal,
  setSelectedTournament,
}: TournamentCreateModalProps) {
  const { isFetching: isLoading, data: activeSeason } = useActiveSeason();
  const form = useForm({
    resolver: zodResolver(tournamentSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TournamentT) =>
      http.post<{ id: string }>("/admin/tournament", data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setShowCreateModal(false);
        setSelectedTournament(data?.data?.id as string);
      }
    },
  });

  const onSubmit: SubmitHandler<TournamentT> = async (data) => mutate(data);

  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            This tournament will be linked to{" "}
            <strong>{activeSeason?.name || "Season 1"}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
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
                    {/* @ts-ignore */}
                    <Input type="date" placeholder="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button disabled={isLoading || isPending}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
