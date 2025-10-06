"use client";

import { FormEvent, useState, useEffect } from "react";
import { db } from "@/src/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/src/components/ui/card";
import { FiLoader, FiAlertCircle, FiCheckCircle, FiEdit } from "react-icons/fi";
import { getConfig, TournamentConfig } from "@/src/lib/config";

interface TeamData {
  phoneNumber: string;
  teamName: string;
  players: { ign: string }[];
  submittedAt: string;
}

interface TournamentEntryFormProps {
  // Expect a 10-digit string, e.g. "8837011018"
  phoneNumber: string;
}

export default function TournamentEntryForm({
  phoneNumber,
}: TournamentEntryFormProps) {
  const [loading, setLoading] = useState(true); // true until data is fetched

  const [teamName, setTeamName] = useState("");
  const [playerIgns, setPlayerIgns] = useState<string[]>(Array(5).fill("")); // Default 5 players
  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tournamentConfig, setTournamentConfig] = useState<TournamentConfig>({
    startDate: "",
    whatsappGroupLink: "",
    notificationMinutesBefore: 0,
  });

  // Fetch team data from Firestore.
  useEffect(() => {
    const normalizedPhoneNumber = `+91${phoneNumber}`;

    if (!normalizedPhoneNumber || normalizedPhoneNumber.length !== 13) {
      setError("Invalid phone number format");
      setLoading(false);
      return;
    }

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        const teamDoc = doc(db, "tournamentEntries", normalizedPhoneNumber);
        const docSnap = await getDoc(teamDoc);

        if (docSnap.exists()) {
          const teamData = docSnap.data() as TeamData;
          // Ensure data matches interface structure
          if (teamData.teamName && teamData.players) {
            setTeamName(teamData.teamName);
            // Pad the players array to ensure 5 inputs are always shown
            const fetchedPlayers = teamData.players.map((p) => p.ign);
            while (fetchedPlayers.length < 5) {
              fetchedPlayers.push("");
            }
            setPlayerIgns(fetchedPlayers);
            setIsExisting(true);
            setLastSubmitted(teamData.submittedAt);
            setIsEditing(false);
          } else {
            setError("Invalid team data structure in database");
          }
        } else {
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Failed to fetch team data:", err);
        setError(
          "Failed to load team data. Please refresh or try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [phoneNumber]);

  // Fetch tournament configuration if needed
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getConfig();
        setTournamentConfig(config);
        // Optionally adjust player count based on config.
      } catch (err) {
        console.error("Failed to fetch tournament config:", err);
      }
    };
    fetchConfig();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!teamName || !playerIgns[0]) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const teamData: TeamData = {
      phoneNumber, // Still the 10-digit version here, but...
      teamName,
      players: playerIgns.map((ign) => ({ ign })),
      submittedAt: now,
    };

    // When writing data, you should use the normalized phone number as the document ID.
    const normalizedPhoneNumber = `+91${phoneNumber}`;

    try {
      await setDoc(
        doc(db, "tournamentEntries", normalizedPhoneNumber),
        teamData
      );
      setIsExisting(true);
      setLastSubmitted(now);
      setSuccessMessage(
        isExisting
          ? "Team information updated successfully!"
          : "Team registered successfully!"
      );
      setIsEditing(false);
    } catch (err) {
      console.error("Error submitting team data:", err);
      setError("Failed to save team data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string =>
    dateString
      ? new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(dateString))
      : "";

  const formatTournamentDate = (dateString: string): string =>
    dateString
      ? new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(dateString))
      : "TBD";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-4">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-center">
            BGMI Tournament Registration
          </CardTitle>
          {isExisting && (
            <CardDescription className="text-center">
              {isEditing
                ? "Edit your team information"
                : "Your team is registered for the tournament"}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading team data...</span>
            </div>
          ) : (
            <>
              {successMessage && !isEditing && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <FiCheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-green-700">{successMessage}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {isExisting && !isEditing ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-md p-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-blue-800">
                        Registration Details
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-blue-600"
                      >
                        <FiEdit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Team Name
                        </p>
                        <p className="font-medium">{teamName}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Team Members
                        </p>
                        <ul className="space-y-1">
                          {playerIgns.map((ign, i) =>
                            ign ? (
                              <li key={i} className="font-medium">
                                {`Player ${i + 1}: `}
                                {ign}
                              </li>
                            ) : null
                          )}
                        </ul>
                      </div>
                      {lastSubmitted && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Last Updated
                          </p>
                          <p className="text-sm">{formatDate(lastSubmitted)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-md p-4 border border-yellow-100">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      Tournament Information
                    </h3>
                    <p className="text-sm">
                      The tournament will start on{" "}
                      {formatTournamentDate(tournamentConfig.startDate)}. You
                      will receive the room ID and password via SMS{" "}
                      {tournamentConfig.notificationMinutesBefore} minutes
                      before your scheduled match.
                      {tournamentConfig.whatsappGroupLink && (
                        <>
                          {" "}
                          Join our{" "}
                          <a
                            href={tournamentConfig.whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            WhatsApp group
                          </a>{" "}
                          for updates.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-sm font-medium">
                      Team Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-700">
                      Team Members
                    </h3>
                    {playerIgns.map((ign, i) => (
                      <div key={i} className="space-y-2">
                        <Label
                          htmlFor={`player-${i}`}
                          className="text-sm font-medium"
                        >
                          {`Player ${i + 1} IGN`}
                          {i === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type="text"
                          id={`player-${i}`}
                          value={ign}
                          onChange={(e) => {
                            const newIgns = [...playerIgns];
                            newIgns[i] = e.target.value;
                            setPlayerIgns(newIgns);
                          }}
                          className="w-full"
                          required={i === 0}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {isExisting && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {loading && (
                        <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {loading
                        ? "Submitting..."
                        : isExisting
                        ? "Update Team"
                        : "Register Team"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-0">
          <p className="text-xs text-gray-500">
            {isExisting
              ? "You can edit your team information anytime before the tournament starts"
              : "Once registered, you will receive tournament details via SMS"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
