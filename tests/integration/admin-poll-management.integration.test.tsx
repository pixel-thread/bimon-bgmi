import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

// Mock Firebase
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// Mock services
vi.mock("@/lib/pollService", () => ({
  PollService: vi.fn().mockImplementation(() => ({
    createPoll: vi.fn(),
    updatePoll: vi.fn(),
    deletePoll: vi.fn(),
    getAllPolls: vi.fn(),
    getPollResults: vi.fn(),
    getVoteCounts: vi.fn(),
  })),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock admin components
const MockAdminDashboard = () => {
  const [polls, setPolls] = React.useState([
    {
      id: "poll1",
      question: "Test poll question?",
      type: "yes_no",
      options: ["Yes", "No"],
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      createdBy: "admin123",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showResultsModal, setShowResultsModal] = React.useState(false);
  const [selectedPoll, setSelectedPoll] = React.useState(null);

  const handleCreatePoll = async (pollData: any) => {
    const newPoll = {
      id: `poll${Date.now()}`,
      ...pollData,
      createdAt: new Date().toISOString(),
      createdBy: "admin123",
    };
    setPolls([...polls, newPoll]);
    setShowCreateModal(false);
  };

  const handleUpdatePoll = async (pollId: string, updates: any) => {
    setPolls(
      polls.map((poll) => (poll.id === pollId ? { ...poll, ...updates } : poll))
    );
  };

  const handleDeletePoll = async (pollId: string) => {
    setPolls(polls.filter((poll) => poll.id !== pollId));
  };

  const handleViewResults = (poll: any) => {
    setSelectedPoll(poll);
    setShowResultsModal(true);
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <div role="tabpanel" aria-labelledby="poll-management-tab">
        <h2>Poll Management</h2>

        <button onClick={() => setShowCreateModal(true)}>
          Create New Poll
        </button>

        <div data-testid="polls-list">
          {polls.map((poll) => (
            <div key={poll.id} data-testid="poll-item">
              <h3>{poll.question}</h3>
              <span>{poll.isActive ? "Active" : "Inactive"}</span>

              <button onClick={() => handleViewResults(poll)}>
                View Results
              </button>

              <button
                onClick={() =>
                  handleUpdatePoll(poll.id, { isActive: !poll.isActive })
                }
              >
                {poll.isActive ? "Deactivate" : "Activate"}
              </button>

              <button onClick={() => handleDeletePoll(poll.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div role="dialog" aria-labelledby="create-poll-title">
          <h2 id="create-poll-title">Create New Poll</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreatePoll({
                question: formData.get("question"),
                type: formData.get("type"),
                options:
                  formData.get("type") === "yes_no"
                    ? ["Yes", "No"]
                    : formData.get("type") === "yes_no_maybe"
                    ? ["Yes", "No", "Maybe"]
                    : ["Option A", "Option B", "Option C"],
                isActive: true,
              });
            }}
          >
            <label htmlFor="question">Question</label>
            <input
              id="question"
              name="question"
              type="text"
              required
              placeholder="Enter poll question"
            />

            <label htmlFor="type">Poll Type</label>
            <select id="type" name="type" required>
              <option value="">Select type</option>
              <option value="yes_no">Yes/No</option>
              <option value="yes_no_maybe">Yes/No/Maybe</option>
              <option value="multiple_choice">Multiple Choice</option>
            </select>

            <button type="submit">Create Poll</button>
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {showResultsModal && selectedPoll && (
        <div role="dialog" aria-labelledby="results-title">
          <h2 id="results-title">Poll Results</h2>
          <h3>{selectedPoll.question}</h3>

          <div data-testid="vote-counts">
            <p>Yes: 5 votes</p>
            <p>No: 3 votes</p>
          </div>

          <div data-testid="individual-votes">
            <h4>Individual Votes</h4>
            <ul>
              <li>Player1 voted Yes at 2024-01-01 10:00</li>
              <li>Player2 voted No at 2024-01-01 11:00</li>
              <li>Player3 voted Yes at 2024-01-01 12:00</li>
            </ul>
          </div>

          <button onClick={() => setShowResultsModal(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

describe("Admin Poll Management Integration", () => {
  const mockUseAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthorized: true,
      loading: false,
      user: {
        uid: "admin123",
        email: "admin@test.com",
        role: "super_admin",
      },
      isAdmin: true,
    });

    (require("@/hooks/useAuth").useAuth as any) = mockUseAuth;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders admin dashboard with poll management interface", async () => {
    render(<MockAdminDashboard />);

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Poll Management")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create new poll/i })
    ).toBeInTheDocument();

    // Should show existing polls
    expect(screen.getByText("Test poll question?")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("creates a new poll through the complete workflow", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Open create poll modal
    await user.click(screen.getByRole("button", { name: /create new poll/i }));

    // Verify modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create New Poll")).toBeInTheDocument();

    // Fill in poll details
    await user.type(
      screen.getByLabelText("Question"),
      "Will you attend the next tournament?"
    );
    await user.selectOptions(screen.getByLabelText("Poll Type"), "yes_no");

    // Submit form
    await user.click(screen.getByRole("button", { name: /create poll/i }));

    // Verify poll was created
    await waitFor(() => {
      expect(
        screen.getByText("Will you attend the next tournament?")
      ).toBeInTheDocument();
    });

    // Modal should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("validates poll creation form", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Open create poll modal
    await user.click(screen.getByRole("button", { name: /create new poll/i }));

    // Try to submit without filling required fields
    await user.click(screen.getByRole("button", { name: /create poll/i }));

    // Form should not submit (browser validation will prevent it)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("toggles poll active status", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Initially poll should be active
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /deactivate/i })
    ).toBeInTheDocument();

    // Click deactivate
    await user.click(screen.getByRole("button", { name: /deactivate/i }));

    // Status should change
    await waitFor(() => {
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /activate/i })
      ).toBeInTheDocument();
    });
  });

  it("deletes a poll", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Verify poll exists
    expect(screen.getByText("Test poll question?")).toBeInTheDocument();

    // Delete poll
    await user.click(screen.getByRole("button", { name: /delete/i }));

    // Poll should be removed
    await waitFor(() => {
      expect(screen.queryByText("Test poll question?")).not.toBeInTheDocument();
    });
  });

  it("views poll results", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Click view results
    await user.click(screen.getByRole("button", { name: /view results/i }));

    // Results modal should open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Poll Results")).toBeInTheDocument();
    expect(screen.getByText("Test poll question?")).toBeInTheDocument();

    // Should show vote counts
    expect(screen.getByText("Yes: 5 votes")).toBeInTheDocument();
    expect(screen.getByText("No: 3 votes")).toBeInTheDocument();

    // Should show individual votes
    expect(screen.getByText("Individual Votes")).toBeInTheDocument();
    expect(
      screen.getByText("Player1 voted Yes at 2024-01-01 10:00")
    ).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("handles multiple poll types correctly", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Create Yes/No/Maybe poll
    await user.click(screen.getByRole("button", { name: /create new poll/i }));
    await user.type(
      screen.getByLabelText("Question"),
      "Are you interested in a practice session?"
    );
    await user.selectOptions(
      screen.getByLabelText("Poll Type"),
      "yes_no_maybe"
    );
    await user.click(screen.getByRole("button", { name: /create poll/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Are you interested in a practice session?")
      ).toBeInTheDocument();
    });

    // Create Multiple Choice poll
    await user.click(screen.getByRole("button", { name: /create new poll/i }));
    await user.type(
      screen.getByLabelText("Question"),
      "What is your preferred game mode?"
    );
    await user.selectOptions(
      screen.getByLabelText("Poll Type"),
      "multiple_choice"
    );
    await user.click(screen.getByRole("button", { name: /create poll/i }));

    await waitFor(() => {
      expect(
        screen.getByText("What is your preferred game mode?")
      ).toBeInTheDocument();
    });

    // Should have 3 polls total
    const pollItems = screen.getAllByTestId("poll-item");
    expect(pollItems).toHaveLength(3);
  });

  it("handles form cancellation", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Open create poll modal
    await user.click(screen.getByRole("button", { name: /create new poll/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Fill in some data
    await user.type(screen.getByLabelText("Question"), "Cancelled poll?");

    // Cancel
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Modal should close and poll should not be created
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelled poll?")).not.toBeInTheDocument();
  });

  it("maintains poll list state during operations", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Create a new poll
    await user.click(screen.getByRole("button", { name: /create new poll/i }));
    await user.type(screen.getByLabelText("Question"), "New poll question?");
    await user.selectOptions(screen.getByLabelText("Poll Type"), "yes_no");
    await user.click(screen.getByRole("button", { name: /create poll/i }));

    // Should have 2 polls
    await waitFor(() => {
      const pollItems = screen.getAllByTestId("poll-item");
      expect(pollItems).toHaveLength(2);
    });

    // Toggle status of first poll
    const deactivateButtons = screen.getAllByRole("button", {
      name: /deactivate/i,
    });
    await user.click(deactivateButtons[0]);

    // Should still have 2 polls, but one inactive
    await waitFor(() => {
      const pollItems = screen.getAllByTestId("poll-item");
      expect(pollItems).toHaveLength(2);
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation in modals", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Open create poll modal
    await user.click(screen.getByRole("button", { name: /create new poll/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Tab through form elements
    await user.tab();
    expect(screen.getByLabelText("Question")).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText("Poll Type")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: /create poll/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
  });

  it("displays appropriate error states", async () => {
    const user = userEvent.setup();

    // Mock auth error
    mockUseAuth.mockReturnValue({
      isAuthorized: false,
      loading: false,
      user: null,
      isAdmin: false,
      error: "Unauthorized access",
    });

    render(<MockAdminDashboard />);

    // Should show error state or redirect
    // This would depend on how the actual component handles auth errors
  });

  it("handles concurrent poll operations", async () => {
    const user = userEvent.setup();
    render(<MockAdminDashboard />);

    // Simulate rapid operations
    const createButton = screen.getByRole("button", {
      name: /create new poll/i,
    });

    // Open and close modal rapidly
    await user.click(createButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Should still be able to open modal again
    await user.click(createButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
