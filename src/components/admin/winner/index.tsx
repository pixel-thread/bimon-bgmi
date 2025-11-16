import { DataTable } from "../../data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useTournamentWinner } from "@/src/hooks/winner/useTournamentWinner";
import { useTournamentStore } from "@/src/store/tournament";
import { Button } from "../../ui/stateful-button";
import { Card } from "../../teamManagementImports";

const columns: ColumnDef<any>[] = [
  {
    header: "Team Name",
    accessorKey: "teamName",
  },
  {
    header: "Place",
    accessorKey: "position",
  },
  {
    header: "Prize Amount",
    accessorKey: "amount",
  },
];

export const AdminWinnerPage = () => {
  const { tournamentId } = useTournamentStore();
  const { data, isFetching, refetch } = useTournamentWinner({ tournamentId });
  return (
    <div>
      {tournamentId && isFetching ? (
        <div>Loading...</div>
      ) : (
        <>
          <Button onClick={() => refetch()}>Refresh</Button>
          <Card className="p-4">
            <DataTable data={data} columns={columns} />
          </Card>
        </>
      )}
    </div>
  );
};
