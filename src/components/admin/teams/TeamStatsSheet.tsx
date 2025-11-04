import { useEffect } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import http from "@/src/utils/http";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  TeamStatsForm,
  teamStatsSchema,
} from "@/src/utils/validation/team/team-stats";
import { toast } from "sonner";
import MatchSelector from "../../match/MatchSelector";

type Props = {
  open: string;
};

export function TeamStatsSheet({ open }: Props) {
  const router = useRouter();
  const { matchId } = useMatchStore();

  const form = useForm({
    resolver: zodResolver(teamStatsSchema),
    defaultValues: {
      matchId: matchId || "",
      players: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "players",
  });

  const { data: stats, isFetching } = useQuery({
    queryKey: ["teamStats", open, matchId],
    queryFn: () =>
      http.post<TeamStatsForm & { kills: number; deaths: number; kd: number }>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", open),
        { matchId },
      ),
    select: (res) => res.data,
    enabled: !!open && !!matchId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TeamStatsForm) =>
      http.put<TeamStatsForm>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", open),
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  // Reset form with fetched data when available
  useEffect(() => {
    if (stats) {
      form.reset({
        matchId: matchId,
        position: stats.position,
        players: stats.players,
      });
    }
  }, [stats, form]);

  const onValueChange = () => router.back();

  if (isFetching) return null;

  const onSubmit: SubmitHandler<TeamStatsForm> = (data) => mutate(data);

  return (
    <Sheet
      open={!!open && !isFetching && !!matchId}
      onOpenChange={onValueChange}
    >
      <SheetContent side="right" className="min-w-xl overflow-y-scroll">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex justify-center w-full space-y-5 p-2 flex-col items-center"
          >
            <SheetHeader>
              <SheetTitle>Team Stats</SheetTitle>
              <SheetDescription>
                Make changes to player stats here. Click save when done.
              </SheetDescription>
            </SheetHeader>
            <div className="gap-2 w-full grid grid-cols-1 md:grid-cols-3">
              <div>
                <h1 className="font-bold text-lg">Team Kill: {stats?.kills}</h1>
              </div>
              <div>
                <h1 className="font-bold text-lg">
                  Team Death: {stats?.deaths}
                </h1>
              </div>
              <div>
                <h1 className="font-bold text-lg">
                  Total Players: {stats?.players?.length}
                </h1>
              </div>
              <div>
                <h1 className="font-bold text-lg">
                  Team Position: {stats?.position}
                </h1>
              </div>
              <div>
                <h1 className="font-bold text-lg">
                  Team Kills/deaths: {stats?.kd}
                </h1>
              </div>
            </div>
            <MatchSelector isAllMatch={false} />
            <FormField
              control={form.control}
              name={`position`}
              render={({ field: rField }) => (
                <FormItem className="w-full">
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="min-w-full"
                      placeholder="Position"
                      {...rField}
                      min={0}
                      step={1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {fields.map((field, index) => (
              <div className="my-5 p-2 w-full" key={field.id}>
                <div className="grid p-2 grid-cols-1 w-full md:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <FormField
                      control={form.control}
                      name={`players.${index}.playerId`}
                      render={({ field: rField }) => (
                        <FormItem>
                          <FormLabel className="text-xl">
                            {index + 1}.
                            {stats?.players?.[index]?.name ??
                              `Player ${index + 1}`}
                          </FormLabel>
                          <FormControl>
                            <Input
                              disabled
                              className="hidden"
                              placeholder="Player ID"
                              {...rField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`players.${index}.kills`}
                    render={({ field: rField }) => (
                      <FormItem>
                        <FormLabel>Kills</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Kills"
                            {...rField}
                            min={0}
                            step={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`players.${index}.deaths`}
                    render={({ field: rField }) => (
                      <FormItem>
                        <FormLabel>Deaths</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Deaths"
                            {...rField}
                            min={0}
                            step={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`players.${index}.wins`}
                    render={({ field: rField }) => (
                      <FormItem>
                        <FormLabel>Wins</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Wins"
                            {...rField}
                            min={0}
                            step={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`players.${index}.wind2nd`}
                    render={({ field: rField }) => (
                      <FormItem>
                        <FormLabel>Win 2nd</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Win 2nd"
                            {...rField}
                            min={0}
                            step={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <SheetFooter>
              <Button
                disabled={isPending || isFetching}
                className="w-full"
                type="submit"
              >
                Save changes
              </Button>
              <SheetClose asChild>
                <Button className="w-full" variant="outline">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
