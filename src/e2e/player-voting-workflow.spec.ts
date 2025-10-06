import { test, expect } from "@playwright/test";

test.describe("Player Voting Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase to avoid real authentication
    await page.addInitScript(() => {
      // Mock Firebase Auth
      (window as any).firebase = {
        auth: () => ({
          onAuthStateChanged: () => () => {},
          signOut: () => Promise.resolve(),
        }),
      };

      // Mock Firestore
      (window as any).firestore = {
        collection: () => ({
          doc: () => ({
            get: () => Promise.resolve({ exists: false }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve(),
          }),
          where: () => ({
            get: () => Promise.resolve({ empty: true, docs: [] }),
          }),
        }),
      };
    });
  });

  test("complete player voting workflow", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Verify login page loads
    await expect(page.getByText("Tournament Access")).toBeVisible();
    await expect(page.getByText("Choose your login method")).toBeVisible();

    // Switch to player login tab
    await page.getByRole("button", { name: /player/i }).click();

    // Verify player login form is displayed
    await expect(page.getByLabelText("Player Name")).toBeVisible();
    await expect(page.getByLabelText("Password")).toBeDisabled();
    await expect(
      page.getByText("Select your name first to enable password entry")
    ).toBeVisible();

    // Test name autocomplete functionality
    const nameInput = page.getByLabelText("Player Name");
    await nameInput.fill("Test");

    // Wait for autocomplete suggestions (mocked)
    await page.waitForTimeout(500);

    // Mock player selection
    await page.evaluate(() => {
      const event = new CustomEvent("playerSelected", {
        detail: { id: "player1", name: "TestPlayer" },
      });
      document.dispatchEvent(event);
    });

    // Verify password field is enabled after player selection
    const passwordInput = page.getByLabelText("Password");
    await expect(passwordInput).toBeEnabled();

    // Enter password and submit
    await passwordInput.fill("testpassword");
    await page.getByRole("button", { name: /sign in as player/i }).click();

    // Mock successful authentication
    await page.evaluate(() => {
      localStorage.setItem(
        "playerAuth",
        JSON.stringify({
          id: "player1",
          name: "TestPlayer",
          authType: "player",
        })
      );
    });

    // Should redirect to tournament page
    await expect(page).toHaveURL("/tournament");

    // Verify Vote tab is visible for authenticated player
    await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();

    // Click on Vote tab
    await page.getByRole("tab", { name: /vote/i }).click();

    // Verify vote interface is displayed
    await expect(page.getByText("Tournament Polls")).toBeVisible();

    // Mock active poll data
    await page.evaluate(() => {
      (window as any).mockPolls = [
        {
          id: "poll1",
          question: "Will you participate in the next tournament?",
          type: "yes_no",
          options: ["Yes", "No"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin123",
        },
      ];
    });

    // Wait for polls to load
    await page.waitForTimeout(1000);

    // Verify poll question is displayed
    await expect(
      page.getByText("Will you participate in the next tournament?")
    ).toBeVisible();

    // Verify voting options are available
    await expect(page.getByRole("button", { name: "Yes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "No" })).toBeVisible();

    // Submit a vote
    await page.getByRole("button", { name: "Yes" }).click();

    // Verify confirmation dialog
    await expect(page.getByText("Confirm Your Vote")).toBeVisible();
    await expect(
      page.getByText('Are you sure you want to vote "Yes"?')
    ).toBeVisible();

    // Confirm the vote
    await page.getByRole("button", { name: "Confirm Vote" }).click();

    // Verify success message
    await expect(page.getByText("Vote submitted successfully!")).toBeVisible();

    // Verify vote is recorded and voting is disabled
    await expect(page.getByText("You voted: Yes")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yes" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "No" })).toBeDisabled();
  });

  test("player login with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Switch to player login
    await page.getByRole("button", { name: /player/i }).click();

    // Mock player selection
    const nameInput = page.getByLabelText("Player Name");
    await nameInput.fill("TestPlayer");

    await page.evaluate(() => {
      const event = new CustomEvent("playerSelected", {
        detail: { id: "player1", name: "TestPlayer" },
      });
      document.dispatchEvent(event);
    });

    // Enter wrong password
    await page.getByLabelText("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in as player/i }).click();

    // Verify error message
    await expect(
      page.getByText(
        "Invalid credentials. Please check your name and password."
      )
    ).toBeVisible();

    // Verify user remains on login page
    await expect(page).toHaveURL("/login");
  });

  test("vote tab hidden for non-authenticated users", async ({ page }) => {
    await page.goto("/tournament");

    // Verify Vote tab is not visible for non-authenticated users
    await expect(page.getByRole("tab", { name: /vote/i })).not.toBeVisible();

    // Verify other tabs are still visible
    await expect(page.getByRole("tab", { name: /positions/i })).toBeVisible();
  });

  test("voting on expired poll", async ({ page }) => {
    // Mock authenticated player
    await page.evaluate(() => {
      localStorage.setItem(
        "playerAuth",
        JSON.stringify({
          id: "player1",
          name: "TestPlayer",
          authType: "player",
        })
      );
    });

    await page.goto("/tournament");
    await page.getByRole("tab", { name: /vote/i }).click();

    // Mock expired poll
    await page.evaluate(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      (window as any).mockPolls = [
        {
          id: "poll1",
          question: "Expired poll question?",
          type: "yes_no",
          options: ["Yes", "No"],
          isActive: true,
          expiresAt: yesterday.toISOString(),
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin123",
        },
      ];
    });

    await page.waitForTimeout(1000);

    // Verify expired poll message
    await expect(page.getByText("This poll has expired")).toBeVisible();

    // Verify voting buttons are disabled
    await expect(page.getByRole("button", { name: "Yes" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "No" })).toBeDisabled();
  });

  test("real-time poll updates", async ({ page }) => {
    // Mock authenticated player
    await page.evaluate(() => {
      localStorage.setItem(
        "playerAuth",
        JSON.stringify({
          id: "player1",
          name: "TestPlayer",
          authType: "player",
        })
      );
    });

    await page.goto("/tournament");
    await page.getByRole("tab", { name: /vote/i }).click();

    // Initially no polls
    await expect(page.getByText("No active polls at the moment")).toBeVisible();

    // Simulate new poll being added
    await page.evaluate(() => {
      setTimeout(() => {
        (window as any).mockPolls = [
          {
            id: "poll1",
            question: "New poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: "admin123",
          },
        ];

        // Trigger re-render
        const event = new CustomEvent("pollsUpdated");
        document.dispatchEvent(event);
      }, 1000);
    });

    // Wait for new poll to appear
    await expect(page.getByText("New poll question?")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByRole("button", { name: "Yes" })).toBeVisible();
  });

  test("multiple choice poll voting", async ({ page }) => {
    // Mock authenticated player
    await page.evaluate(() => {
      localStorage.setItem(
        "playerAuth",
        JSON.stringify({
          id: "player1",
          name: "TestPlayer",
          authType: "player",
        })
      );
    });

    await page.goto("/tournament");
    await page.getByRole("tab", { name: /vote/i }).click();

    // Mock multiple choice poll
    await page.evaluate(() => {
      (window as any).mockPolls = [
        {
          id: "poll1",
          question: "What is your preferred game mode?",
          type: "multiple_choice",
          options: ["Solo", "Duo", "Squad", "Custom"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          createdBy: "admin123",
        },
      ];
    });

    await page.waitForTimeout(1000);

    // Verify all options are available
    await expect(page.getByRole("button", { name: "Solo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Duo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Squad" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Custom" })).toBeVisible();

    // Vote for Squad
    await page.getByRole("button", { name: "Squad" }).click();
    await page.getByRole("button", { name: "Confirm Vote" }).click();

    // Verify vote is recorded
    await expect(page.getByText("You voted: Squad")).toBeVisible();
  });
});
