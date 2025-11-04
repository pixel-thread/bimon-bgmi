import { PlayerPollVoteT, PollT } from "@/src/types/poll";

export interface VoteTabProps {
  readOnly?: boolean;
}

export interface VotersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: string;
}

export interface TournamentParticipationOptionProps {
  option: string;
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
  recentVoters?: PlayerPollVoteT[];
  totalVoters?: number;
  totalVotes?: number;
  showAvatars?: boolean; // Add this prop to control avatar visibility
  onClick: () => void;
}

export interface WhatsAppPollCardProps {
  poll: PollT;
}

export interface TournamentParticipationCardProps {
  poll: PollT;
}
