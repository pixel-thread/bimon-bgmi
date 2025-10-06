// components/__tests__/route-protection.integration.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  withAuth,
  withAdminAuth,
  withPlayerAuth,
  withAnyAuth,
} from "@/src/components/withAuth";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { useAuth } from "@/src/hooks/useAuth";

// Mock the hooks and router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/src/config/adminAccess", () => ({
  canAccessFullAdmin: vi.fn((role) => role === "super_admin"),
  canAccessTeamsAdmin: vi.fn(
    (role) => role === "super_admin" || role === "teams_admin"
  ),
}));

const mockPush = vi.fn();
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("Route Protection Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });

    // Mock window.location.pathname
    Object.defineProperty(window, "location", {
      value: { pathname: "/test" },
      writable: true,
    });
  });

  const TestPage = () => <div>Test Page Content</div>;

  describe("Complete Authentication Workflows", () => {
    it("handles admin login -> access admin page -> logout -> redirect workflow", async () => {
      // Step 1: Unauthenticated user tries to access admin page
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      const { rerender } = render(
        <ProtectedRoute requiredAccess="full">
          <TestPage />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Ftest");
      });

      // Step 2: User logs in as admin
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      rerender(
        <ProtectedRoute requiredAccess="full">
          <TestPage />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText("Test Page Content")).toBeInTheDocument();
      });

      // Step 3: User logs out
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      rerender(
        <ProtectedRoute requiredAccess="full">
          <TestPage />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Ftest");
      });
    });

    it("handles player login -> access player page -> try admin page -> redirect workflow", async () => {
      const ProtectedPlayerPage = withPlayerAuth(TestPage);
      const ProtectedAdminPage = withAdminAuth(TestPage);

      // Step 1: Player logs in
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

      // Step 2: Player accesses player page successfully
      const { rerender } = render(<ProtectedPlayerPage />);
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();

      // Step 3: Player tries to access admin page
      rerender(<ProtectedAdminPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/tournament");
      });
    });

    it("handles role escalation scenario (teams admin -> super admin)", async () => {
      const ProtectedFullAdminPage = withAuth(TestPage, {
        requiredAccess: "full",
      });

      // Step 1: Teams admin tries to access full admin page
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "teams@test.com" },
        role: "teams_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      const { rerender } = render(<ProtectedFullAdminPage />);

      // Should show access denied screen instead of redirecting
      expect(
        screen.getByText("Full Admin Access Required")
      ).toBeInTheDocument();

      // Step 2: User gets promoted to super admin
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "teams@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      rerender(<ProtectedFullAdminPage />);
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();
    });
  });

  describe("Cross-Authentication Type Scenarios", () => {
    it("handles admin accessing any-auth page then switching to player", async () => {
      const ProtectedAnyAuthPage = withAnyAuth(TestPage);

      // Step 1: Admin accesses any-auth page
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      const { rerender } = render(<ProtectedAnyAuthPage />);
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();

      // Step 2: User logs out and logs in as player
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

      rerender(<ProtectedAnyAuthPage />);
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();
    });

    it("handles session expiration during page access", async () => {
      const ProtectedAdminPage = withAdminAuth(TestPage);

      // Step 1: User is authenticated
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      const { rerender } = render(<ProtectedAdminPage />);
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();

      // Step 2: Session expires (simulated by auth state change)
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      rerender(<ProtectedAdminPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Ftest");
      });
    });
  });

  describe("Loading State Transitions", () => {
    it("handles loading -> authenticated -> loading -> unauthenticated transitions", async () => {
      const ProtectedAdminPage = withAdminAuth(TestPage);

      // Step 1: Loading state
      mockUseAuth.mockReturnValue({
        loading: true,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      const { rerender } = render(<ProtectedAdminPage />);
      expect(screen.getByText("PUBGMI TOURNAMENT")).toBeInTheDocument();

      // Step 2: Authenticated
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      rerender(<ProtectedAdminPage />);
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();

      // Step 3: Loading again (e.g., during refresh)
      mockUseAuth.mockReturnValue({
        loading: true,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      rerender(<ProtectedAdminPage />);
      expect(screen.getByText("PUBGMI TOURNAMENT")).toBeInTheDocument();

      // Step 4: Unauthenticated (e.g., session expired)
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      rerender(<ProtectedAdminPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Ftest");
      });
    });
  });

  describe("Error Scenarios", () => {
    it("handles authentication errors gracefully", async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const ErrorComponent = () => {
        throw new Error("Authentication service unavailable");
      };

      const ProtectedErrorPage = withAdminAuth(ErrorComponent);

      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<ProtectedErrorPage />);

      expect(screen.getByText("Authentication Error")).toBeInTheDocument();
      expect(
        screen.getByText(/Something went wrong with authentication/)
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("handles malformed auth state gracefully", async () => {
      const ProtectedAdminPage = withAdminAuth(TestPage);

      // Malformed auth state (missing required fields)
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: null, // Missing user despite being authorized
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<ProtectedAdminPage />);

      // Should still render content as isAuthorized is true and role is valid
      expect(screen.getByText("Test Page Content")).toBeInTheDocument();
    });
  });

  describe("Custom Redirect Scenarios", () => {
    it("uses custom redirect path when specified", async () => {
      const ProtectedPageWithCustomRedirect = withAuth(TestPage, {
        requiredAccess: "full",
        redirectTo: "/custom-redirect",
      });

      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      render(<ProtectedPageWithCustomRedirect />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Ftest");
      });
    });

    it("redirects teams admin to custom path when accessing full admin", async () => {
      const ProtectedPageWithCustomRedirect = withAuth(TestPage, {
        requiredAccess: "full",
        redirectTo: "/custom-fallback",
      });

      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "teams@test.com" },
        role: "teams_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<ProtectedPageWithCustomRedirect />);

      // Should show access denied screen instead of redirecting
      expect(
        screen.getByText("Full Admin Access Required")
      ).toBeInTheDocument();
    });
  });
});
