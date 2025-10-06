import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  orderBy,
  limit 
} from "firebase/firestore";
import { db } from "./firebase";
import { Player } from "./types";

export interface GameScore {
  gameId: string;
  score: number;
  timestamp: any; // Firestore timestamp
  playerId: string;
  playerName: string;
  metadata?: Record<string, any>;
}

export class GameScoreService {
  private readonly scoresCollection = "gameScores";
  private readonly playersCollection = "players";
  private readonly gamesCollection = "games";

  /**
   * Saves a player's score for a specific game
   */
  async saveScore(
    playerId: string,
    gameId: string,
    score: number,
    metadata: Record<string, any> = {}
  ): Promise<{saved: boolean; highScore: number; isNewHigh: boolean}> {
    try {
      // Get player data
      const playerRef = doc(db, this.playersCollection, playerId);
      const playerDoc = await getDoc(playerRef);
      
      if (!playerDoc.exists()) {
        throw new Error(`Player not found with ID: ${playerId}`);
      }
      
      const playerData = playerDoc.data() as Player;
      const playerName = playerData.name || 'Anonymous';

      // Get current high score
      const currentHighScore = await this.getPlayerHighScore(playerId, gameId);
      const isNewHighScore = score > currentHighScore;

      if (!isNewHighScore) {
        return {
          saved: false,
          highScore: currentHighScore,
          isNewHigh: false
        };
      }

      const gameScore: GameScore = {
        gameId,
        score,
        timestamp: serverTimestamp(),
        playerId,
        playerName,
        metadata: {
          ...metadata,
          isHighScore: true,
          previousHighScore: currentHighScore
        },
      };

      const scoreRef = doc(collection(db, this.scoresCollection));
      await setDoc(scoreRef, gameScore);

      await updateDoc(playerRef, {
        [`gameScores.${gameId}`]: {
          highScore: score,
          lastPlayed: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      
      return {
        saved: true,
        highScore: score,
        isNewHigh: true
      };
    } catch {
      throw new Error("Failed to save game score");
    }
  }

  /**
   * Updates a player's high score for a specific game if the new score is higher
   */
  private async updatePlayerHighScore(
    playerId: string,
    gameId: string,
    newScore: number
  ): Promise<number> {
    try {
      const playerRef = doc(db, this.playersCollection, playerId);
      const playerDoc = await getDoc(playerRef);
      
      if (!playerDoc.exists()) {
        return 0;
      }
      
      const playerData = playerDoc.data();
      const gameScores = playerData.gameScores || {};
      const currentHighScore = gameScores[gameId]?.highScore || 0;
      
      if (newScore > currentHighScore) {
        await updateDoc(playerRef, {
          [`gameScores.${gameId}`]: {
            highScore: newScore,
            lastPlayed: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
        return newScore;
      }
      
      await updateDoc(playerRef, {
        [`gameScores.${gameId}.lastPlayed`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return currentHighScore;
    } catch {
      throw new Error("Failed to update player high score");
    }
  }

  /**
   * Gets a player's high score for a specific game
   */
  async getPlayerHighScore(
    playerId: string,
    gameId: string
  ): Promise<number> {
    try {
      const playerDoc = await getDoc(doc(db, this.playersCollection, playerId));
      if (!playerDoc.exists()) return 0;
      
      const playerData = playerDoc.data();
      return playerData.gameScores?.[gameId]?.highScore || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Gets the leaderboard for a specific game
   */
  async getLeaderboard(
    gameId: string,
    limitCount: number = 10
  ): Promise<Array<{playerName: string; score: number, timestamp?: Date}>> {
    try {
      const playersRef = collection(db, this.playersCollection);
      const q = query(
        playersRef,
        where(`gameScores.${gameId}.highScore`, ">", 0)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard: Array<{playerName: string; score: number; timestamp?: Date}> = [];
      
      for (const doc of querySnapshot.docs) {
        const playerData = doc.data();
        const gameScores = playerData.gameScores || {};
        const gameScore = gameScores[gameId];
        
        if (gameScore?.highScore > 0) {
          leaderboard.push({
            playerName: playerData.name || `Player_${doc.id.slice(0, 6)}`,
            score: gameScore.highScore,
            timestamp: gameScore.lastPlayed?.toDate()
          });
        }
      }
      
      return leaderboard
        .sort((a, b) => {
          // First sort by score (descending)
          if (a.score !== b.score) {
            return b.score - a.score;
          }
          // If scores are equal, sort by timestamp (newest first)
          if (a.timestamp && b.timestamp) {
            return b.timestamp.getTime() - a.timestamp.getTime();
          }
          // If timestamps are not available, maintain original order
          return 0;
        })
        .slice(0, limitCount);
          
    } catch {
      // Fallback: use scores collection
      const scoresRef = collection(db, this.scoresCollection);
      const q = query(
        scoresRef,
        where("gameId", "==", gameId),
        where("score", ">", 0),
        orderBy("score", "desc"),
        limit(200)
      );

      const querySnapshot = await getDocs(q);
      const playerBestScores = new Map<string, {playerName: string; score: number; timestamp?: Date}>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const playerId = data.playerId;
        const score = data.score;
        const existing = playerBestScores.get(playerId);
        
        if (!existing || score > existing.score) {
          playerBestScores.set(playerId, {
            playerName: data.playerName || `Player_${playerId.slice(0, 6)}`,
            score: score,
            timestamp: data.timestamp?.toDate()
          });
        }
      });
      
      return Array.from(playerBestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limitCount);
    }
  }
}

// Export a singleton instance
export const gameScoreService = new GameScoreService();
