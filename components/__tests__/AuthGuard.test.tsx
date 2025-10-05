import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { AuthGuard, PlayerAuthGuard } from "../AuthGuard";
import { useAuth } from "@/hooks/useAuth";

// Mock the hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("AuthGuard", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
    mockPush.mockClear();
  });

  it("shows unified loader when authentication is loading", () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      isAuthorized: false,
      isPlayer: false,
      authType: null,
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("PUBGMI TOURNAMENT")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: false,
      isPlayer: false,
      authType: null,
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/login?redirect=")
      );
    });
  });

  it("shows unified loader while redirecting when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: false,
      isPlayer: false,
      authType: null,
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("PUBGMI TOURNAMENT")).toBeInTheDocument();
  });

  it("renders children when user is authenticated as admin", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: true,
      isPlayer: false,
      authType: "firebase",
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders children when user is authenticated as player", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: false,
      isPlayer: true,
      authType: "player",
    } as any);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});

describe("PlayerAuthGuard", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
    mockPush.mockClear();
  });

  it("redirects when user is not a player", async () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: true,
      isPlayer: false,
      authType: "firebase",
    } as any);

    render(
      <PlayerAuthGuard>
        <div>Player Only Content</div>
      </PlayerAuthGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/login?redirect=")
      );
    });
  });

  it("shows unified loader for non-player access to player-only content", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: true,
      isPlayer: false,
      authType: "firebase",
    } as any);

    render(
      <PlayerAuthGuard>
        <div>Player Only Content</div>
      </PlayerAuthGuard>
    );

    expect(screen.getByText("PUBGMI TOURNAMENT")).toBeInTheDocument();
  });

  it("renders children when user is authenticated as player", () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthorized: false,
      isPlayer: true,
      authType: "player",
    } as any);

    render(
      <PlayerAuthGuard>
        <div>Player Only Content</div>
      </PlayerAuthGuard>
    );

    expect(screen.getByText("Player Only Content")).toBeInTheDocument();
  });
});
