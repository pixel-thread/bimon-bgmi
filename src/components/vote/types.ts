import { Poll, PollVote, PollOption } from "@/src/lib/types";
import { TournamentParticipant } from "@/src/lib/tournamentParticipationService";
import { PollT } from "@/src/types/poll";

export interface VoteTabProps {
  readOnly?: boolean;
}

export interface VotersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: string;
  pollQuestion: string;
  option: string;
  allVotes: PollVote[];
  voteCounts: Record<string, number>;
}

export interface TournamentParticipationOptionProps {
  option: string | PollOption;
  isSelected: boolean;
  isDisabled: boolean;
  isLoading?: boolean;
  participantCount: number;
  onClick: () => void;
}

export interface PollOptionProps {
  id: string;
  value: "IN" | "OUT" | "SOLO";
  option: string;
  isSelected: boolean;
  isDisabled: boolean;
  showResults: boolean;
  isLoading?: boolean;
  recentVoters?: PollVote[];
  totalVoters?: number;
  totalVotes?: number;
  showAvatars?: boolean; // Add this prop to control avatar visibility
  onClick: () => void;
}

export interface WhatsAppPollCardProps {
  poll: PollT;
  userVote?: PollVote;
  isDisabled: boolean;
  voteCounts?: Record<string, number>;
  loadingOption?: string;
  allVotes?: PollVote[];
  onShowVoters?: (pollId: string, pollQuestion: string, option: string) => void;
  isSaving?: boolean;
  readOnly?: boolean;
  showViewAllVotes?: boolean;
  showAvatars?: boolean; // Add this prop to control avatar visibility
  showAdminActions?: boolean;
  isLoadingVotes?: boolean;
}

export interface TournamentParticipationCardProps {
  poll: PollT;
  userVote?: PollVote;
  onVote: (pollId: string, option: string) => void;
  isDisabled: boolean;
  loadingOption?: string;
  participants?: TournamentParticipant[];
  onShowVoters?: (pollId: string, pollQuestion: string, option: string) => void;
  allVotes?: PollVote[];
  voteCounts?: Record<string, number>;
}
