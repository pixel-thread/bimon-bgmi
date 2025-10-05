import { test, expect } from "@playwright/test";

test.describe("Security Tests", () => {
  test.describe("Authentication Bypass Attempts", () => {
    test("cannot access admin routes without authentication", async ({
      page,
    }) => {
      // Clear any existing auth
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to access admin page directly
      await page.goto("/admin");

      // Should redirect to login
      await expect(page).toHaveURL("/login");

      // Try to access admin API endpoints
      const response = await page.request.get("/api/admin/polls");
      expect(response.status()).toBe(401);
    });

    test("cannot access admin routes with player authentication", async ({
      page,
    }) => {
      // Mock player authentication
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

      await page.goto("/admin");

      // Should be denied access or redirected
      await expect(page).not.toHaveURL("/admin");
      await expect(page.getByText(/access denied|unauthorized/i)).toBeVisible();
    });

    test("cannot manipulate localStorage to gain admin access", async ({
      page,
    }) => {
      // Try to fake admin auth in localStorage
      await page.addInitScript(() => {
        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            uid: "fake-admin",
            email: "fake@admin.com",
            role: "super_admin",
            isAuthorized: true,
          })
        );
      });

      await page.goto("/admin");

      // Should still be denied if server-side validation fails
      // This test assumes proper server-side validation
      const isOnAdminPage = await page.url().includes("/admin");

      if (isOnAdminPage) {
        // If on admin page, check that actual admin functions are protected
        const createPollButton = page.getByRole("button", {
          name: /create new poll/i,
        });
        if (await createPollButton.isVisible()) {
          await createPollButton.click();

          // Should show authentication error when trying to create poll
          await expect(
            page.getByText(/authentication required|unauthorized/i)
          ).toBeVisible();
        }
      }
    });

    test("session token validation prevents replay attacks", async ({
      page,
    }) => {
      // Mock expired token
      await page.addInitScript(() => {
        const expiredToken = {
          id: "player1",
          name: "TestPlayer",
          authType: "player",
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        };
        localStorage.setItem("playerAuth", JSON.stringify(expiredToken));
      });

      await page.goto("/tournament");

      // Should redirect to login due to expired token
      await expect(page).toHaveURL("/login");
      await expect(
        page.getByText(/session expired|please log in/i)
      ).toBeVisible();
    });

    test("cannot bypass player authentication with invalid tokens", async ({
      page,
    }) => {
      // Try various invalid token formats
      const invalidTokens = [
        "invalid-string",
        '{"malformed": json}',
        '{"id": "player1"}', // Missing required fields
        '{"id": "player1", "name": "TestPlayer", "authType": "admin"}', // Wrong auth type
      ];

      for (const token of invalidTokens) {
        await page.evaluate((tokenValue) => {
          localStorage.clear();
          localStorage.setItem("playerAuth", tokenValue);
        }, token);

        await page.goto("/tournament");

        // Vote tab should not be visible with invalid token
        await expect(
          page.getByRole("tab", { name: /vote/i })
        ).not.toBeVisible();
      }
    });

    test("prevents concurrent session hijacking", async ({ page, context }) => {
      // Create legitimate session
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
            sessionId: "session-123",
          })
        );
      });

      await page.goto("/tournament");
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();

      // Try to use same session in different tab
      const newTab = await context.newPage();
      await newTab.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
            sessionId: "session-123", // Same session ID
          })
        );
      });

      await newTab.goto("/tournament");

      // One of the sessions should be invalidated
      // This test assumes proper session management on the server
      await page.waitForTimeout(1000);

      const originalTabHasAccess = await page
        .getByRole("tab", { name: /vote/i })
        .isVisible();
      const newTabHasAccess = await newTab
        .getByRole("tab", { name: /vote/i })
        .isVisible();

      // Both tabs should not have access simultaneously
      expect(originalTabHasAccess && newTabHasAccess).toBe(false);

      await newTab.close();
    });
  });

  test.describe("Vote Manipulation Prevention", () => {
    test("prevents duplicate voting through client manipulation", async ({
      page,
    }) => {
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
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];

        // Mock that player has already voted
        (window as any).hasVoted = true;
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Verify voting buttons are disabled
      const yesButton = page.getByRole("button", { name: "Yes" });
      const noButton = page.getByRole("button", { name: "No" });

      await expect(yesButton).toBeDisabled();
      await expect(noButton).toBeDisabled();

      // Try to enable buttons through DOM manipulation
      await page.evaluate(() => {
        const buttons = document.querySelectorAll("button[data-vote-option]");
        buttons.forEach((button) => {
          (button as HTMLButtonElement).disabled = false;
        });
      });

      // Buttons should still be functionally disabled
      await yesButton.click();

      // Should not show vote confirmation dialog
      await expect(page.getByText("Confirm Your Vote")).not.toBeVisible();
    });

    test("prevents vote tampering through network interception", async ({
      page,
    }) => {
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
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      // Intercept and modify vote submission
      await page.route("**/api/votes", async (route) => {
        const request = route.request();
        const postData = request.postData();

        if (postData) {
          const voteData = JSON.parse(postData);

          // Try to tamper with vote data
          voteData.vote = "TamperedVote";
          voteData.playerId = "different-player";

          // Forward tampered request
          await route.continue({
            postData: JSON.stringify(voteData),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Submit vote
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Confirm Vote" }).click();

      // Server should reject tampered vote
      await expect(
        page.getByText(/invalid vote data|vote rejected/i)
      ).toBeVisible();
    });

    test("prevents voting on behalf of other players", async ({ page }) => {
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
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      // Intercept vote submission and try to change player ID
      await page.route("**/api/votes", async (route) => {
        const request = route.request();
        const postData = request.postData();

        if (postData) {
          const voteData = JSON.parse(postData);

          // Try to vote as different player
          voteData.playerId = "different-player";
          voteData.playerName = "DifferentPlayer";

          await route.continue({
            postData: JSON.stringify(voteData),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Confirm Vote" }).click();

      // Should show authentication error
      await expect(
        page.getByText(/authentication error|unauthorized/i)
      ).toBeVisible();
    });

    test("prevents voting on inactive or expired polls", async ({ page }) => {
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

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        (window as any).mockPolls = [
          {
            id: "poll1",
            question: "Expired poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: false, // Inactive poll
            expiresAt: yesterday.toISOString(), // Expired
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Try to force-enable voting buttons
      await page.evaluate(() => {
        const buttons = document.querySelectorAll("button[data-vote-option]");
        buttons.forEach((button) => {
          (button as HTMLButtonElement).disabled = false;
          (button as HTMLButtonElement).style.opacity = "1";
        });
      });

      // Try to click vote button
      await page.getByRole("button", { name: "Yes" }).click();

      // Should show error about poll being inactive/expired
      await expect(
        page.getByText(/poll is not active|poll has expired/i)
      ).toBeVisible();
    });

    test("prevents rapid-fire vote submissions", async ({ page }) => {
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
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      let requestCount = 0;

      // Count vote submission attempts
      await page.route("**/api/votes", async (route) => {
        requestCount++;

        if (requestCount === 1) {
          // First request succeeds
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true }),
          });
        } else {
          // Subsequent requests should be rate limited
          await route.fulfill({
            status: 429,
            body: JSON.stringify({ error: "Rate limit exceeded" }),
          });
        }
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      // Try to submit multiple votes rapidly
      for (let i = 0; i < 5; i++) {
        await page.getByRole("button", { name: "Yes" }).click();
        await page.getByRole("button", { name: "Confirm Vote" }).click();
        await page.waitForTimeout(100);
      }

      // Should show rate limiting error
      await expect(
        page.getByText(/rate limit|too many requests/i)
      ).toBeVisible();
    });

    test("validates vote options against poll configuration", async ({
      page,
    }) => {
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
            question: "Test poll question?",
            type: "yes_no",
            options: ["Yes", "No"], // Only these options are valid
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            createdBy: "admin123",
          },
        ];
      });

      // Intercept and modify vote option
      await page.route("**/api/votes", async (route) => {
        const request = route.request();
        const postData = request.postData();

        if (postData) {
          const voteData = JSON.parse(postData);

          // Try to submit invalid vote option
          voteData.vote = "InvalidOption";

          await route.continue({
            postData: JSON.stringify(voteData),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/tournament");
      await page.getByRole("tab", { name: /vote/i }).click();

      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Confirm Vote" }).click();

      // Should reject invalid vote option
      await expect(
        page.getByText(/invalid vote option|vote rejected/i)
      ).toBeVisible();
    });
  });

  test.describe("Admin Security Tests", () => {
    test("prevents unauthorized poll creation", async ({ page }) => {
      // Mock player trying to access admin functions
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

      // Try to create poll via API
      const response = await page.request.post("/api/admin/polls", {
        data: {
          question: "Unauthorized poll?",
          type: "yes_no",
          options: ["Yes", "No"],
        },
      });

      expect(response.status()).toBe(401);
    });

    test("prevents poll manipulation by non-admin users", async ({ page }) => {
      // Mock player authentication
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

      // Try to modify existing poll
      const response = await page.request.put("/api/admin/polls/poll1", {
        data: {
          question: "Modified poll question?",
          isActive: false,
        },
      });

      expect(response.status()).toBe(401);
    });

    test("prevents unauthorized access to poll results", async ({ page }) => {
      // Mock player authentication
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

      // Try to access poll results
      const response = await page.request.get("/api/admin/polls/poll1/results");

      expect(response.status()).toBe(401);
    });

    test("validates admin role before allowing operations", async ({
      page,
    }) => {
      // Mock user with helper role (not super admin)
      await page.addInitScript(() => {
        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            uid: "helper123",
            email: "helper@test.com",
            role: "helper", // Not super_admin
            isAuthorized: true,
          })
        );
      });

      // Try to create poll (should require super_admin role)
      const response = await page.request.post("/api/admin/polls", {
        data: {
          question: "Helper poll?",
          type: "yes_no",
          options: ["Yes", "No"],
        },
      });

      expect(response.status()).toBe(403); // Forbidden
    });
  });

  test.describe("Input Validation and Sanitization", () => {
    test("prevents XSS attacks in poll questions", async ({ page }) => {
      // Mock admin authentication
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
      await page.getByRole("button", { name: /create new poll/i }).click();

      // Try to inject script in poll question
      const maliciousInput = '<script>alert("XSS")</script>Malicious poll?';
      await page.getByLabelText("Question").fill(maliciousInput);

      await page.getByRole("combobox", { name: /poll type/i }).click();
      await page.getByRole("option", { name: "Yes/No" }).click();

      await page.getByRole("button", { name: /create poll/i }).click();

      // Check that script is not executed
      const alerts = [];
      page.on("dialog", (dialog) => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0);

      // Check that content is properly escaped
      if (await page.getByText("Poll created successfully!").isVisible()) {
        const pollText = await page.textContent(
          '[data-testid="poll-question"]'
        );
        expect(pollText).not.toContain("<script>");
      }
    });

    test("prevents SQL injection in player name search", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      // Try SQL injection in name input
      const sqlInjection = "'; DROP TABLE players; --";
      const nameInput = page.getByLabelText("Player Name");

      await nameInput.fill(sqlInjection);
      await page.waitForTimeout(500);

      // Should not cause any errors or unexpected behavior
      // The input should be treated as a regular search string
      await expect(page.getByText("No players found")).toBeVisible();
    });

    test("validates poll option limits", async ({ page }) => {
      // Mock admin authentication
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
      await page.getByRole("button", { name: /create new poll/i }).click();

      await page.getByLabelText("Question").fill("Test poll?");
      await page.getByRole("combobox", { name: /poll type/i }).click();
      await page.getByRole("option", { name: "Multiple Choice" }).click();

      // Try to add too many options
      for (let i = 1; i <= 20; i++) {
        if (i <= 2) {
          // Fill existing option fields
          await page.getByLabelText(`Option ${i}`).fill(`Option ${i}`);
        } else {
          // Try to add more options
          const addButton = page.getByRole("button", { name: /add option/i });
          if (await addButton.isVisible()) {
            await addButton.click();
            await page.getByLabelText(`Option ${i}`).fill(`Option ${i}`);
          } else {
            break; // Limit reached
          }
        }
      }

      await page.getByRole("button", { name: /create poll/i }).click();

      // Should show validation error if too many options
      const optionInputs = page.locator('input[placeholder*="Option"]');
      const optionCount = await optionInputs.count();

      if (optionCount > 10) {
        // Assuming 10 is the limit
        await expect(
          page.getByText(/too many options|option limit/i)
        ).toBeVisible();
      }
    });

    test("prevents oversized poll questions", async ({ page }) => {
      // Mock admin authentication
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
      await page.getByRole("button", { name: /create new poll/i }).click();

      // Try to create very long poll question
      const longQuestion = "A".repeat(1000) + "?";
      await page.getByLabelText("Question").fill(longQuestion);

      await page.getByRole("combobox", { name: /poll type/i }).click();
      await page.getByRole("option", { name: "Yes/No" }).click();

      await page.getByRole("button", { name: /create poll/i }).click();

      // Should show validation error
      await expect(
        page.getByText(/question too long|character limit/i)
      ).toBeVisible();
    });
  });

  test.describe("Session Security", () => {
    test("session tokens expire properly", async ({ page }) => {
      // Mock session with short expiration
      await page.addInitScript(() => {
        const shortLivedToken = {
          id: "player1",
          name: "TestPlayer",
          authType: "player",
          expiresAt: new Date(Date.now() + 1000).toISOString(), // 1 second
        };
        localStorage.setItem("playerAuth", JSON.stringify(shortLivedToken));
      });

      await page.goto("/tournament");

      // Initially should have access
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();

      // Wait for token to expire
      await page.waitForTimeout(2000);

      // Try to perform action that requires authentication
      await page.getByRole("tab", { name: /vote/i }).click();

      // Should be redirected to login
      await expect(page).toHaveURL("/login");
    });

    test("prevents session fixation attacks", async ({ page, context }) => {
      // Create initial session
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
            sessionId: "fixed-session-id",
          })
        );
      });

      await page.goto("/tournament");

      // Simulate logout and new login
      await page.evaluate(() => localStorage.clear());

      // Mock new login with same session ID (should be rejected)
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player2",
            name: "AnotherPlayer",
            authType: "player",
            sessionId: "fixed-session-id", // Same session ID
          })
        );
      });

      await page.goto("/tournament");

      // Should not have access with reused session ID
      await expect(page.getByRole("tab", { name: /vote/i })).not.toBeVisible();
    });

    test("secure cookie attributes are set", async ({ page }) => {
      await page.goto("/login");

      // Check that security-related cookies have proper attributes
      const cookies = await page.context().cookies();

      for (const cookie of cookies) {
        if (cookie.name.includes("auth") || cookie.name.includes("session")) {
          // Security cookies should be httpOnly and secure
          expect(cookie.httpOnly).toBe(true);
          expect(cookie.secure).toBe(true);
          expect(cookie.sameSite).toBe("Strict");
        }
      }
    });
  });
});
