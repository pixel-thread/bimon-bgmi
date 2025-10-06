import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useAuth } from "@/src/hooks/useAuth";
import AdminDashboard from "../page";

// Mock Firebase
vi.mock("@/src/lib/firebase", () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Mock useAuth hook
vi.mock("@/src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock all child components
vi.mock("@/src/components/AdminHeader", () => ({
  default: () => <div data-testid="admin-header">Admin Header</div>,
}));

vi.mock("@/src/components/Tabs", () => ({
  default: ({ activeTab, setActiveTab }: any) => (
    <div data-testid="tabs">
      <button onClick={() => setActiveTab("teams")}>Teams</button>
      <button onClick={() => setActiveTab("polls")}>Polls</button>
    </div>
  ),
}));

vi.mock("@/src/components/ProtectedRoute", () => ({
  default: ({ children }: any) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

vi.mock("@/src/components/TeamManagement", () => ({
  default: () => <div data-testid="team-management">Team Management</div>,
}));

vi.mock("@/src/components/admin/PollManagement", () => ({
  default: () => <div data-testid="poll-management">Poll Management</div>,
}));

// PlayerAuthManagement component removed

describe("Admin Dashboard Integration Tests", () => {
  const mockUseAuth = useAuth as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Firebase functions to return empty data
    const { getDocs, onSnapshot } = require("firebase/firestore");
    getDocs.mockResolvedValue({
      docs: [],
    });

    onSnapshot.mockReturnValue(vi.fn()); // Return unsubscribe function
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Super Admin Dashboard", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });
    });

    it("should render dashboard overview for super admin", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Total Polls")).toBeInTheDocument();
        expect(screen.getByText("Active Polls")).toBeInTheDocument();
        expect(screen.getByText("Total Votes")).toBeInTheDocument();
        expect(screen.getByText("Players with Login")).toBeInTheDocument();
      });
    });

    it("should display quick actions for poll management", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        expect(screen.getByText("Create New Poll")).toBeInTheDocument();
        expect(screen.getByText("View Poll Results")).toBeInTheDocument();
      });
    });

    it("should display recent activity section", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
    });

    it("should navigate to polls tab when quick create poll is clicked", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        const createPollButton = screen.getByText("Create New Poll");
        fireEvent.click(createPollButton);
      });

      // The tab should change to polls
      expect(screen.getByTestId("poll-management")).toBeInTheDocument();
    });

    // Player Auth tab removed; quick action should be removed or repointed

    it("should load and display dashboard statistics", async () => {
      // Mock Firebase data
      const { getDocs } = require("firebase/firestore");
      getDocs
        .mockResolvedValueOnce({
          docs: [
            {
              id: "poll1",
              data: () => ({
                question: "Test Poll",
                isActive: true,
                createdAt: "2024-01-01",
              }),
            },
            {
              id: "poll2",
              data: () => ({
                question: "Test Poll 2",
                isActive: false,
                createdAt: "2024-01-02",
              }),
            },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            {
              data: () => ({
                playerId: "player1",
                pollId: "poll1",
                votedAt: "2024-01-01",
              }),
            },
            {
              data: () => ({
                playerId: "player2",
                pollId: "poll1",
                votedAt: "2024-01-02",
              }),
            },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ name: "Player 1", isLoginEnabled: true }) },
            { data: () => ({ name: "Player 2", isLoginEnabled: false }) },
          ],
        });

      render(<AdminDashboard />);

      await waitFor(() => {
        // Should show statistics based on mocked data
        expect(screen.getByText("2")).toBeInTheDocument(); // Total polls
        expect(screen.getByText("1")).toBeInTheDocument(); // Active polls (one active)
        // Note: The exact numbers might vary based on how the component processes the data
      });
    });

    it("should handle refresh button click", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        const refreshButton = screen.getByText("Refresh");
        fireEvent.click(refreshButton);
      });

      // Should trigger a reload of statistics
      const { getDocs } = require("firebase/firestore");
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe("Non-Super Admin Dashboard", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "helper",
        user: { uid: "test-helper" },
      });
    });

    it("should not render dashboard overview for non-super admin", async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText("Total Polls")).not.toBeInTheDocument();
        expect(screen.queryByText("Quick Actions")).not.toBeInTheDocument();
        expect(screen.queryByText("Recent Activity")).not.toBeInTheDocument();
      });

      // Should still render team management
      expect(screen.getByTestId("team-management")).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });
    });

    it("should switch between tabs correctly", async () => {
      render(<AdminDashboard />);

      // Initially should show teams tab with dashboard
      await waitFor(() => {
        expect(screen.getByTestId("team-management")).toBeInTheDocument();
        expect(screen.getByText("Total Polls")).toBeInTheDocument();
      });

      // Click polls tab
      fireEvent.click(screen.getByText("Polls"));
      await waitFor(() => {
        expect(screen.getByTestId("poll-management")).toBeInTheDocument();
        expect(screen.queryByText("Total Polls")).not.toBeInTheDocument();
      });

      // Player Auth tab removed; ensure switching back to teams still works
      fireEvent.click(screen.getByText("Teams"));
      await waitFor(() => {
        expect(screen.getByTestId("team-management")).toBeInTheDocument();
      });
    });
  });

  describe("Real-time Updates", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });
    });

    it("should set up real-time listeners for polls and votes", async () => {
      const { onSnapshot } = require("firebase/firestore");
      const mockUnsubscribe = vi.fn();
      onSnapshot.mockReturnValue(mockUnsubscribe);

      render(<AdminDashboard />);

      await waitFor(() => {
        // Should set up listeners for polls and votes collections
        expect(onSnapshot).toHaveBeenCalledTimes(2);
      });
    });

    it("should clean up listeners on unmount", async () => {
      const { onSnapshot } = require("firebase/firestore");
      const mockUnsubscribe = vi.fn();
      onSnapshot.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<AdminDashboard />);

      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });

      unmount();

      // Should call unsubscribe functions
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });
    });

    it("should handle errors when loading dashboard statistics", async () => {
      const { getDocs } = require("firebase/firestore");
      const { toast } = require("sonner");

      getDocs.mockRejectedValue(new Error("Firebase error"));

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to load dashboard statistics"
        );
      });
    });

    it("should show loading state while fetching statistics", async () => {
      const { getDocs } = require("firebase/firestore");
      // Make getDocs hang to simulate loading
      getDocs.mockImplementation(() => new Promise(() => {}));

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("...")).toBeInTheDocument();
      });
    });
  });
});
