// components/__tests__/login-page.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import LoginPage from "@/app/login/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

// Mock useAuth hook
vi.mock("@/src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase
vi.mock("@/src/lib/firebase", () => ({
  auth: {},
  db: {},
}));

// Mock Firebase Auth
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

// Mock player auth service
vi.mock("@/src/lib/playerAuthService", () => ({
  playerAuthService: {
    getPlayerSuggestions: vi.fn(),
    validatePlayerCredentials: vi.fn(),
  },
}));

// Mock admin config
vi.mock("@/src/config/adminAccess", () => ({
  SUPER_ADMIN_EMAIL: "admin@test.com",
}));

describe("LoginPage", () => {
  const mockPush = vi.fn();
  const mockLoginAsPlayer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    (useAuth as any).mockReturnValue({
      isAuthorized: false,
      loading: false,
      loginAsPlayer: mockLoginAsPlayer,
      isPlayer: false,
    });
  });

  it("renders the login page with auth method selection", () => {
    render(<LoginPage />);

    expect(screen.getByText("Tournament Access")).toBeInTheDocument();
    expect(screen.getByText("Choose your login method")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
  });

  it("shows admin login form by default", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("switches to player login form when player tab is clicked", async () => {
    render(<LoginPage />);

    const playerTab = screen.getByRole("button", { name: /player/i });
    fireEvent.click(playerTab);

    await waitFor(() => {
      expect(screen.getByLabelText("Player Name")).toBeInTheDocument();
      expect(screen.getByText("Sign In as Player")).toBeInTheDocument();
    });
  });

  it("disables password field until player is selected", async () => {
    render(<LoginPage />);

    // Switch to player login
    const playerTab = screen.getByRole("button", { name: /player/i });
    fireEvent.click(playerTab);

    await waitFor(() => {
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toBeDisabled();
      expect(
        screen.getByText("Select your name first to enable password entry")
      ).toBeInTheDocument();
    });
  });

  it("shows loading state when auth is loading", () => {
    (useAuth as any).mockReturnValue({
      isAuthorized: false,
      loading: true,
      loginAsPlayer: mockLoginAsPlayer,
      isPlayer: false,
    });

    render(<LoginPage />);

    expect(screen.getByText("Checking authorization...")).toBeInTheDocument();
  });

  it("shows redirecting state when user is authorized", () => {
    (useAuth as any).mockReturnValue({
      isAuthorized: true,
      loading: false,
      loginAsPlayer: mockLoginAsPlayer,
      isPlayer: false,
    });

    render(<LoginPage />);

    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
  });

  it("validates admin email format", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
  });

  it("shows forgot password link and handles password reset", async () => {
    render(<LoginPage />);

    const forgotPasswordLink = screen.getByText("Forgot password?");
    fireEvent.click(forgotPasswordLink);

    await waitFor(() => {
      expect(screen.getByText("Reset Password")).toBeInTheDocument();
      expect(screen.getByText("Send Reset Email")).toBeInTheDocument();
      expect(screen.getByText("Back to sign in")).toBeInTheDocument();
    });
  });

  it("handles player login form submission", async () => {
    const mockPlayer = {
      id: "1",
      name: "Test Player",
      category: "Pro" as const,
      phoneNumber: null,
      loginPassword: "password123",
      isLoginEnabled: true,
    };

    render(<LoginPage />);

    // Switch to player login
    const playerTab = screen.getByRole("button", { name: /player/i });
    fireEvent.click(playerTab);

    await waitFor(() => {
      const form = screen.getByRole("form");
      expect(form).toBeInTheDocument();
    });
  });

  it("clears errors when switching between auth methods", async () => {
    render(<LoginPage />);

    // Trigger an admin error first
    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });

    // Switch to player tab
    const playerTab = screen.getByRole("button", { name: /player/i });
    fireEvent.click(playerTab);

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText("Please enter a valid email address")
      ).not.toBeInTheDocument();
    });
  });
});
