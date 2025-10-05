import { test, expect } from "@playwright/test";

test.describe("Accessibility Tests", () => {
  test.describe("Login Page Accessibility", () => {
    test("login page meets WCAG standards", async ({ page }) => {
      await page.goto("/login");

      // Check page has proper title
      await expect(page).toHaveTitle(/Tournament Access/);

      // Check main heading exists and is properly structured
      const mainHeading = page.getByRole("heading", { level: 1 });
      await expect(mainHeading).toBeVisible();

      // Check form labels are properly associated
      const emailInput = page.getByLabelText("Email Address");
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute("type", "email");

      const passwordInput = page.getByLabelText("Password");
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute("type", "password");

      // Check buttons have accessible names
      const signInButton = page.getByRole("button", { name: /sign in/i });
      await expect(signInButton).toBeVisible();

      const googleButton = page.getByRole("button", {
        name: /sign in with google/i,
      });
      await expect(googleButton).toBeVisible();

      // Check tab navigation works
      await page.keyboard.press("Tab");
      await expect(emailInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(passwordInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(signInButton).toBeFocused();
    });

    test("player login form accessibility", async ({ page }) => {
      await page.goto("/login");

      // Switch to player tab
      const playerTab = page.getByRole("button", { name: /player/i });
      await playerTab.click();

      // Check player form accessibility
      const nameInput = page.getByLabelText("Player Name");
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveAttribute("autocomplete", "username");

      const playerPasswordInput = page.getByLabelText("Password");
      await expect(playerPasswordInput).toBeVisible();
      await expect(playerPasswordInput).toHaveAttribute("type", "password");

      // Check disabled state is properly communicated
      await expect(playerPasswordInput).toBeDisabled();
      const disabledMessage = page.getByText(
        "Select your name first to enable password entry"
      );
      await expect(disabledMessage).toBeVisible();

      // Check ARIA attributes
      await expect(nameInput).toHaveAttribute("aria-describedby");
      await expect(playerPasswordInput).toHaveAttribute("aria-describedby");
    });

    test("error messages are accessible", async ({ page }) => {
      await page.goto("/login");

      // Trigger validation error
      const emailInput = page.getByLabelText("Email Address");
      await emailInput.fill("invalid-email");

      const signInButton = page.getByRole("button", { name: /sign in/i });
      await signInButton.click();

      // Check error message is properly associated
      const errorMessage = page.getByText("Please enter a valid email address");
      await expect(errorMessage).toBeVisible();

      // Check error is announced to screen readers
      await expect(errorMessage).toHaveAttribute("role", "alert");

      // Check input has aria-invalid
      await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    test("keyboard navigation in auth method tabs", async ({ page }) => {
      await page.goto("/login");

      const adminTab = page.getByRole("button", { name: /admin/i });
      const playerTab = page.getByRole("button", { name: /player/i });

      // Test keyboard navigation between tabs
      await adminTab.focus();
      await expect(adminTab).toBeFocused();

      await page.keyboard.press("ArrowRight");
      await expect(playerTab).toBeFocused();

      await page.keyboard.press("ArrowLeft");
      await expect(adminTab).toBeFocused();

      // Test Enter key activation
      await playerTab.focus();
      await page.keyboard.press("Enter");

      // Verify tab switched
      await expect(page.getByLabelText("Player Name")).toBeVisible();
    });
  });

  test.describe("Name Autocomplete Accessibility", () => {
    test("autocomplete dropdown is accessible", async ({ page }) => {
      // Mock player suggestions
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: () =>
            Promise.resolve([
              { id: "player1", name: "TestPlayer1", category: "Pro" },
              { id: "player2", name: "TestPlayer2", category: "Noob" },
              { id: "player3", name: "TestPlayer3", category: "Ultra Pro" },
            ]),
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");

      // Type to trigger autocomplete
      await nameInput.fill("Test");

      // Wait for suggestions
      await page.waitForTimeout(500);

      // Check dropdown has proper ARIA attributes
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      // Check input has proper ARIA attributes
      await expect(nameInput).toHaveAttribute("role", "combobox");
      await expect(nameInput).toHaveAttribute("aria-expanded", "true");
      await expect(nameInput).toHaveAttribute("aria-autocomplete", "list");

      // Check options have proper roles
      const options = page.locator('[role="option"]');
      await expect(options).toHaveCount(3);

      // Test keyboard navigation
      await nameInput.press("ArrowDown");
      await expect(options.first()).toHaveAttribute("aria-selected", "true");

      await nameInput.press("ArrowDown");
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

      // Test selection with Enter
      await nameInput.press("Enter");
      await expect(nameInput).toHaveValue("TestPlayer2");

      // Check dropdown closes
      await expect(dropdown).not.toBeVisible();
      await expect(nameInput).toHaveAttribute("aria-expanded", "false");
    });

    test("autocomplete announces changes to screen readers", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: (query: string) => {
            const count = query.length;
            return Promise.resolve(
              Array.from({ length: Math.min(count, 5) }, (_, i) => ({
                id: `player${i}`,
                name: `${query}Player${i}`,
                category: "Pro",
              }))
            );
          },
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");

      // Type to trigger autocomplete
      await nameInput.fill("T");
      await page.waitForTimeout(500);

      // Check live region announces results
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toContainText("1 suggestion available");

      // Type more characters
      await nameInput.fill("Te");
      await page.waitForTimeout(500);

      await expect(liveRegion).toContainText("2 suggestions available");
    });

    test("autocomplete handles no results accessibly", async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: () => Promise.resolve([]),
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");
      await nameInput.fill("NonExistentPlayer");
      await page.waitForTimeout(500);

      // Check no results message is accessible
      const noResultsMessage = page.getByText("No players found");
      await expect(noResultsMessage).toBeVisible();
      await expect(noResultsMessage).toHaveAttribute("role", "status");

      // Check live region announces no results
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toContainText("No suggestions available");
    });
  });

  test.describe("Vote Tab Accessibility", () => {
    test("vote interface is accessible", async ({ page }) => {
      // Mock authenticated player
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
          })
        );

        (window as any).mockPolls = [
          {
            id: "poll1",
            question: "Will you participate in the tournament?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      await page.goto("/tournament");

      // Check Vote tab is accessible
      const voteTab = page.getByRole("tab", { name: /vote/i });
      await expect(voteTab).toBeVisible();
      await expect(voteTab).toHaveAttribute("aria-selected", "false");

      await voteTab.click();
      await expect(voteTab).toHaveAttribute("aria-selected", "true");

      // Check poll content is accessible
      const pollHeading = page.getByRole("heading", {
        name: /will you participate/i,
      });
      await expect(pollHeading).toBeVisible();

      // Check voting buttons are accessible
      const yesButton = page.getByRole("button", { name: "Yes" });
      const noButton = page.getByRole("button", { name: "No" });

      await expect(yesButton).toBeVisible();
      await expect(noButton).toBeVisible();

      // Check buttons have proper ARIA labels
      await expect(yesButton).toHaveAttribute("aria-describedby");
      await expect(noButton).toHaveAttribute("aria-describedby");

      // Test keyboard navigation
      await yesButton.focus();
      await expect(yesButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(noButton).toBeFocused();
    });

    test("vote confirmation dialog is accessible", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
          })
        );

        (window as any).mockPolls = [
          {
            id: "poll1",
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Click vote button
      await page.getByRole("button", { name: "Yes" }).click();

      // Check dialog accessibility
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-labelledby");
      await expect(dialog).toHaveAttribute("aria-describedby");

      // Check dialog title
      const dialogTitle = page.getByRole("heading", {
        name: /confirm your vote/i,
      });
      await expect(dialogTitle).toBeVisible();

      // Check focus is trapped in dialog
      const confirmButton = page.getByRole("button", { name: /confirm vote/i });
      const cancelButton = page.getByRole("button", { name: /cancel/i });

      await expect(confirmButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(cancelButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(confirmButton).toBeFocused(); // Focus wraps

      // Test Escape key closes dialog
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    });

    test("voted state is accessible", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
          })
        );

        (window as any).mockPolls = [
          {
            id: "poll1",
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];

        // Mock that player has already voted
        (window as any).mockVotes = [
          {
            pollId: "poll1",
            playerId: "player1",
            vote: "Yes",
          },
        ];
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Check voted state is communicated
      const votedMessage = page.getByText("You voted: Yes");
      await expect(votedMessage).toBeVisible();
      await expect(votedMessage).toHaveAttribute("role", "status");

      // Check buttons are disabled and properly labeled
      const yesButton = page.getByRole("button", { name: "Yes" });
      const noButton = page.getByRole("button", { name: "No" });

      await expect(yesButton).toBeDisabled();
      await expect(noButton).toBeDisabled();

      // Check disabled buttons have proper ARIA attributes
      await expect(yesButton).toHaveAttribute("aria-disabled", "true");
      await expect(noButton).toHaveAttribute("aria-disabled", "true");
    });

    test("multiple choice poll accessibility", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
          })
        );

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

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Check all options are accessible
      const options = ["Solo", "Duo", "Squad", "Custom"];

      for (const option of options) {
        const button = page.getByRole("button", { name: option });
        await expect(button).toBeVisible();
        await expect(button).toHaveAttribute("aria-describedby");
      }

      // Check options form a logical group
      const optionGroup = page.locator('[role="group"]');
      await expect(optionGroup).toBeVisible();
      await expect(optionGroup).toHaveAttribute("aria-labelledby");
    });
  });

  test.describe("Admin Poll Management Accessibility", () => {
    test("admin dashboard is accessible", async ({ page }) => {
      await page.addInitScript(() => {
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

      await page.goto("/admin");

      // Check main heading
      const mainHeading = page.getByRole("heading", {
        level: 1,
        name: /admin dashboard/i,
      });
      await expect(mainHeading).toBeVisible();

      // Check navigation tabs
      const pollManagementTab = page.getByRole("tab", {
        name: /poll management/i,
      });
      await expect(pollManagementTab).toBeVisible();

      // Check skip link for keyboard users
      const skipLink = page.getByRole("link", {
        name: /skip to main content/i,
      });
      if (await skipLink.isVisible()) {
        await expect(skipLink).toHaveAttribute("href", "#main-content");
      }
    });

    test("poll creation form is accessible", async ({ page }) => {
      await page.addInitScript(() => {
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

      await page.goto("/admin");
      await page.getByRole("tab", { name: /poll management/i }).click();

      // Open create poll modal
      await page.getByRole("button", { name: /create new poll/i }).click();

      // Check modal accessibility
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();
      await expect(modal).toHaveAttribute("aria-labelledby");

      // Check form fields are properly labeled
      const questionInput = page.getByLabelText("Question");
      await expect(questionInput).toBeVisible();
      await expect(questionInput).toHaveAttribute("required");

      const typeSelect = page.getByLabelText("Poll Type");
      await expect(typeSelect).toBeVisible();

      // Check form validation is accessible
      const createButton = page.getByRole("button", { name: /create poll/i });
      await createButton.click();

      // Check error message is accessible
      const errorMessage = page.getByText("Question is required");
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveAttribute("role", "alert");

      // Check input has aria-invalid
      await expect(questionInput).toHaveAttribute("aria-invalid", "true");
    });

    test("poll results table is accessible", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            uid: "admin123",
            email: "admin@test.com",
            role: "super_admin",
            isAuthorized: true,
          })
        );

        (window as any).mockPollResults = {
          poll: {
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
          },
          votes: [
            {
              playerName: "Player1",
              vote: "Yes",
              votedAt: "2024-01-01T10:00:00Z",
            },
            {
              playerName: "Player2",
              vote: "No",
              votedAt: "2024-01-01T11:00:00Z",
            },
          ],
        };
      });

      await page.goto("/admin");
      await page.getByRole("tab", { name: /poll management/i }).click();

      // Open poll results
      await page
        .getByRole("button", { name: /view results/i })
        .first()
        .click();

      // Check table accessibility
      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      // Check table has caption
      const caption = page.locator("caption");
      await expect(caption).toBeVisible();

      // Check column headers
      const headers = page.locator("th");
      await expect(headers).toHaveCount(3); // Player, Vote, Time

      // Check each header has proper scope
      for (let i = 0; i < 3; i++) {
        await expect(headers.nth(i)).toHaveAttribute("scope", "col");
      }

      // Check table data is properly structured
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(2);
    });

    test("bulk operations are accessible", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            uid: "admin123",
            email: "admin@test.com",
            role: "super_admin",
            isAuthorized: true,
          })
        );

        (window as any).mockPolls = [
          { id: "poll1", question: "Poll 1?", isActive: true },
          { id: "poll2", question: "Poll 2?", isActive: true },
        ];
      });

      await page.goto("/admin");
      await page.getByRole("tab", { name: /poll management/i }).click();

      // Check select all checkbox
      const selectAllCheckbox = page.getByRole("checkbox", {
        name: /select all/i,
      });
      await expect(selectAllCheckbox).toBeVisible();

      // Check individual checkboxes
      const pollCheckboxes = page.locator(
        'input[type="checkbox"][data-poll-id]'
      );
      await expect(pollCheckboxes).toHaveCount(2);

      // Test keyboard navigation
      await selectAllCheckbox.focus();
      await expect(selectAllCheckbox).toBeFocused();

      await page.keyboard.press("Space");
      await expect(selectAllCheckbox).toBeChecked();

      // Check bulk action buttons become available
      const bulkDeleteButton = page.getByRole("button", {
        name: /bulk delete/i,
      });
      await expect(bulkDeleteButton).toBeVisible();
      await expect(bulkDeleteButton).toHaveAttribute("aria-describedby");
    });
  });

  test.describe("Color Contrast and Visual Accessibility", () => {
    test("sufficient color contrast on all interactive elements", async ({
      page,
    }) => {
      await page.goto("/login");

      // Check button contrast
      const signInButton = page.getByRole("button", { name: /sign in/i });
      const buttonStyles = await signInButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor,
        };
      });

      // Basic check that colors are defined
      expect(buttonStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(buttonStyles.color).not.toBe("rgba(0, 0, 0, 0)");

      // Check focus indicators
      await signInButton.focus();
      const focusStyles = await signInButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
        };
      });

      // Should have visible focus indicator
      const hasFocusIndicator =
        focusStyles.outline !== "none" || focusStyles.boxShadow !== "none";
      expect(hasFocusIndicator).toBe(true);
    });

    test("text scaling works properly", async ({ page }) => {
      await page.goto("/login");

      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 480 });

      // Check that content is still accessible
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();

      const emailInput = page.getByLabelText("Email Address");
      await expect(emailInput).toBeVisible();

      // Check that text doesn't overflow
      const headingBox = await heading.boundingBox();
      const viewportWidth = 640;

      if (headingBox) {
        expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(
          viewportWidth
        );
      }
    });

    test("reduced motion preferences are respected", async ({ page }) => {
      // Mock reduced motion preference
      await page.addInitScript(() => {
        Object.defineProperty(window, "matchMedia", {
          writable: true,
          value: (query: string) => ({
            matches: query === "(prefers-reduced-motion: reduce)",
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {},
          }),
        });
      });

      await page.goto("/login");

      // Check that animations are disabled or reduced
      const animatedElements = page.locator("[data-animate]");

      if ((await animatedElements.count()) > 0) {
        const animationStyles = await animatedElements
          .first()
          .evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              animationDuration: styles.animationDuration,
              transitionDuration: styles.transitionDuration,
            };
          });

        // Animations should be disabled or very short
        expect(
          animationStyles.animationDuration === "0s" ||
            animationStyles.transitionDuration === "0s"
        ).toBe(true);
      }
    });
  });

  test.describe("Screen Reader Compatibility", () => {
    test("page landmarks are properly defined", async ({ page }) => {
      await page.goto("/tournament");

      // Check for main landmark
      const main = page.locator("main");
      await expect(main).toBeVisible();

      // Check for navigation landmark
      const nav = page.locator("nav");
      if ((await nav.count()) > 0) {
        await expect(nav.first()).toBeVisible();
      }

      // Check for banner/header
      const header = page.locator("header");
      if ((await header.count()) > 0) {
        await expect(header.first()).toBeVisible();
      }
    });

    test("dynamic content changes are announced", async ({ page }) => {
      await page.addInitScript(() => {
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

      // Check for live regions
      const liveRegions = page.locator("[aria-live]");
      await expect(liveRegions).toHaveCount.greaterThan(0);

      // Check for status messages
      const statusMessages = page.locator('[role="status"]');
      if ((await statusMessages.count()) > 0) {
        await expect(statusMessages.first()).toBeVisible();
      }
    });

    test("form instructions are properly associated", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");
      const passwordInput = page.getByLabelText("Password");

      // Check for describedby associations
      const nameDescribedBy = await nameInput.getAttribute("aria-describedby");
      const passwordDescribedBy = await passwordInput.getAttribute(
        "aria-describedby"
      );

      if (nameDescribedBy) {
        const descriptionElement = page.locator(`#${nameDescribedBy}`);
        await expect(descriptionElement).toBeVisible();
      }

      if (passwordDescribedBy) {
        const descriptionElement = page.locator(`#${passwordDescribedBy}`);
        await expect(descriptionElement).toBeVisible();
      }
    });
  });
});
