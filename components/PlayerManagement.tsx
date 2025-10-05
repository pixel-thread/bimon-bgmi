"use client";

import { useState, useRef, useEffect } from "react";
import { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface PlayerManagementProps {
  players: {
    ultraNoobs: Player[];
    noobs: Player[];
    pros: Player[];
    ultraPros: Player[];
  };
  addPlayer: (player: Player) => Promise<void>;
}

export default function PlayerManagement({
  players,
  addPlayer,
}: PlayerManagementProps) {
  const [newPlayer, setNewPlayer] = useState<Player>({
    id: "",
    name: "",
    category: "Noob",
    phoneNumber: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playersState, setPlayers] = useState<{
    ultraNoobs: Player[];
    noobs: Player[];
    pros: Player[];
    ultraPros: Player[];
  }>(players);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlayers(players);
    setIsLoadingPlayers(false);
  }, [players]);

  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim()) {
      toast.error("Player name cannot be empty.", { duration: 3000 });
      return;
    }

    setIsAdding(true);
    const playerId = `${newPlayer.category
      .toLowerCase()
      .replace(" ", "_")}_${newPlayer.name
      .replace(/\s+/g, "_")
      .toLowerCase()}_${Date.now()}`;
    const playerData = { ...newPlayer, id: playerId };

    try {
      await setDoc(doc(db, "players", playerId), {
        name: playerData.name,
        category: playerData.category,
        phoneNumber: playerData.phoneNumber || null,
        createdAt: new Date().toISOString(),
      });

      await addPlayer(playerData);

      toast.success(
        `${playerData.name} added to ${playerData.category} category.`,
        { duration: 2000 }
      );

      setPlayers((prev) => ({
        ultraNoobs:
          playerData.category === "Ultra Noob"
            ? [...prev.ultraNoobs, playerData]
            : prev.ultraNoobs,
        noobs:
          playerData.category === "Noob"
            ? [...prev.noobs, playerData]
            : prev.noobs,
        pros:
          playerData.category === "Pro"
            ? [...prev.pros, playerData]
            : prev.pros,
        ultraPros:
          playerData.category === "Ultra Pro"
            ? [...prev.ultraPros, playerData]
            : prev.ultraPros,
      }));

      setNewPlayer({ id: "", name: "", category: "Noob", phoneNumber: "" });

      setTimeout(() => nameInputRef.current?.focus(), 100);
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player. Please try again.", {
        duration: 3000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePlayer = async (
    category: "Ultra Noob" | "Noob" | "Pro" | "Ultra Pro",
    playerId: string
  ) => {
    try {
      // Soft delete to preserve references
      await updateDoc(doc(db, "players", playerId), {
        deleted: true,
        deletedAt: new Date().toISOString(),
      });

      setPlayers((prev) => ({
        ultraNoobs:
          category === "Ultra Noob"
            ? prev.ultraNoobs.filter((p) => p.id !== playerId)
            : prev.ultraNoobs,
        noobs:
          category === "Noob"
            ? prev.noobs.filter((p) => p.id !== playerId)
            : prev.noobs,
        pros:
          category === "Pro"
            ? prev.pros.filter((p) => p.id !== playerId)
            : prev.pros,
        ultraPros:
          category === "Ultra Pro"
            ? prev.ultraPros.filter((p) => p.id !== playerId)
            : prev.ultraPros,
      }));

      toast.success("Player deleted successfully.", { duration: 2000 });
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player. Please try again.", {
        duration: 3000,
      });
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer || !editingPlayer.name.trim()) {
      toast.error("Player name cannot be empty.", { duration: 3000 });
      return;
    }
    try {
      const phone = editingPlayer.phoneNumber
        ? "+91 " + editingPlayer.phoneNumber.replace(/^\+91\s*/, "")
        : "";
      const updatedData = {
        name: editingPlayer.name,
        phoneNumber: phone,
      };
      await setDoc(doc(db, "players", editingPlayer.id), updatedData, {
        merge: true,
      });

      setPlayers((prev) => ({
        ultraNoobs:
          editingPlayer.category === "Ultra Noob"
            ? prev.ultraNoobs.map((p) =>
                p.id === editingPlayer.id
                  ? { ...p, ...updatedData, phoneNumber: phone }
                  : p
              )
            : prev.ultraNoobs,
        noobs:
          editingPlayer.category === "Noob"
            ? prev.noobs.map((p) =>
                p.id === editingPlayer.id
                  ? { ...p, ...updatedData, phoneNumber: phone }
                  : p
              )
            : prev.noobs,
        pros:
          editingPlayer.category === "Pro"
            ? prev.pros.map((p) =>
                p.id === editingPlayer.id
                  ? { ...p, ...updatedData, phoneNumber: phone }
                  : p
              )
            : prev.pros,
        ultraPros:
          editingPlayer.category === "Ultra Pro"
            ? prev.ultraPros.map((p) =>
                p.id === editingPlayer.id
                  ? { ...p, ...updatedData, phoneNumber: phone }
                  : p
              )
            : prev.ultraPros,
      }));

      toast.success("Player updated successfully.", { duration: 2000 });
      setEditingPlayer(null);
    } catch (error) {
      console.error("Error updating player:", error);
      toast.error("Failed to update player. Please try again.", {
        duration: 3000,
      });
    }
  };

  const displayedPlayers =
    newPlayer.category === "Ultra Noob"
      ? playersState.ultraNoobs
      : newPlayer.category === "Noob"
      ? playersState.noobs
      : newPlayer.category === "Pro"
      ? playersState.pros
      : playersState.ultraPros;

  if (isLoadingPlayers) {
    return (
      <div className="text-center p-4 animate-pulse">Loading players...</div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Player
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddPlayer();
            }}
            className="grid gap-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="player-name"
                className="text-sm font-medium text-gray-700"
              >
                Player Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="player-name"
                value={newPlayer.name}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, name: e.target.value })
                }
                placeholder="Enter player name"
                disabled={isAdding}
                className="w-full"
                ref={nameInputRef}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="player-category"
                className="text-sm font-medium text-gray-700"
              >
                Category
              </Label>
              <Select
                value={newPlayer.category}
                onValueChange={(value) =>
                  setNewPlayer({
                    ...newPlayer,
                    category: value as
                      | "Ultra Noob"
                      | "Noob"
                      | "Pro"
                      | "Ultra Pro",
                  })
                }
                disabled={isAdding}
              >
                <SelectTrigger id="player-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ultra Noob">Ultra Noob</SelectItem>
                  <SelectItem value="Noob">Noob</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Ultra Pro">Ultra Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="player-phone"
                className="text-sm font-medium text-gray-700"
              >
                Phone Number (Optional)
              </Label>
              <Input
                id="player-phone"
                value={newPlayer.phoneNumber || ""}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, phoneNumber: e.target.value })
                }
                placeholder="Enter phone number"
                disabled={isAdding}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={isAdding}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <FiPlus className="h-4 w-4" />
              {isAdding ? "Adding..." : "Add Player"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {newPlayer.category} Players ({displayedPlayers.length})
          </h3>
          {displayedPlayers.length === 0 ? (
            <p className="text-sm text-gray-500">
              No {newPlayer.category} players added yet.
            </p>
          ) : (
            <ScrollArea className="h-64 w-full">
              <ul className="space-y-2">
                {displayedPlayers.map((player) => (
                  <motion.li
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {editingPlayer && editingPlayer.id === player.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          type="text"
                          value={editingPlayer.name || ""}
                          onChange={(e) =>
                            setEditingPlayer({
                              ...editingPlayer,
                              name: e.target.value,
                            })
                          }
                          placeholder="Player Name"
                          className="w-full"
                        />
                        <div className="flex items-center">
                          <span className="mr-2 font-medium">+91</span>
                          <Input
                            type="text"
                            value={editingPlayer.phoneNumber || ""}
                            onChange={(e) =>
                              setEditingPlayer({
                                ...editingPlayer,
                                phoneNumber: e.target.value,
                              })
                            }
                            placeholder="Enter phone number"
                            className="w-full"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={handleUpdatePlayer}
                            variant="outline"
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingPlayer(null)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="cursor-pointer"
                          onClick={() => setEditingPlayer(player)}
                        >
                          <span className="font-medium">{player.name}</span>
                          {player.phoneNumber && (
                            <span className="text-sm text-gray-600 block">
                              {player.phoneNumber.startsWith("+91")
                                ? player.phoneNumber
                                : `+91 ${player.phoneNumber}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPlayer(player);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlayer(
                                player.category as
                                  | "Ultra Noob"
                                  | "Noob"
                                  | "Pro"
                                  | "Ultra Pro",
                                player.id
                              );
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
