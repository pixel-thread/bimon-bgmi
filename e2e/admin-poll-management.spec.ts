import { test, expect } from "@playwright/test";

test.describe("Admin Poll Management Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase authentication for admin user
    await page.addInitScript(() => {
      (window as any).firebase = {
        auth: () => ({
          onAuthStateChanged: (callback: any) => {
            // Mock admin user
            callback({
              uid: "admin123",
              email: "admin@test.com",
              displayName: "Admin User",
            });
            return () => {};
          },
          signOut: () => Promise.resolve(),
        }),
      };

      // Mock Firestore
      (window as any).firestore = {
        collection: () => ({
          doc: () => ({
            get: () =>
              Promise.resolve({
                exists: true,
                data: () => ({ role: "super_admin" }),
              }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          }),
          add: () => Promise.resolve({ id: "new-poll-id" }),
          where: () => ({
            get: () =>
              Promise.resolve({
                empty: false,
                docs: [
                  {
                    id: "poll1",
                    data: () => ({
                      question: "Test poll question?",
                      type: "yes_no",
                      options: ["Yes", "No"],
                      isActive: true,
                      createdAt: "2024-01-01T00:00:00Z",
                      createdBy: "admin123",
                    }),
                  },
                ],
              }),
          }),
          orderBy: () => ({
            get: () =>
              Promise.resolve({
                empty: false,
                docs: [],
              }),
          }),
        }),
      };

      // Mock admin authorization
      localStorage.setItem(
        "adminAuth",
        JSON.stringify({
          uid: "admin123",
          email: "admin@test.com",
          role: "super_admin",
          isAuthorized: true,
        })
      );
    });
  });

  test("complete admin poll management workflow", async ({ page }) => {
    // Navigate to admin page
    await page.goto("/admin");

    // Verify admin dashboard loads
    await expect(page.getByText("Admin Dashboard")).toBeVisible();

    // Navigate to poll management section
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Verify poll management interface
    await expect(page.getByText("Poll Management")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create new poll/i })
    ).toBeVisible();

    // Create a new poll
    await page.getByRole("button", { name: /create new poll/i }).click();

    // Verify create poll modal
    await expect(page.getByText("Create New Poll")).toBeVisible();

    // Fill in poll details
    await page
      .getByLabelText("Question")
      .fill("Will you participate in the tournament?");

    // Select poll type
    await page.getByRole("combobox", { name: /poll type/i }).click();
    await page.getByRole("option", { name: "Yes/No" }).click();

    // Set expiration date (optional)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page
      .getByLabelText("Expires At")
      .fill(tomorrow.toISOString().split("T")[0]);

    // Submit poll creation
    await page.getByRole("button", { name: /create poll/i }).click();

    // Verify success message
    await expect(page.getByText("Poll created successfully!")).toBeVisible();

    // Verify poll appears in the list
    await expect(
      page.getByText("Will you participate in the tournament?")
    ).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();

    // Test poll editing
    await page.getByRole("button", { name: /edit/i }).first().click();

    // Verify edit modal
    await expect(page.getByText("Edit Poll")).toBeVisible();

    // Update poll question
    const questionInput = page.getByLabelText("Question");
    await questionInput.clear();
    await questionInput.fill(
      "Updated: Will you participate in the tournament?"
    );

    // Save changes
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify update success
    await expect(page.getByText("Poll updated successfully!")).toBeVisible();
    await expect(
      page.getByText("Updated: Will you participate in the tournament?")
    ).toBeVisible();

    // Test poll results viewing
    await page
      .getByRole("button", { name: /view results/i })
      .first()
      .click();

    // Verify results modal
    await expect(page.getByText("Poll Results")).toBeVisible();
    await expect(
      page.getByText("Updated: Will you participate in the tournament?")
    ).toBeVisible();

    // Mock some vote data
    await page.evaluate(() => {
      (window as any).mockVoteResults = [
        { playerName: "Player1", vote: "Yes", votedAt: "2024-01-01T10:00:00Z" },
        { playerName: "Player2", vote: "No", votedAt: "2024-01-01T11:00:00Z" },
        { playerName: "Player3", vote: "Yes", votedAt: "2024-01-01T12:00:00Z" },
      ];
    });

    // Verify vote counts
    await expect(page.getByText("Yes: 2 votes")).toBeVisible();
    await expect(page.getByText("No: 1 vote")).toBeVisible();

    // Verify individual votes
    await expect(page.getByText("Player1 voted Yes")).toBeVisible();
    await expect(page.getByText("Player2 voted No")).toBeVisible();
    await expect(page.getByText("Player3 voted Yes")).toBeVisible();

    // Close results modal
    await page.getByRole("button", { name: /close/i }).click();

    // Test poll status toggle
    await page
      .getByRole("button", { name: /deactivate/i })
      .first()
      .click();

    // Verify confirmation dialog
    await expect(page.getByText("Deactivate Poll")).toBeVisible();
    await expect(
      page.getByText("Are you sure you want to deactivate this poll?")
    ).toBeVisible();

    // Confirm deactivation
    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify poll is deactivated
    await expect(page.getByText("Inactive")).toBeVisible();
    await expect(page.getByRole("button", { name: /activate/i })).toBeVisible();

    // Test poll deletion
    await page
      .getByRole("button", { name: /delete/i })
      .first()
      .click();

    // Verify deletion confirmation
    await expect(page.getByText("Delete Poll")).toBeVisible();
    await expect(page.getByText("This action cannot be undone")).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /delete poll/i }).click();

    // Verify deletion success
    await expect(page.getByText("Poll deleted successfully!")).toBeVisible();
  });

  test("create multiple choice poll", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Create new poll
    await page.getByRole("button", { name: /create new poll/i }).click();

    // Fill basic details
    await page
      .getByLabelText("Question")
      .fill("What is your preferred game mode?");

    // Select multiple choice type
    await page.getByRole("combobox", { name: /poll type/i }).click();
    await page.getByRole("option", { name: "Multiple Choice" }).click();

    // Add custom options
    await page.getByLabelText("Option 1").fill("Solo");
    await page.getByLabelText("Option 2").fill("Duo");

    // Add more options
    await page.getByRole("button", { name: /add option/i }).click();
    await page.getByLabelText("Option 3").fill("Squad");

    await page.getByRole("button", { name: /add option/i }).click();
    await page.getByLabelText("Option 4").fill("Custom");

    // Create poll
    await page.getByRole("button", { name: /create poll/i }).click();

    // Verify poll creation
    await expect(page.getByText("Poll created successfully!")).toBeVisible();
    await expect(
      page.getByText("What is your preferred game mode?")
    ).toBeVisible();
    await expect(page.getByText("Multiple Choice")).toBeVisible();
  });

  test("poll validation errors", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Try to create poll without question
    await page.getByRole("button", { name: /create new poll/i }).click();
    await page.getByRole("button", { name: /create poll/i }).click();

    // Verify validation error
    await expect(page.getByText("Question is required")).toBeVisible();

    // Add question but invalid expiration date
    await page.getByLabelText("Question").fill("Test question?");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await page
      .getByLabelText("Expires At")
      .fill(yesterday.toISOString().split("T")[0]);

    await page.getByRole("button", { name: /create poll/i }).click();

    // Verify date validation error
    await expect(
      page.getByText("Expiration date must be in the future")
    ).toBeVisible();
  });

  test("poll search and filtering", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Mock multiple polls
    await page.evaluate(() => {
      (window as any).mockPolls = [
        {
          id: "poll1",
          question: "Tournament participation poll?",
          type: "yes_no",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "poll2",
          question: "Game mode preference poll?",
          type: "multiple_choice",
          isActive: false,
          createdAt: "2024-01-02T00:00:00Z",
        },
        {
          id: "poll3",
          question: "Schedule availability poll?",
          type: "yes_no_maybe",
          isActive: true,
          createdAt: "2024-01-03T00:00:00Z",
        },
      ];
    });

    await page.reload();
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Test search functionality
    await page.getByPlaceholder("Search polls...").fill("tournament");

    // Verify filtered results
    await expect(
      page.getByText("Tournament participation poll?")
    ).toBeVisible();
    await expect(
      page.getByText("Game mode preference poll?")
    ).not.toBeVisible();

    // Clear search
    await page.getByPlaceholder("Search polls...").clear();

    // Test status filter
    await page.getByRole("combobox", { name: /filter by status/i }).click();
    await page.getByRole("option", { name: "Active Only" }).click();

    // Verify only active polls are shown
    await expect(
      page.getByText("Tournament participation poll?")
    ).toBeVisible();
    await expect(page.getByText("Schedule availability poll?")).toBeVisible();
    await expect(
      page.getByText("Game mode preference poll?")
    ).not.toBeVisible();
  });

  test("bulk poll operations", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Mock multiple polls
    await page.evaluate(() => {
      (window as any).mockPolls = [
        { id: "poll1", question: "Poll 1?", isActive: true },
        { id: "poll2", question: "Poll 2?", isActive: true },
        { id: "poll3", question: "Poll 3?", isActive: false },
      ];
    });

    await page.reload();
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Select multiple polls
    await page.getByRole("checkbox", { name: /select poll 1/i }).check();
    await page.getByRole("checkbox", { name: /select poll 2/i }).check();

    // Verify bulk actions are available
    await expect(
      page.getByRole("button", { name: /bulk deactivate/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /bulk delete/i })
    ).toBeVisible();

    // Perform bulk deactivation
    await page.getByRole("button", { name: /bulk deactivate/i }).click();

    // Confirm bulk action
    await expect(page.getByText("Deactivate 2 polls?")).toBeVisible();
    await page.getByRole("button", { name: /confirm/i }).click();

    // Verify success message
    await expect(
      page.getByText("2 polls deactivated successfully!")
    ).toBeVisible();
  });

  test("poll analytics and statistics", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Navigate to analytics section
    await page.getByRole("button", { name: /analytics/i }).click();

    // Mock analytics data
    await page.evaluate(() => {
      (window as any).mockAnalytics = {
        totalPolls: 15,
        activePolls: 8,
        totalVotes: 142,
        averageParticipation: 78.5,
        topVotedPoll: "Tournament participation poll?",
        recentActivity: [
          {
            action: "Poll created",
            poll: "New poll",
            timestamp: "2024-01-01T10:00:00Z",
          },
          {
            action: "Vote submitted",
            poll: "Tournament poll",
            timestamp: "2024-01-01T09:30:00Z",
          },
        ],
      };
    });

    // Verify analytics dashboard
    await expect(page.getByText("Poll Analytics")).toBeVisible();
    await expect(page.getByText("Total Polls: 15")).toBeVisible();
    await expect(page.getByText("Active Polls: 8")).toBeVisible();
    await expect(page.getByText("Total Votes: 142")).toBeVisible();
    await expect(page.getByText("Average Participation: 78.5%")).toBeVisible();

    // Verify charts are rendered
    await expect(
      page.locator('[data-testid="poll-activity-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="participation-chart"]')
    ).toBeVisible();
  });

  test("poll export functionality", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("tab", { name: /poll management/i }).click();

    // Mock poll data for export
    await page.evaluate(() => {
      (window as any).mockPolls = [
        {
          id: "poll1",
          question: "Tournament participation?",
          type: "yes_no",
          isActive: true,
          votes: [
            { playerName: "Player1", vote: "Yes" },
            { playerName: "Player2", vote: "No" },
          ],
        },
      ];
    });

    // Test CSV export
    await page.getByRole("button", { name: /export csv/i }).click();

    // Verify download initiated
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /download/i }).click();
    const download = await downloadPromise;

    // Verify file name
    expect(download.suggestedFilename()).toMatch(
      /polls-export-\d{4}-\d{2}-\d{2}\.csv/
    );

    // Test PDF export
    await page.getByRole("button", { name: /export pdf/i }).click();

    const pdfDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /download pdf/i }).click();
    const pdfDownload = await pdfDownloadPromise;

    expect(pdfDownload.suggestedFilename()).toMatch(
      /polls-report-\d{4}-\d{2}-\d{2}\.pdf/
    );
  });
});
