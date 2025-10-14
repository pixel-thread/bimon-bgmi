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
import { toast } from "sonner";
import { SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "@/src/utils/validation/tournament";
import { useActiveSeason } from "@/src/hooks/season/useActiveSeason";
import http from "@/src/utils/http";
import { Input } from "../ui/input";
import { useTournamentStore } from "@/src/store/tournament";

interface TournamentCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

type TournamentT = z.infer<typeof tournamentSchema>;

export default function TournamentCreateModal({
  showCreateModal,
  setShowCreateModal,
}: TournamentCreateModalProps) {
  const { isFetching: isLoading, data: activeSeason } = useActiveSeason();
  const { setTournamentId: setSelectedTournament } = useTournamentStore();
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
