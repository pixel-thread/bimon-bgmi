import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface TeamStatsProps {
  selectedNoobs: string[];
  selectedPros: string[];
  teamMode: "Squad 4+1" | "Trio 3+1" | "Duo 2+1" | "Solo 1" | string;
}

function calculateTeamCount(
  teamMode: "Squad 4+1" | "Trio 3+1" | "Duo 2+1" | "Solo 1" | string,
  noobCount: number,
  proCount: number
) {
  if (teamMode === "Squad 4+1") {
    const proTeams = proCount;
    const noobTeams = Math.ceil(noobCount / 4);
    return Math.max(proTeams, noobTeams);
  } else if (teamMode === "Duo 2+1") {
    const possibleTeams = Math.min(proCount, Math.ceil(noobCount / 2));
    const remainingPros = proCount - possibleTeams;
    const remainingNoobs = noobCount - possibleTeams * 2;
    return possibleTeams + remainingPros + Math.ceil(remainingNoobs / 2);
  }
  return noobCount + proCount;
}

export default function TeamStats({
  selectedNoobs,
  selectedPros,
  teamMode,
}: TeamStatsProps) {
  const teamCount = calculateTeamCount(
    teamMode,
    selectedNoobs.length,
    selectedPros.length
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Selected Players</Label>
      <div className="flex gap-2">
        <Badge variant="secondary" className="px-3 py-1">
          {selectedNoobs.length} Noob{selectedNoobs.length !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          {selectedPros.length} Pro{selectedPros.length !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          {teamCount} Team{teamCount !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  );
}
