import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { PollVote, TournamentConfig } from "./types";

export interface TournamentParticipant {
  id: string; // player ID
  documentId?: string; // firestore document id (playerId_tournamentId)
  playerName: string;
  status: "in" | "out" | "solo";
  votedAt: string;
  tournamentId: string;
}

export class TournamentParticipationService {
  private participantsCollection = collection(db, "tournament_participants");

  /**
   * Update player's tournament participation status
   */
  async updateParticipation(
    tournamentId: string,
    playerId: string,
    playerName: string,
    status: "in" | "out" | "solo"
  ): Promise<void> {
    try {
      const participantData: Omit<TournamentParticipant, "id"> = {
        playerName,
        status,
        votedAt: new Date().toISOString(),
        tournamentId,
      };

      // Use playerId + tournamentId as document ID to ensure uniqueness
      const docId = `${playerId}_${tournamentId}`;

      if (status === "out") {
        // Remove participant if they're out
        await deleteDoc(doc(this.participantsCollection, docId));
      } else {
        // Add or update participant
        await setDoc(doc(this.participantsCollection, docId), {
          id: playerId,
          ...participantData,
        });
      }
    } catch (error) {
      console.error("Error updating tournament participation:", error);
      throw new Error("Failed to update tournament participation");
    }
  }

  /**
   * Get all participants for a tournament
   */
  async getTournamentParticipants(
    tournamentId: string
  ): Promise<TournamentParticipant[]> {
    try {
      const participantsQuery = query(
        this.participantsCollection,
        where("tournamentId", "==", tournamentId)
      );

      const snapshot = await getDocs(participantsQuery);
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const playerId = data?.id || (docSnap.id.includes("_") ? docSnap.id.split("_")[0] : docSnap.id);
        const participant: TournamentParticipant = {
          id: playerId,
          documentId: docSnap.id,
          playerName: data?.playerName,
          status: data?.status,
          votedAt: data?.votedAt,
          tournamentId: data?.tournamentId,
        };
        return participant;
      });
    } catch (error) {
      console.error("Error fetching tournament participants:", error);
      throw new Error("Failed to fetch tournament participants");
    }
  }

  /**
   * Subscribe to tournament participants updates
   */
  subscribeToTournamentParticipants(
    tournamentId: string,
    callback: (participants: TournamentParticipant[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const participantsQuery = query(
      this.participantsCollection,
      where("tournamentId", "==", tournamentId)
    );

    return onSnapshot(
      participantsQuery,
      (snapshot) => {
        try {
          const participants = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as any;
            const playerId = data?.id || (docSnap.id.includes("_") ? docSnap.id.split("_")[0] : docSnap.id);
            const participant: TournamentParticipant = {
              id: playerId,
              documentId: docSnap.id,
              playerName: data?.playerName,
              status: data?.status,
              votedAt: data?.votedAt,
              tournamentId: data?.tournamentId,
            };
            return participant;
          });

          callback(participants);
        } catch (error) {
          console.error("Error parsing tournament participants:", error);
          onError?.(error as Error);
        }
      },
      (error) => {
        console.error("Error listening to tournament participants:", error);
        onError?.(error);
      }
    );
  }

  /**
   * Get player's participation status for a tournament
   */
  async getPlayerParticipationStatus(
    tournamentId: string,
    playerId: string
  ): Promise<TournamentParticipant | null> {
    try {
      const docId = `${playerId}_${tournamentId}`;
      const participantQuery = query(
        this.participantsCollection,
        where("id", "==", playerId),
        where("tournamentId", "==", tournamentId)
      );

      const snapshot = await getDocs(participantQuery);
      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as TournamentParticipant;
    } catch (error) {
      console.error("Error fetching player participation status:", error);
      throw new Error("Failed to fetch player participation status");
    }
  }

  /**
   * Convert poll vote to tournament participation
   */
  async handleTournamentPollVote(
    pollVote: PollVote,
    tournamentId: string,
    pollOptions?: any[]
  ): Promise<void> {
    let status: "in" | "out" | "solo";

    // If we have structured poll options, use the action
    if (
      pollOptions &&
      Array.isArray(pollOptions) &&
      pollOptions.length > 0 &&
      typeof pollOptions[0] === "object"
    ) {
      const selectedOption = pollOptions.find(
        (opt) => opt.text === pollVote.vote
      );
      if (selectedOption) {
        status =
          selectedOption.action === "in"
            ? "in"
            : selectedOption.action === "solo"
            ? "solo"
            : "out";
      } else {
        // Fallback to text analysis
        const vote = pollVote.vote.toLowerCase();
        if (vote.includes("in") && vote.includes("solo")) {
          status = "solo";
        } else if (vote.includes("in")) {
          status = "in";
        } else {
          status = "out";
        }
      }
    } else {
      // Fallback to text analysis for backward compatibility
      const vote = pollVote.vote.toLowerCase();
      if (vote.includes("in") && vote.includes("solo")) {
        status = "solo";
      } else if (vote.includes("in")) {
        status = "in";
      } else {
        status = "out";
      }
    }

    await this.updateParticipation(
      tournamentId,
      pollVote.playerId,
      pollVote.playerName,
      status
    );
  }
}

// Export singleton instance
export const tournamentParticipationService =
  new TournamentParticipationService();
