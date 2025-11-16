import { DataTable } from "../../data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useTournamentWinner } from "@/src/hooks/winner/useTournamentWinner";
import { Card } from "../../teamManagementImports";
import { useSeasonStore } from "@/src/store/season";

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "tournamentName",
    header: "Tournament",
  },
  {
    header: "1st Place",
    accessorKey: "place1.teamName",
  },
  {
    header: "1st Prize",
    accessorKey: "place1.amount",
  },
  {
    header: "2nd Place",
    accessorKey: "place2.teamName",
  },

  {
    header: "2nd Prize",
    accessorKey: "place2.amount",
  },
];

export const AdminWinnerPage = () => {
  const { seasonId } = useSeasonStore();
  const { data, isFetching } = useTournamentWinner({ seasonId });
  return (
    <div>
      {seasonId && isFetching ? (
        <div>Loading...</div>
      ) : (
        <>
          <Card className="p-4">
            <DataTable data={data} columns={columns} />
          </Card>
        </>
      )}
    </div>
  );
};
