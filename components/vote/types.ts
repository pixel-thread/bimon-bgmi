import { Poll, PollVote, PollOption } from "@/lib/types";
import { TournamentParticipant } from "@/lib/tournamentParticipationService";

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
  poll: Poll;
  userVote?: PollVote;
  onVote: (pollId: string, option: string) => void;
  isDisabled: boolean;
  voteCounts?: Record<string, number>;
  loadingOption?: string;
  allVotes?: PollVote[];
  onShowVoters?: (pollId: string, pollQuestion: string, option: string) => void;
  isSaving?: boolean;
  // Unified component extras
  readOnly?: boolean;
  showViewAllVotes?: boolean;
  showAvatars?: boolean; // Add this prop to control avatar visibility
  // Admin actions (optional)
  showAdminActions?: boolean;
  onEditPoll?: (poll: Poll) => void;
  onDeletePoll?: (poll: Poll) => void;
  onTogglePollStatus?: (poll: Poll) => void;
  // Loading state for viewing votes
  isLoadingVotes?: boolean;
}

export interface TournamentParticipationCardProps {
  poll: Poll;
  userVote?: PollVote;
  onVote: (pollId: string, option: string) => void;
  isDisabled: boolean;
  loadingOption?: string;
  participants?: TournamentParticipant[];
  onShowVoters?: (pollId: string, pollQuestion: string, option: string) => void;
  allVotes?: PollVote[];
  voteCounts?: Record<string, number>;
}
