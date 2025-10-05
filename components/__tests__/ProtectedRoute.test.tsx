// components/__tests__/ProtectedRoute.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

// Mock the hooks and router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/config/adminAccess", () => ({
  canAccessFullAdmin: vi.fn((role) => role === "super_admin"),
  canAccessTeamsAdmin: vi.fn(
    (role) => role === "super_admin" || role === "teams_admin"
  ),
}));

const mockPush = vi.fn();
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  const TestComponent = () => <div>Protected Content</div>;

  describe("Loading States", () => {
    it("shows loading spinner when auth is loading", () => {
      mockUseAuth.mockReturnValue({
        loading: true,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("PUBGMI TOURNAMENT")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Unauthenticated Users", () => {
    it("redirects unauthenticated users to login", async () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      // Mock window.location.pathname
      Object.defineProperty(window, "location", {
        value: { pathname: "/admin" },
        writable: true,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fadmin");
      });
    });
  });

  describe("Admin Access Control", () => {
    it("allows super admin to access full admin routes", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("shows access denied screen for teams admin accessing full admin route", async () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "teams@test.com" },
        role: "teams_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(
        screen.getByText("Full Admin Access Required")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You have teams-only access/)
      ).toBeInTheDocument();
    });

    it("allows teams admin to access teams-only routes", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "teams@test.com" },
        role: "teams_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="teams-only">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("shows access denied for unauthorized Firebase users", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "user@test.com" },
        role: "none",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
      expect(
        screen.getByText(/user@test.com.*doesn't have admin access/)
      ).toBeInTheDocument();
    });
  });

  describe("Player Access Control", () => {
    it("allows authenticated players to access player-only routes", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: {
          id: "1",
          name: "Player1",
          hasVoted: false,
          loginPassword: "pass",
        },
        authType: "player",
        isPlayer: true,
      });

      render(
        <ProtectedRoute requiredAccess="player-only">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects players to tournament when accessing admin routes", async () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: {
          id: "1",
          name: "Player1",
          hasVoted: false,
          loginPassword: "pass",
        },
        authType: "player",
        isPlayer: true,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/tournament");
      });
    });

    it("shows player access required for non-players accessing player routes", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="player-only">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Player Access Required")).toBeInTheDocument();
    });
  });

  describe("Any Authenticated Access", () => {
    it("allows any authenticated user (admin) to access any-authenticated routes", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="any-authenticated">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("allows any authenticated user (player) to access any-authenticated routes", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: {
          id: "1",
          name: "Player1",
          hasVoted: false,
          loginPassword: "pass",
        },
        authType: "player",
        isPlayer: true,
      });

      render(
        <ProtectedRoute requiredAccess="any-authenticated">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("Error Boundary", () => {
    it("shows error boundary when authentication throws error", () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const ErrorComponent = () => {
        throw new Error("Auth error");
      };

      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute requiredAccess="full">
          <ErrorComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Authentication Error")).toBeInTheDocument();
      expect(
        screen.getByText(/Something went wrong with authentication/)
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("Custom Fallback Component", () => {
    it("shows custom fallback component when access is denied", () => {
      const CustomFallback = () => <div>Custom Access Denied</div>;

      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "user@test.com" },
        role: "none",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(
        <ProtectedRoute
          requiredAccess="full"
          fallbackComponent={<CustomFallback />}
        >
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText("Custom Access Denied")).toBeInTheDocument();
      expect(screen.queryByText("Access Restricted")).not.toBeInTheDocument();
    });
  });
});
