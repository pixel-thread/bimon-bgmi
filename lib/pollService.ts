import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Poll, PollVote } from "./types";
import { tournamentParticipationService } from "./tournamentParticipationService";

export class PollService {
  private pollsCollection = collection(db, "polls");
  private votesCollection = collection(db, "poll_votes");

  /**
   * Subscribe to real-time updates for active polls
   */
  subscribeToActivePolls(
    callback: (polls: Poll[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const activeQuery = query(
      this.pollsCollection,
      where("isActive", "==", true)
    );

    let lastPollsHash = "";
    let isFirstLoad = true;

    return onSnapshot(
      activeQuery,
      (snapshot) => {
        try {
          const polls = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Poll[];

          // Create a hash to check if data actually changed
          const currentHash = polls
            .map((p) => `${p.id}-${p.isActive}-${p.createdAt}`)
            .join("|");

          // Always call callback on first load or when data changes
          if (isFirstLoad || currentHash !== lastPollsHash) {
            isFirstLoad = false;
            lastPollsHash = currentHash;
            const sortedPolls = polls.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            callback(sortedPolls);
          }
        } catch (error) {
          console.error("Error parsing active polls snapshot:", error);
          onError?.(error as Error);
        }
      },
      (error) => {
        console.error("Error listening to active polls:", error);
        onError?.(error);
      }
    );
  }

  /**
   * Subscribe to real-time updates for all polls (admin view)
   */
  subscribeToAllPolls(
    callback: (polls: Poll[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const allQuery = query(this.pollsCollection);

    let lastPollsHash = "";
    let isFirstLoad = true;

    return onSnapshot(
      allQuery,
      (snapshot) => {
        try {
          const polls = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Poll[];

          // Create a hash to check if data actually changed
          const currentHash = polls
            .map((p) => `${p.id}-${p.isActive}-${p.createdAt}`)
            .join("|");

          // Always call callback on first load or when data changes
          if (isFirstLoad || currentHash !== lastPollsHash) {
            isFirstLoad = false;
            lastPollsHash = currentHash;
            const sortedPolls = polls.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            callback(sortedPolls);
          }
        } catch (error) {
          console.error("Error parsing all polls snapshot:", error);
          onError?.(error as Error);
        }
      },
      (error) => {
        console.error("Error listening to all polls:", error);
        onError?.(error);
      }
    );
  }

  /**
   * Subscribe to real-time updates for poll votes
   */
  subscribeToPollVotes(
    pollId: string,
    callback: (votes: PollVote[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const votesQuery = query(
      this.votesCollection,
      where("pollId", "==", pollId)
    );

    let lastVotesHash = "";
    let isFirstLoad = true;

    return onSnapshot(
      votesQuery,
      (snapshot) => {
        try {
          const votes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PollVote[];

          // Create a hash to check if data actually changed
          const currentHash = votes
            .map((v) => `${v.id}-${v.playerId}-${v.votedAt}`)
            .join("|");

          // Always call callback on first load or when data changes
          if (isFirstLoad || currentHash !== lastVotesHash) {
            isFirstLoad = false;
            lastVotesHash = currentHash;
            const sortedVotes = votes.sort(
              (a, b) =>
                new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()
            );
            callback(sortedVotes);
          }
        } catch (error) {
          console.error("Error parsing poll votes snapshot:", error);
          onError?.(error as Error);
        }
      },
      (error) => {
        console.error("Error listening to poll votes:", error);
        onError?.(error);
      }
    );
  }

  /**
   * Subscribe to real-time updates for user's votes
   */
  subscribeToUserVotes(
    playerId: string,
    callback: (votes: Record<string, PollVote>) => void,
    onError?: (error: Error) => void
  ): () => void {
    const votesQuery = query(
      this.votesCollection,
      where("playerId", "==", playerId)
    );

    return onSnapshot(
      votesQuery,
      (snapshot) => {
        try {
          const votes: Record<string, PollVote> = {};
          snapshot.docs.forEach((doc) => {
            const vote = { id: doc.id, ...doc.data() } as PollVote;
            votes[vote.pollId] = vote;
          });
          callback(votes);
        } catch (error) {
          console.error("Error parsing user votes snapshot:", error);
          onError?.(error as Error);
        }
      },
      (error) => {
        console.error("Error listening to user votes:", error);
        onError?.(error);
      }
    );
  }

  /**
   * Subscribe to real-time vote counts for a specific poll
   */
  subscribeToVoteCounts(
    pollId: string,
    callback: (counts: Record<string, number>) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.subscribeToPollVotes(
      pollId,
      (votes) => {
        const counts: Record<string, number> = {};
        votes.forEach((vote) => {
          counts[vote.vote] = (counts[vote.vote] || 0) + 1;
        });
        callback(counts);
      },
      onError
    );
  }

  /**
   * Subscribe to real-time updates for all votes (admin monitoring)
   */
  subscribeToAllVotes(
    callback: (votes: PollVote[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const allVotesQuery = query(this.votesCollection);

    return onSnapshot(
      allVotesQuery,
      (snapshot) => {
        try {
          const votes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PollVote[];

          const sortedVotes = votes.sort(
            (a, b) =>
              new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()
          );

          callback(sortedVotes);
        } catch (error) {
          console.error("Error parsing all votes snapshot:", error);
          onError?.(error as Error);
        }
      },
      (error) => {
        console.error("Error listening to all votes:", error);
        onError?.(error);
      }
    );
  }

  /**
   * Create a new poll
   */
  async createPoll(pollData: Omit<Poll, "id" | "createdAt">): Promise<string> {
    try {
      const poll: Omit<Poll, "id"> = {
        ...pollData,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(this.pollsCollection, poll);
      return docRef.id;
    } catch (error) {
      console.error("Error creating poll:", error);
      throw new Error("Failed to create poll");
    }
  }

  /**
   * Update an existing poll
   */
  async updatePoll(id: string, updates: Partial<Poll>): Promise<void> {
    try {
      const pollRef = doc(this.pollsCollection, id);
      await updateDoc(pollRef, updates);
    } catch (error) {
      console.error("Error updating poll:", error);
      throw new Error("Failed to update poll");
    }
  }

  /**
   * Delete a poll and all associated votes
   */
  async deletePoll(id: string): Promise<void> {
    try {
      // First delete all votes for this poll
      const votesQuery = query(this.votesCollection, where("pollId", "==", id));
      const votesSnapshot = await getDocs(votesQuery);

      const deletePromises = votesSnapshot.docs.map((voteDoc) =>
        deleteDoc(doc(this.votesCollection, voteDoc.id))
      );
      await Promise.all(deletePromises);

      // Then delete the poll itself
      const pollRef = doc(this.pollsCollection, id);
      await deleteDoc(pollRef);
    } catch (error) {
      console.error("Error deleting poll:", error);
      throw new Error("Failed to delete poll");
    }
  }

  /**
   * Get all active polls for the voting interface
   */
  async getActivePolls(): Promise<Poll[]> {
    try {
      const activeQuery = query(
        this.pollsCollection,
        where("isActive", "==", true)
      );

      const snapshot = await getDocs(activeQuery);
      const polls = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Poll[];

      return polls.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error fetching active polls:", error);
      throw new Error("Failed to fetch active polls");
    }
  }

  /**
   * Get poll results with vote counts for admin dashboard
   */
  async getPollResults(pollId: string): Promise<PollVote[]> {
    try {
      const votesQuery = query(
        this.votesCollection,
        where("pollId", "==", pollId)
      );

      const snapshot = await getDocs(votesQuery);
      const votes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PollVote[];

      return votes.sort(
        (a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()
      );
    } catch (error) {
      console.error("Error fetching poll results:", error);
      throw new Error("Failed to fetch poll results");
    }
  }

  /**
   * Submit or update a vote for a poll
   */
  async submitVote(
    pollId: string,
    playerId: string,
    playerName: string,
    vote: string
  ): Promise<void> {
    try {
      // Verify poll exists and is active
      const pollRef = doc(this.pollsCollection, pollId);
      const pollDoc = await getDoc(pollRef);

      if (!pollDoc.exists()) {
        throw new Error("Poll not found");
      }

      const pollData = pollDoc.data() as Poll;
      if (!pollData.isActive) {
        throw new Error("Poll is not active");
      }

      // Check if poll has expired
      if (pollData.expiresAt) {
        const expiresAt = new Date(pollData.expiresAt);
        const now = new Date();
        if (expiresAt < now) {
          throw new Error("Poll has expired");
        }
      }

      // Get player's avatar (prefer Base64 over URL)
      let avatarBase64: string | null = null;
      let avatarUrl: string | null = null;
      try {
        const playerRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerRef);
        if (playerDoc.exists()) {
          const playerData = playerDoc.data();
          avatarBase64 = playerData.avatarBase64 || null;
          avatarUrl = playerData.avatarUrl || null; // Fallback for backward compatibility
        }
      } catch (error) {
        // Continue without avatar if player fetch fails
        console.warn("Could not fetch player avatar:", error);
      }

      // Check if player has already voted
      const existingVoteQuery = query(
        this.votesCollection,
        where("pollId", "==", pollId),
        where("playerId", "==", playerId)
      );

      const existingVoteSnapshot = await getDocs(existingVoteQuery);

      if (!existingVoteSnapshot.empty) {
        // Update existing vote
        const existingVoteDoc = existingVoteSnapshot.docs[0];
        const updateData: any = {
          vote,
          votedAt: new Date().toISOString(),
        };
        
        // Only include avatar fields if they have values
        if (avatarBase64 !== null) updateData.avatarBase64 = avatarBase64;
        if (avatarUrl !== null) updateData.avatarUrl = avatarUrl;
        
        await updateDoc(doc(this.votesCollection, existingVoteDoc.id), updateData);
      } else {
        // Create new vote
        const voteData: any = {
          pollId,
          playerId,
          playerName,
          vote,
          votedAt: new Date().toISOString(),
        };
        
        // Only include avatar fields if they have values
        if (avatarBase64 !== null) voteData.avatarBase64 = avatarBase64;
        if (avatarUrl !== null) voteData.avatarUrl = avatarUrl;

        await addDoc(this.votesCollection, voteData);
      }

      // Handle tournament participation if this is a tournament poll
      if (
        pollData.type === "tournament_participation" &&
        pollData.tournamentId
      ) {
        const pollVote: PollVote = {
          id: "temp", // Will be replaced by actual ID
          pollId,
          playerId,
          playerName,
          vote,
          votedAt: new Date().toISOString(),
          avatarBase64: avatarBase64 || undefined,
          avatarUrl: avatarUrl || undefined,
        };

        await tournamentParticipationService.handleTournamentPollVote(
          pollVote,
          pollData.tournamentId,
          pollData.options
        );
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      throw error;
    }
  }

  /**
   * Remove a player's vote from a poll
   */
  async removeVote(pollId: string, playerId: string): Promise<void> {
    try {
      // Find the existing vote
      const existingVoteQuery = query(
        this.votesCollection,
        where("pollId", "==", pollId),
        where("playerId", "==", playerId)
      );

      const existingVoteSnapshot = await getDocs(existingVoteQuery);

      if (!existingVoteSnapshot.empty) {
        // Delete the existing vote
        const existingVoteDoc = existingVoteSnapshot.docs[0];
        await deleteDoc(doc(this.votesCollection, existingVoteDoc.id));

        // Handle tournament participation removal if this is a tournament poll
        const pollRef = doc(this.pollsCollection, pollId);
        const pollDoc = await getDoc(pollRef);

        if (pollDoc.exists()) {
          const pollData = pollDoc.data() as Poll;
          if (
            pollData.type === "tournament_participation" &&
            pollData.tournamentId
          ) {
            // Get the player's name from the existing vote before removing it
            const existingVoteData = existingVoteDoc.data();
            await tournamentParticipationService.updateParticipation(
              pollData.tournamentId,
              playerId,
              existingVoteData.playerName,
              "out"
            );
          }
        }
      }
    } catch (error) {
      console.error("Error removing vote:", error);
      throw error;
    }
  }

  /**
   * Remove all votes for a specific player across all polls
   * @param playerId - ID of the player whose votes should be removed
   */
  async removeAllVotesForPlayer(playerId: string): Promise<void> {
    try {
      const votesQuery = query(
        this.votesCollection,
        where("playerId", "==", playerId)
      );
      const querySnapshot = await getDocs(votesQuery);
      
      // Delete all votes in parallel
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error removing player votes:", error);
      throw new Error("Failed to remove player votes");
    }
  }

  /**
   * Check if a player has already voted on a specific poll
   */
  async hasPlayerVoted(pollId: string, playerId: string): Promise<boolean> {
    try {
      const voteQuery = query(
        this.votesCollection,
        where("pollId", "==", pollId),
        where("playerId", "==", playerId)
      );

      const snapshot = await getDocs(voteQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking if player has voted:", error);
      throw new Error("Failed to check voting status");
    }
  }

  /**
   * Get all polls (for admin interface)
   */
  async getAllPolls(): Promise<Poll[]> {
    try {
      const allQuery = query(this.pollsCollection);
      const snapshot = await getDocs(allQuery);

      const polls = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Poll[];

      return polls.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error fetching all polls:", error);
      throw new Error("Failed to fetch polls");
    }
  }

  /**
   * Get vote counts aggregated by option for a specific poll
   */
  async getVoteCounts(pollId: string): Promise<Record<string, number>> {
    try {
      const votes = await this.getPollResults(pollId);
      const counts: Record<string, number> = {};

      votes.forEach((vote) => {
        counts[vote.vote] = (counts[vote.vote] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error("Error getting vote counts:", error);
      throw new Error("Failed to get vote counts");
    }
  }
}

// Export a singleton instance
export const pollService = new PollService();
