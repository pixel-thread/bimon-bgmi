import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NameAutocomplete } from "../name-autocomplete";
import { playerAuthService } from "@/lib/playerAuthService";
import { Player } from "@/lib/types";

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
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
  getAuth: vi.fn(),
}));

// Mock Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getFirestore: vi.fn(),
}));

// Mock the player auth service
vi.mock("@/lib/playerAuthService", () => ({
  playerAuthService: {
    getPlayerSuggestions: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Check: () => <div data-testid="check-icon">✓</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">▼</div>,
  Loader2: () => <div data-testid="loader-icon">⟳</div>,
}));

const mockPlayers: Player[] = [
  {
    id: "1",
    name: "John Doe",
    category: "Pro",
    phoneNumber: "123456789",
    isLoginEnabled: true,
    loginPassword: "password123",
  },
  {
    id: "2",
    name: "Jane Smith",
    category: "Noob",
    phoneNumber: "987654321",
    isLoginEnabled: true,
    loginPassword: "password456",
  },
];

describe("NameAutocomplete", () => {
  const mockOnValueChange = vi.fn();
  const mockOnPlayerSelect = vi.fn();

  const defaultProps = {
    value: "",
    onValueChange: mockOnValueChange,
    onPlayerSelect: mockOnPlayerSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders with default placeholder", () => {
    render(<NameAutocomplete {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("Type player name...")
    ).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(
      <NameAutocomplete {...defaultProps} placeholder="Enter your name" />
    );

    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  });

  it("shows chevron down icon by default", () => {
    render(<NameAutocomplete {...defaultProps} />);

    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  it("calls onValueChange when input value changes", () => {
    render(<NameAutocomplete {...defaultProps} />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "John" } });

    expect(mockOnValueChange).toHaveBeenCalledWith("John");
  });

  it("displays custom error message", () => {
    render(<NameAutocomplete {...defaultProps} error="Custom error message" />);

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("applies error styling when error prop is provided", () => {
    render(<NameAutocomplete {...defaultProps} error="Error message" />);

    const input = screen.getByRole("combobox");
    expect(input).toHaveClass("border-red-500");
  });

  it("is disabled when disabled prop is true", () => {
    render(<NameAutocomplete {...defaultProps} disabled />);

    const input = screen.getByRole("combobox");
    expect(input).toBeDisabled();
  });

  it("does not fetch suggestions for empty input", async () => {
    const mockGetPlayerSuggestions = vi.mocked(
      playerAuthService.getPlayerSuggestions
    );

    render(<NameAutocomplete {...defaultProps} />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: " " } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockGetPlayerSuggestions).not.toHaveBeenCalled();
  });

  it("handles keyboard navigation", () => {
    render(<NameAutocomplete {...defaultProps} />);

    const input = screen.getByRole("combobox");

    // Test that keyboard events don't throw errors
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(input).toBeInTheDocument();
  });
});
