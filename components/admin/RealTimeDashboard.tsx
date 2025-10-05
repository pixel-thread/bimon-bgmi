"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { pollService } from "@/lib/pollService";
import { Poll, PollVote } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import {
  FiActivity,
  FiUsers,
  FiBarChart,
  FiClock,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { ErrorHandler, handleAsync } from "@/lib/errorHandling";

interface ActivityItem {
  id: string;
  type: "vote" | "poll_created" | "poll_activated" | "poll_deactivated";
  message: string;
  timestamp: string;
  pollId?: string;
  playerId?: string;
}

interface DashboardStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  recentVotes: number;
  uniqueVoters: number;
}

export const RealTimeDashboard: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [allVotes, setAllVotes] = useState<PollVote[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
    recentVotes: 0,
    uniqueVoters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);

  const { role } = useAuth();

  // Notifications removed

  // Set up real-time listeners
  useEffect(() => {
    if (!isMonitoring) return;

    setLoading(true);
    setError(null);

    // Listen to all polls
    const unsubscribePolls = pollService.subscribeToAllPolls(
      (pollsData) => {
        setPolls(pollsData);
        updateActivityFromPolls(pollsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        const appError = ErrorHandler.handle(error, {
          operation: "listen_to_dashboard_polls",
        });
        console.error("Error listening to dashboard polls:", appError);
        setError("Failed to connect to polls");
        setLoading(false);
      }
    );

    // Listen to all votes
    const unsubscribeVotes = pollService.subscribeToAllVotes(
      (votesData) => {
        setAllVotes(votesData);
        updateActivityFromVotes(votesData);
      },
      (error) => {
        const appError = ErrorHandler.handle(error, {
          operation: "listen_to_dashboard_votes",
        });
        console.error("Error listening to dashboard votes:", appError);
      }
    );

    return () => {
      unsubscribePolls();
      unsubscribeVotes();
    };
  }, [isMonitoring]);

  // Update stats when polls or votes change
  useEffect(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentVotes = allVotes.filter(
      (vote) => new Date(vote.votedAt) > oneHourAgo
    );

    const uniqueVoters = new Set(allVotes.map((vote) => vote.playerId)).size;

    setStats({
      totalPolls: polls.length,
      activePolls: polls.filter((poll) => poll.isActive).length,
      totalVotes: allVotes.length,
      recentVotes: recentVotes.length,
      uniqueVoters,
    });
  }, [polls, allVotes]);

  // Update activity from polls changes
  const updateActivityFromPolls = (pollsData: Poll[]) => {
    // This is a simplified approach - in a real app you'd track changes more precisely
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentPolls = pollsData.filter(
      (poll) => new Date(poll.createdAt) > fiveMinutesAgo
    );

    const pollActivities: ActivityItem[] = recentPolls.map((poll) => ({
      id: `poll-created-${poll.id}`,
      type: "poll_created",
      message: `New poll created: "${poll.question.substring(0, 50)}${
        poll.question.length > 50 ? "..." : ""
      }"`,
      timestamp: poll.createdAt,
      pollId: poll.id,
    }));

    setRecentActivity((prev) => {
      const combined = [...pollActivities, ...prev];
      const unique = combined.filter(
        (item, index, self) => self.findIndex((i) => i.id === item.id) === index
      );
      return unique
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20);
    });
  };

  // Update activity from votes changes
  const updateActivityFromVotes = (votesData: PollVote[]) => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentVotes = votesData.filter(
      (vote) => new Date(vote.votedAt) > fiveMinutesAgo
    );

    const voteActivities: ActivityItem[] = recentVotes.map((vote) => ({
      id: `vote-${vote.id}`,
      type: "vote",
      message: `${vote.playerName} voted "${vote.vote}"`,
      timestamp: vote.votedAt,
      pollId: vote.pollId,
      playerId: vote.playerId,
    }));

    setRecentActivity((prev) => {
      const combined = [...voteActivities, ...prev];
      const unique = combined.filter(
        (item, index, self) => self.findIndex((i) => i.id === item.id) === index
      );
      return unique
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20);
    });
  };

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      setError(null);
    }
  };

  // Refresh data manually
  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [pollsResult, pollsError] = await handleAsync(
        pollService.getAllPolls(),
        { operation: "refresh_dashboard_polls" }
      );

      if (pollsError) {
        ErrorHandler.showError(pollsError);
        setError("Failed to refresh data");
        return;
      }

      setPolls(pollsResult || []);
      ErrorHandler.showSuccess("Dashboard data refreshed");
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "refresh_dashboard",
      });
      ErrorHandler.showError(appError);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "vote":
        return <FiBarChart className="h-4 w-4 text-blue-500" />;
      case "poll_created":
        return <FiActivity className="h-4 w-4 text-green-500" />;
      case "poll_activated":
        return <FiEye className="h-4 w-4 text-green-500" />;
      case "poll_deactivated":
        return <FiEyeOff className="h-4 w-4 text-red-500" />;
      default:
        return <FiActivity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && polls.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Real-Time Dashboard</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor poll activity and voting in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications removed */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMonitoring}
            className={isMonitoring ? "text-green-600" : "text-red-600"}
          >
            {isMonitoring ? (
              <>
                <FiEye className="mr-2 h-4 w-4" />
                Monitoring
              </>
            ) : (
              <>
                <FiEyeOff className="mr-2 h-4 w-4" />
                Paused
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <FiActivity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <FiEye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activePolls}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <FiBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Votes</CardTitle>
            <FiClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.recentVotes}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Voters</CardTitle>
            <FiUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVoters}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiActivity className="h-5 w-5" />
            Recent Activity
            {isMonitoring && (
              <Badge variant="secondary" className="ml-2">
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  {index < recentActivity.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Polls Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Polls Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {polls.filter((poll) => poll.isActive).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active polls
            </div>
          ) : (
            <div className="space-y-4">
              {polls
                .filter((poll) => poll.isActive)
                .slice(0, 5)
                .map((poll) => (
                  <div
                    key={poll.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{poll.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {poll.type.replace("_", " ")}
                        </Badge>
                        {poll.expiresAt && (
                          <Badge variant="secondary" className="text-xs">
                            <FiClock className="mr-1 h-3 w-3" />
                            Expires{" "}
                            {new Date(poll.expiresAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDashboard;
