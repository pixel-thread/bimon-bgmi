// @ts-nocheck
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
import { useTeams } from "@/src/hooks/team/useTeams";
import {
  Select,
  SelectItem,
  SelectLabel,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "../../ui/select";
import { Ternary } from "../../common/Ternary";
import { LoaderFive, LoaderOne } from "../../ui/loader";

type Props = {
  teamId: string;
  open: boolean;
};

export function TeamStatsSheet({ teamId, open }: Props) {
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

  const { data: teams, isFetching: isTeamsFetching } = useTeams();

  const { data: stats, isFetching } = useQuery({
    queryKey: ["teamStats", teamId, matchId],
    queryFn: () =>
      http.post<TeamStatsForm & { kills: number; deaths: number; kd: number }>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", teamId),
        { matchId },
      ),
    select: (res) => res.data,
    enabled: !!teamId && !!matchId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TeamStatsForm) =>
      http.put<TeamStatsForm>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", teamId),
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

  const onSubmit: SubmitHandler<TeamStatsForm> = (data) => mutate(data);

  const onVlaueChagne = () => router.back();

  return (
    <Sheet open={open} onOpenChange={onVlaueChagne}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl overflow-y-scroll p-2"
      >
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
            <Ternary
              condition={!isFetching}
              trueComponent={
                <>
                  <div className="gap-2 w-full grid grid-cols-1 md:grid-cols-3">
                    <div>
                      <h1 className="font-bold text-lg">
                        Team Kill: {stats?.kills}
                      </h1>
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

                  <Select
                    value={teamId}
                    onValueChange={(value) =>
                      router.replace(`?teamStats=${value}`)
                    }
                  >
                    <SelectTrigger
                      disabled={isTeamsFetching}
                      className={"w-full min-w-[200px]"}
                    >
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {teams &&
                        teams?.map((team, index) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

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
                            {...rField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {fields.map((field, index) => (
                    <div className="my-5 p-2 w-full" key={field.id}>
                      <div className="grid p-2 grid-cols-1 w-full gap-4">
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
                </>
              }
              falseComponent={
                <div className="py-20">
                  <LoaderFive text="Loading team stats..." />
                </div>
              }
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
