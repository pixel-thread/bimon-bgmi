import { test, expect } from "@playwright/test";

test.describe("Performance Tests", () => {
  test.describe("Name Autocomplete Performance", () => {
    test("autocomplete response time with large dataset", async ({ page }) => {
      // Mock large player dataset (1000 players)
      await page.addInitScript(() => {
        const generatePlayers = (count: number) => {
          const players = [];
          const categories = ["Noob", "Pro", "Ultra Noob", "Ultra Pro"];

          for (let i = 1; i <= count; i++) {
            players.push({
              id: `player${i}`,
              name: `Player${i.toString().padStart(4, "0")}`,
              category: categories[i % categories.length],
              isLoginEnabled: true,
            });
          }
          return players;
        };

        const allPlayers = generatePlayers(1000);

        (window as any).playerAuthService = {
          getPlayerSuggestions: (query: string) => {
            const startTime = performance.now();

            const filtered = allPlayers
              .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 10);

            const endTime = performance.now();
            console.log(`Filter time: ${endTime - startTime}ms`);

            return Promise.resolve(filtered);
          },
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");

      // Measure typing response time
      const startTime = Date.now();
      await nameInput.fill("Player");

      // Wait for suggestions to appear
      await expect(page.getByText("Player0001")).toBeVisible({ timeout: 2000 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert response time is under 500ms
      expect(responseTime).toBeLessThan(500);

      // Verify suggestions are limited to 10
      const suggestions = page.locator('[data-testid="player-suggestion"]');
      await expect(suggestions).toHaveCount(10);
    });

    test("autocomplete debouncing effectiveness", async ({ page }) => {
      let requestCount = 0;

      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: (query: string) => {
            (window as any).requestCount =
              ((window as any).requestCount || 0) + 1;
            return Promise.resolve([
              { id: "player1", name: "TestPlayer", category: "Pro" },
            ]);
          },
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");

      // Type rapidly to test debouncing
      await nameInput.fill("T");
      await nameInput.fill("Te");
      await nameInput.fill("Tes");
      await nameInput.fill("Test");

      // Wait for debounce period
      await page.waitForTimeout(600);

      // Check how many requests were made
      const finalRequestCount = await page.evaluate(
        () => (window as any).requestCount
      );

      // Should be significantly less than 4 due to debouncing
      expect(finalRequestCount).toBeLessThanOrEqual(2);
    });

    test("autocomplete memory usage with repeated searches", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: (query: string) => {
            // Simulate memory-intensive operation
            const largeArray = new Array(1000).fill(0).map((_, i) => ({
              id: `player${i}`,
              name: `Player${i}`,
              category: "Pro",
            }));

            return Promise.resolve(
              largeArray.filter((p) => p.name.includes(query)).slice(0, 10)
            );
          },
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");

      // Perform multiple searches
      const searches = ["A", "B", "C", "D", "E"];

      for (const search of searches) {
        await nameInput.clear();
        await nameInput.fill(search);
        await page.waitForTimeout(300);
      }

      // Check memory usage (basic check)
      const memoryInfo = await page.evaluate(() => {
        if ("memory" in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      if (memoryInfo) {
        // Ensure memory usage is reasonable (less than 50MB)
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test("autocomplete keyboard navigation performance", async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: () =>
            Promise.resolve([
              { id: "player1", name: "Player1", category: "Pro" },
              { id: "player2", name: "Player2", category: "Noob" },
              { id: "player3", name: "Player3", category: "Ultra Pro" },
              { id: "player4", name: "Player4", category: "Ultra Noob" },
              { id: "player5", name: "Player5", category: "Pro" },
            ]),
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");
      await nameInput.fill("Player");

      // Wait for suggestions
      await expect(page.getByText("Player1")).toBeVisible();

      // Test rapid keyboard navigation
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await nameInput.press("ArrowDown");
        await page.waitForTimeout(10); // Small delay to simulate real usage
      }

      const endTime = Date.now();
      const navigationTime = endTime - startTime;

      // Navigation should be smooth (under 200ms total)
      expect(navigationTime).toBeLessThan(200);
    });
  });

  test.describe("Poll Loading Performance", () => {
    test("poll loading time with multiple active polls", async ({ page }) => {
      // Mock multiple polls
      await page.addInitScript(() => {
        const generatePolls = (count: number) => {
          const polls = [];
          const types = ["yes_no", "yes_no_maybe", "multiple_choice"];

          for (let i = 1; i <= count; i++) {
            polls.push({
              id: `poll${i}`,
              question: `Poll question ${i}?`,
              type: types[i % types.length],
              options:
                types[i % types.length] === "multiple_choice"
                  ? ["Option A", "Option B", "Option C", "Option D"]
                  : types[i % types.length] === "yes_no_maybe"
                  ? ["Yes", "No", "Maybe"]
                  : ["Yes", "No"],
              isActive: true,
              createdAt: new Date(Date.now() - i * 3600000).toISOString(),
              createdBy: "admin123",
            });
          }
          return polls;
        };

        (window as any).mockPolls = generatePolls(50);

        // Mock Firebase with performance tracking
        (window as any).firestore = {
          collection: () => ({
            where: () => ({
              orderBy: () => ({
                get: () => {
                  const startTime = performance.now();

                  return new Promise((resolve) => {
                    setTimeout(() => {
                      const endTime = performance.now();
                      console.log(`Poll fetch time: ${endTime - startTime}ms`);

                      resolve({
                        docs: (window as any).mockPolls.map((poll: any) => ({
                          id: poll.id,
                          data: () => poll,
                        })),
                      });
                    }, 100); // Simulate network delay
                  });
                },
              }),
            }),
          }),
        };

        // Mock player auth
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

      // Measure poll loading time
      const startTime = Date.now();

      await page.getByRole("tab", { name: /vote/i }).click();

      // Wait for polls to load
      await expect(page.getByText("Poll question 1?")).toBeVisible({
        timeout: 5000,
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Poll loading should be under 2 seconds
      expect(loadTime).toBeLessThan(2000);

      // Verify all polls are rendered
      const pollElements = page.locator('[data-testid="poll-item"]');
      await expect(pollElements).toHaveCount(50);
    });

    test("poll rendering performance with complex options", async ({
      page,
    }) => {
      // Mock polls with many options
      await page.addInitScript(() => {
        const complexPolls = Array.from({ length: 10 }, (_, i) => ({
          id: `poll${i}`,
          question: `Complex poll ${i} with many options?`,
          type: "multiple_choice",
          options: Array.from(
            { length: 20 },
            (_, j) => `Option ${j + 1} for poll ${i}`
          ),
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "admin123",
        }));

        (window as any).mockPolls = complexPolls;

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

      // Measure rendering time
      const startTime = Date.now();

      await expect(
        page.getByText("Complex poll 0 with many options?")
      ).toBeVisible();

      // Wait for all options to render
      await expect(page.getByText("Option 20 for poll 0")).toBeVisible();

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Complex rendering should be under 1 second
      expect(renderTime).toBeLessThan(1000);
    });

    test("real-time poll updates performance", async ({ page }) => {
      let updateCount = 0;

      await page.addInitScript(() => {
        (window as any).mockPolls = [];

        // Mock real-time listener
        (window as any).pollListener = {
          onSnapshot: (callback: any) => {
            // Simulate rapid updates
            const interval = setInterval(() => {
              (window as any).updateCount =
                ((window as any).updateCount || 0) + 1;

              const newPoll = {
                id: `poll${(window as any).updateCount}`,
                question: `Real-time poll ${(window as any).updateCount}?`,
                type: "yes_no",
                options: ["Yes", "No"],
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: "admin123",
              };

              (window as any).mockPolls.push(newPoll);

              callback({
                docs: (window as any).mockPolls.map((poll: any) => ({
                  id: poll.id,
                  data: () => poll,
                })),
              });

              if ((window as any).updateCount >= 10) {
                clearInterval(interval);
              }
            }, 100);

            return () => clearInterval(interval);
          },
        };

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

      // Wait for real-time updates to complete
      await expect(page.getByText("Real-time poll 10?")).toBeVisible({
        timeout: 2000,
      });

      // Check that UI remained responsive during updates
      const finalUpdateCount = await page.evaluate(
        () => (window as any).updateCount
      );
      expect(finalUpdateCount).toBe(10);

      // Verify all polls are visible
      const pollElements = page.locator('[data-testid="poll-item"]');
      await expect(pollElements).toHaveCount(10);
    });

    test("poll vote submission performance", async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).mockPolls = [
          {
            id: "poll1",
            question: "Performance test poll?",
            type: "yes_no",
            options: ["Yes", "No"],
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: "admin123",
          },
        ];

        // Mock vote submission with timing
        (window as any).pollService = {
          submitVote: () => {
            const startTime = performance.now();

            return new Promise((resolve) => {
              setTimeout(() => {
                const endTime = performance.now();
                console.log(`Vote submission time: ${endTime - startTime}ms`);
                resolve(undefined);
              }, 200); // Simulate network delay
            });
          },
          hasPlayerVoted: () => Promise.resolve(false),
        };

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

      await expect(page.getByText("Performance test poll?")).toBeVisible();

      // Measure vote submission time
      const startTime = Date.now();

      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Confirm Vote" }).click();

      // Wait for success message
      await expect(
        page.getByText("Vote submitted successfully!")
      ).toBeVisible();

      const endTime = Date.now();
      const submissionTime = endTime - startTime;

      // Vote submission should be under 1 second
      expect(submissionTime).toBeLessThan(1000);
    });

    test("concurrent poll operations performance", async ({
      page,
      context,
    }) => {
      // Setup multiple tabs with same polls
      await page.addInitScript(() => {
        (window as any).mockPolls = Array.from({ length: 5 }, (_, i) => ({
          id: `poll${i}`,
          question: `Concurrent poll ${i}?`,
          type: "yes_no",
          options: ["Yes", "No"],
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "admin123",
        }));

        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
          })
        );
      });

      // Open multiple tabs
      const tabs = [page];
      for (let i = 1; i < 3; i++) {
        const newTab = await context.newPage();
        await newTab.addInitScript(() => {
          localStorage.setItem(
            "playerAuth",
            JSON.stringify({
              id: `player${Math.random()}`,
              name: `TestPlayer${Math.random()}`,
              authType: "player",
            })
          );
        });
        tabs.push(newTab);
      }

      // Navigate all tabs to vote page simultaneously
      const startTime = Date.now();

      await Promise.all(
        tabs.map(async (tab) => {
          await tab.goto("/tournament");
          await tab.getByRole("tab", { name: /vote/i }).click();
          await expect(tab.getByText("Concurrent poll 0?")).toBeVisible();
        })
      );

      const endTime = Date.now();
      const concurrentLoadTime = endTime - startTime;

      // Concurrent loading should not significantly impact performance
      expect(concurrentLoadTime).toBeLessThan(3000);

      // Clean up
      for (let i = 1; i < tabs.length; i++) {
        await tabs[i].close();
      }
    });
  });

  test.describe("Admin Dashboard Performance", () => {
    test("admin poll management loading with large dataset", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        // Mock large poll dataset
        const generatePolls = (count: number) => {
          return Array.from({ length: count }, (_, i) => ({
            id: `poll${i}`,
            question: `Admin poll ${i}?`,
            type: ["yes_no", "yes_no_maybe", "multiple_choice"][i % 3],
            isActive: i % 2 === 0,
            createdAt: new Date(Date.now() - i * 3600000).toISOString(),
            createdBy: "admin123",
            voteCount: Math.floor(Math.random() * 100),
          }));
        };

        (window as any).mockAdminPolls = generatePolls(200);

        // Mock admin auth
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

      // Measure admin dashboard load time
      const startTime = Date.now();

      await page.getByRole("tab", { name: /poll management/i }).click();

      // Wait for poll list to load
      await expect(page.getByText("Admin poll 0?")).toBeVisible({
        timeout: 5000,
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Admin dashboard should load within 3 seconds even with large dataset
      expect(loadTime).toBeLessThan(3000);

      // Test pagination performance
      const nextPageButton = page.getByRole("button", { name: /next page/i });
      if (await nextPageButton.isVisible()) {
        const paginationStart = Date.now();
        await nextPageButton.click();
        await expect(page.getByText("Admin poll 50?")).toBeVisible(); // Assuming 50 per page
        const paginationEnd = Date.now();

        expect(paginationEnd - paginationStart).toBeLessThan(500);
      }
    });

    test("poll results aggregation performance", async ({ page }) => {
      await page.addInitScript(() => {
        // Mock poll with many votes
        (window as any).mockPollResults = {
          poll: {
            id: "poll1",
            question: "Performance test poll?",
            type: "multiple_choice",
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D",
              "Option E",
            ],
          },
          votes: Array.from({ length: 1000 }, (_, i) => ({
            id: `vote${i}`,
            playerId: `player${i}`,
            playerName: `Player${i}`,
            vote: ["Option A", "Option B", "Option C", "Option D", "Option E"][
              i % 5
            ],
            votedAt: new Date(Date.now() - i * 60000).toISOString(),
          })),
        };

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

      // Click view results for a poll
      const startTime = Date.now();

      await page
        .getByRole("button", { name: /view results/i })
        .first()
        .click();

      // Wait for results to load and aggregate
      await expect(page.getByText("Poll Results")).toBeVisible();
      await expect(page.getByText("Option A: 200 votes")).toBeVisible();

      const endTime = Date.now();
      const aggregationTime = endTime - startTime;

      // Results aggregation should be fast even with 1000 votes
      expect(aggregationTime).toBeLessThan(1000);
    });
  });
});
