/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoteTab } from "../vote";

// Mock all external dependencies
vi.mock("@/src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/src/lib/pollService", () => ({
  pollService: {
    getActivePolls: vi.fn(),
    getPollResults: vi.fn(),
    submitVote: vi.fn(),
    hasPlayerVoted: vi.fn(),
  },
}));

vi.mock("@/src/lib/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return vi.fn();
  }),
}));

import { useAuth } from "@/src/hooks/useAuth";

const mockPlayerUser = {
  id: "player1",
  name: "Test Player",
  hasVoted: false,
  loginPassword: "password123",
};

describe("VoteTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows login required message for non-player users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthorized: false,
      role: "none",
      username: "",
      displayName: "",
      playerUser: null,
      authType: null,
      isPlayer: false,
      loginAsPlayer: vi.fn(),
      logout: vi.fn(),
      refreshAuthState: vi.fn(),
    });

    render(<VoteTab />);

    expect(screen.getByText("Player Login Required")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please log in as a player to participate in tournament voting."
      )
    ).toBeInTheDocument();
  });

  it("shows no active polls message when there are no polls", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthorized: true,
      role: "none",
      username: "Test Player",
      displayName: "Test Player",
      playerUser: mockPlayerUser,
      authType: "player",
      isPlayer: true,
      loginAsPlayer: vi.fn(),
      logout: vi.fn(),
      refreshAuthState: vi.fn(),
    });

    render(<VoteTab />);

    expect(screen.getByText("No Active Polls")).toBeInTheDocument();
    expect(
      screen.getByText("There are currently no active polls. Check back later!")
    ).toBeInTheDocument();
  });

  it("renders without crashing for player users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthorized: true,
      role: "none",
      username: "Test Player",
      displayName: "Test Player",
      playerUser: mockPlayerUser,
      authType: "player",
      isPlayer: true,
      loginAsPlayer: vi.fn(),
      logout: vi.fn(),
      refreshAuthState: vi.fn(),
    });

    const { container } = render(<VoteTab />);
    expect(container).toBeInTheDocument();
  });
});
