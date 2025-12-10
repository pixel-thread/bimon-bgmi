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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema } from "@/src/utils/validation/tournament";
import { useAppContext } from "@/src/hooks/context/useAppContext";
import http from "@/src/utils/http";
import { Input } from "../../ui/input";
import { useTournamentStore } from "@/src/store/tournament";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { useSeasonStore } from "@/src/store/season";
import { Ternary } from "../../common/Ternary";

interface TournamentCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

type TournamentT = z.infer<typeof tournamentSchema>;

export default function TournamentCreateModal({
  showCreateModal,
  setShowCreateModal,
}: TournamentCreateModalProps) {
  const { isLoading, activeSeason } = useAppContext();
  const { seasonId } = useSeasonStore();
  const { setTournamentId: setSelectedTournament } = useTournamentStore();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TournamentT) =>
      http.post<{ id: string }>(
        ADMIN_TOURNAMENT_ENDPOINTS.POST_CREATE_TOURNAMENT,
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setShowCreateModal(false);
        queryClient.invalidateQueries({ queryKey: ["tournaments", seasonId] });
        if (data && data?.data?.id) {
          setSelectedTournament(data?.data?.id);
        }
        return data;
      }
      toast.success(data.message);
    },
  });

  const onSubmit: SubmitHandler<TournamentT> = async (data) => mutate(data);

  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
        </DialogHeader>
        <Ternary
          condition={!activeSeason?.id}
          trueComponent={<div>Please create or select a season first</div>}
          falseComponent={
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="py-4">
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
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isLoading || !seasonId}
                  >
                    Cancel
                  </Button>
                  <Button disabled={isLoading || isPending}>
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
