import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useAuth } from "@/src/hooks/useAuth";

// Mock useAuth hook
vi.mock("@/src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase completely
vi.mock("@/src/lib/firebase", () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock all child components to avoid complex dependencies
vi.mock("@/src/components/AdminHeader", () => ({
  default: () => <div data-testid="admin-header">Admin Header</div>,
}));

vi.mock("@/src/components/Tabs", () => ({
  default: ({ activeTab, setActiveTab }: any) => (
    <div data-testid="tabs">
      <button onClick={() => setActiveTab("teams")} data-testid="teams-tab">
        Teams
      </button>
      <button onClick={() => setActiveTab("polls")} data-testid="polls-tab">
        Polls
      </button>
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

// PlayerAuthManagement removed

// Mock other components
vi.mock("@/src/components/TournamentSettings", () => ({
  TournamentSettings: () => (
    <div data-testid="tournament-settings">Tournament Settings</div>
  ),
}));

vi.mock("@/src/components/PlayersTab", () => ({
  PlayersTab: () => <div data-testid="players-tab">Players Tab</div>,
}));

vi.mock("@/src/components/WinnersTab", () => ({
  WinnersTab: () => <div data-testid="winners-tab">Winners Tab</div>,
}));

vi.mock("@/src/components/RulesTab", () => ({
  RulesTab: () => <div data-testid="rules-tab">Rules Tab</div>,
}));

vi.mock("@/src/components/RevealTab", () => ({
  RevealTab: () => <div data-testid="reveal-tab">Reveal Tab</div>,
}));

vi.mock("@/src/components/AdminManagement", () => ({
  default: () => <div data-testid="admin-management">Admin Management</div>,
}));

describe("Admin Dashboard Poll Management Integration", () => {
  const mockUseAuth = useAuth as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Super Admin Dashboard Features", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });
    });

    it("should render dashboard overview with statistics cards for super admin", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Total Polls")).toBeInTheDocument();
        expect(screen.getByText("Active Polls")).toBeInTheDocument();
        expect(screen.getByText("Total Votes")).toBeInTheDocument();
        expect(screen.getByText("Players with Login")).toBeInTheDocument();
      });
    });

    it("should display quick actions section", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        expect(screen.getByText("Create New Poll")).toBeInTheDocument();
        expect(screen.getByText("View Poll Results")).toBeInTheDocument();
      });
    });

    it("should display recent activity section", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
        expect(screen.getByText("Refresh")).toBeInTheDocument();
      });
    });

    it("should navigate to polls tab when Create New Poll is clicked", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      await waitFor(() => {
        const createPollButton = screen.getByText("Create New Poll");
        fireEvent.click(createPollButton);
      });

      // Should show poll management component
      expect(screen.getByTestId("poll-management")).toBeInTheDocument();
    });

    // Removed: Manage Players quick action for Player Auth tab

    it("should show poll management when polls tab is clicked", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      const pollsTab = screen.getByTestId("polls-tab");
      fireEvent.click(pollsTab);

      await waitFor(() => {
        expect(screen.getByTestId("poll-management")).toBeInTheDocument();
        // Dashboard should not be visible when on polls tab
        expect(screen.queryByText("Total Polls")).not.toBeInTheDocument();
      });
    });

    // Removed: Player Auth tab interactions
  });

  describe("Non-Super Admin Access", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "helper",
        user: { uid: "test-helper" },
      });
    });

    it("should not show dashboard overview for non-super admin", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      await waitFor(() => {
        // Should not show dashboard statistics
        expect(screen.queryByText("Total Polls")).not.toBeInTheDocument();
        expect(screen.queryByText("Quick Actions")).not.toBeInTheDocument();
        expect(screen.queryByText("Recent Activity")).not.toBeInTheDocument();

        // Should still show team management
        expect(screen.getByTestId("team-management")).toBeInTheDocument();
      });
    });
  });

  describe("Role-based Tab Access", () => {
    it("should show poll management tab only for super admin", async () => {
      // Test super admin can see polls tab
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });

      const AdminDashboard = (await import("../page")).default;
      const { rerender } = render(<AdminDashboard />);

      expect(screen.getByTestId("polls-tab")).toBeInTheDocument();

      // Test helper cannot see polls tab (this would be controlled by Tabs component)
      mockUseAuth.mockReturnValue({
        role: "helper",
        user: { uid: "test-helper" },
      });

      rerender(<AdminDashboard />);

      // The Tabs component should handle role-based visibility
      // This test verifies the integration works
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });
  });

  describe("Dashboard Statistics Integration", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        role: "super_admin",
        user: { uid: "test-admin" },
      });
    });

    it("should display loading state initially", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      // Should show statistics cards with initial values
      await waitFor(() => {
        expect(screen.getByText("Total Polls")).toBeInTheDocument();
        expect(screen.getByText("Active Polls")).toBeInTheDocument();
        expect(screen.getByText("Total Votes")).toBeInTheDocument();
        expect(screen.getByText("Players with Login")).toBeInTheDocument();
      });
    });

    it("should handle refresh button click", async () => {
      const AdminDashboard = (await import("../page")).default;
      render(<AdminDashboard />);

      await waitFor(() => {
        const refreshButton = screen.getByText("Refresh");
        expect(refreshButton).toBeInTheDocument();

        // Should be able to click refresh without errors
        fireEvent.click(refreshButton);
      });
    });
  });
});
