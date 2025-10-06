import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { MatchDropdown } from "@/src/components/MatchDropdown";

interface MatchSelectorProps {
  sequentialMatch: string;
  matchOptions: string[];
  setSequentialMatch: (match: string) => void;
  onAddMatch: () => void;
  totalPlayersPlayed: string;
  setTotalPlayersPlayed: (value: string) => void;
  totalKillsError: string;
}

export default function MatchSelector({
  sequentialMatch,
  matchOptions,
  setSequentialMatch,
  onAddMatch,
  totalPlayersPlayed,
  setTotalPlayersPlayed,
  totalKillsError,
}: MatchSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-row items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <Label className="text-base font-medium text-gray-700 w-12 sm:w-20 shrink-0">
            Match
          </Label>
          <MatchDropdown
            selected={sequentialMatch}
            options={matchOptions}
            onSelect={setSequentialMatch}
            onAddMatch={onAddMatch}
            className="w-24 sm:w-28 text-base"
          />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Label className="text-base font-medium text-gray-700 w-12 sm:w-20 shrink-0">
            Players
          </Label>
          <Input
            type="number"
            value={totalPlayersPlayed}
            onChange={(e) => setTotalPlayersPlayed(e.target.value)}
            placeholder="Total"
            className="w-20 sm:w-24 rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-base py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none touch-pinch-zoom-none"
          />
        </div>
      </div>
      {totalKillsError && (
        <p className="text-red-500 text-base">{totalKillsError}</p>
      )}
    </div>
  );
}
