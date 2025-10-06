// hooks/__tests__/useConditionalRender.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  useConditionalRender,
  AdminOnly,
  PlayerOnly,
  AuthenticatedOnly,
  RoleBasedRender,
} from "@/src/hooks/useConditionalRender";
import { useAuth } from "@/src/hooks/useAuth";

// Mock the useAuth hook
vi.mock("@/src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/src/config/adminAccess", () => ({
  canAccessFullAdmin: vi.fn((role) => role === "super_admin"),
  canAccessTeamsAdmin: vi.fn(
    (role) => role === "super_admin" || role === "teams_admin"
  ),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Test component that uses the hook
const TestComponent = ({ options }: { options?: any }) => {
  const { shouldRender, renderIf, getAuthInfo } = useConditionalRender();

  return (
    <div>
      <div data-testid="should-render">{shouldRender(options).toString()}</div>
      <div data-testid="render-if">
        {renderIf(options || {}, <span>Rendered</span>, <span>Fallback</span>)}
      </div>
      <div data-testid="auth-info">{JSON.stringify(getAuthInfo())}</div>
    </div>
  );
};

describe("useConditionalRender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("shouldRender", () => {
    it("returns false when loading", () => {
      mockUseAuth.mockReturnValue({
        loading: true,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      render(<TestComponent />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("false");
    });

    it("returns true when no conditions specified and not loading", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      render(<TestComponent />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });

    it("checks requireAuth condition correctly", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<TestComponent options={{ requireAuth: true }} />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });

    it("checks requireAdmin condition correctly", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<TestComponent options={{ requireAdmin: true }} />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });

    it("checks requireFullAdmin condition correctly", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<TestComponent options={{ requireFullAdmin: true }} />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });

    it("checks requirePlayer condition correctly", () => {
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

      render(<TestComponent options={{ requirePlayer: true }} />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });

    it("checks allowedRoles condition correctly", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<TestComponent options={{ allowedRoles: ["super_admin"] }} />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });

    it("checks allowedAuthTypes condition correctly", () => {
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

      render(<TestComponent options={{ allowedAuthTypes: ["player"] }} />);
      expect(screen.getByTestId("should-render")).toHaveTextContent("true");
    });
  });

  describe("renderIf", () => {
    it("renders component when condition is met", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      });

      render(<TestComponent options={{ requireAdmin: true }} />);
      expect(screen.getByText("Rendered")).toBeInTheDocument();
    });

    it("renders fallback when condition is not met", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      render(<TestComponent options={{ requireAdmin: true }} />);
      expect(screen.getByText("Fallback")).toBeInTheDocument();
    });
  });

  describe("getAuthInfo", () => {
    it("returns correct auth info", () => {
      const mockAuthState = {
        loading: false,
        isAuthorized: true,
        user: { email: "admin@test.com" },
        role: "super_admin",
        playerUser: null,
        authType: "firebase",
        isPlayer: false,
      };

      mockUseAuth.mockReturnValue(mockAuthState);

      render(<TestComponent />);

      const authInfo = JSON.parse(
        screen.getByTestId("auth-info").textContent || "{}"
      );
      expect(authInfo.isAuthenticated).toBe(true);
      expect(authInfo.isAdmin).toBe(true);
      expect(authInfo.isFullAdmin).toBe(true);
      expect(authInfo.isPlayer).toBe(false);
      expect(authInfo.authType).toBe("firebase");
    });
  });
});

describe("Convenience Components", () => {
  describe("AdminOnly", () => {
    it("renders children for admin users", () => {
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
        <AdminOnly>
          <div>Admin Content</div>
        </AdminOnly>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });

    it("renders fallback for non-admin users", () => {
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
        <AdminOnly fallback={<div>Not Admin</div>}>
          <div>Admin Content</div>
        </AdminOnly>
      );

      expect(screen.getByText("Not Admin")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("requires full admin when specified", () => {
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
        <AdminOnly requireFullAdmin={true} fallback={<div>Not Full Admin</div>}>
          <div>Full Admin Content</div>
        </AdminOnly>
      );

      expect(screen.getByText("Not Full Admin")).toBeInTheDocument();
      expect(screen.queryByText("Full Admin Content")).not.toBeInTheDocument();
    });
  });

  describe("PlayerOnly", () => {
    it("renders children for player users", () => {
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
        <PlayerOnly>
          <div>Player Content</div>
        </PlayerOnly>
      );

      expect(screen.getByText("Player Content")).toBeInTheDocument();
    });

    it("renders fallback for non-player users", () => {
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
        <PlayerOnly fallback={<div>Not Player</div>}>
          <div>Player Content</div>
        </PlayerOnly>
      );

      expect(screen.getByText("Not Player")).toBeInTheDocument();
      expect(screen.queryByText("Player Content")).not.toBeInTheDocument();
    });
  });

  describe("AuthenticatedOnly", () => {
    it("renders children for authenticated users (admin)", () => {
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
        <AuthenticatedOnly>
          <div>Authenticated Content</div>
        </AuthenticatedOnly>
      );

      expect(screen.getByText("Authenticated Content")).toBeInTheDocument();
    });

    it("renders children for authenticated users (player)", () => {
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
        <AuthenticatedOnly>
          <div>Authenticated Content</div>
        </AuthenticatedOnly>
      );

      expect(screen.getByText("Authenticated Content")).toBeInTheDocument();
    });

    it("renders fallback for unauthenticated users", () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        isAuthorized: false,
        user: null,
        role: "none",
        playerUser: null,
        authType: null,
        isPlayer: false,
      });

      render(
        <AuthenticatedOnly fallback={<div>Not Authenticated</div>}>
          <div>Authenticated Content</div>
        </AuthenticatedOnly>
      );

      expect(screen.getByText("Not Authenticated")).toBeInTheDocument();
      expect(
        screen.queryByText("Authenticated Content")
      ).not.toBeInTheDocument();
    });
  });

  describe("RoleBasedRender", () => {
    it("renders children for allowed roles", () => {
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
        <RoleBasedRender allowedRoles={["super_admin"]}>
          <div>Role-based Content</div>
        </RoleBasedRender>
      );

      expect(screen.getByText("Role-based Content")).toBeInTheDocument();
    });

    it("renders fallback for disallowed roles", () => {
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
        <RoleBasedRender
          allowedRoles={["super_admin"]}
          fallback={<div>Wrong Role</div>}
        >
          <div>Role-based Content</div>
        </RoleBasedRender>
      );

      expect(screen.getByText("Wrong Role")).toBeInTheDocument();
      expect(screen.queryByText("Role-based Content")).not.toBeInTheDocument();
    });

    it("checks both roles and auth types", () => {
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
        <RoleBasedRender
          allowedRoles={["none"]}
          allowedAuthTypes={["player"]}
          fallback={<div>Wrong Auth</div>}
        >
          <div>Multi-condition Content</div>
        </RoleBasedRender>
      );

      expect(screen.getByText("Multi-condition Content")).toBeInTheDocument();
    });
  });
});
