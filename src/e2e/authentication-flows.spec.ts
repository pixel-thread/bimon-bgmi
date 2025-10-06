import { test, expect } from "@playwright/test";

test.describe("Authentication Flow Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("Firebase Admin Authentication", () => {
    test("successful email/password login", async ({ page }) => {
      // Mock Firebase Auth
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            signInWithEmailAndPassword: () =>
              Promise.resolve({
                user: {
                  uid: "admin123",
                  email: "admin@test.com",
                  displayName: "Admin User",
                },
              }),
            onAuthStateChanged: (callback: any) => {
              callback({
                uid: "admin123",
                email: "admin@test.com",
                displayName: "Admin User",
              });
              return () => {};
            },
          }),
        };

        // Mock authorized admin check
        (window as any).firestore = {
          collection: () => ({
            doc: () => ({
              get: () =>
                Promise.resolve({
                  exists: true,
                  data: () => ({ role: "super_admin" }),
                }),
            }),
          }),
        };
      });

      await page.goto("/login");

      // Verify admin login form is default
      await expect(page.getByLabelText("Email Address")).toBeVisible();
      await expect(page.getByLabelText("Password")).toBeVisible();

      // Fill in admin credentials
      await page.getByLabelText("Email Address").fill("admin@test.com");
      await page.getByLabelText("Password").fill("adminpassword");

      // Submit login
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should redirect to admin dashboard
      await expect(page).toHaveURL("/admin");
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("successful Google sign-in", async ({ page }) => {
      // Mock Google Auth
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            signInWithPopup: () =>
              Promise.resolve({
                user: {
                  uid: "admin123",
                  email: "admin@test.com",
                  displayName: "Admin User",
                },
              }),
            onAuthStateChanged: (callback: any) => {
              callback({
                uid: "admin123",
                email: "admin@test.com",
                displayName: "Admin User",
              });
              return () => {};
            },
          }),
        };

        (window as any).firestore = {
          collection: () => ({
            doc: () => ({
              get: () =>
                Promise.resolve({
                  exists: true,
                  data: () => ({ role: "super_admin" }),
                }),
            }),
          }),
        };
      });

      await page.goto("/login");

      // Click Google sign-in
      await page.getByRole("button", { name: /sign in with google/i }).click();

      // Should redirect to admin dashboard
      await expect(page).toHaveURL("/admin");
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("unauthorized email login attempt", async ({ page }) => {
      // Mock Firebase Auth with unauthorized email
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            signInWithEmailAndPassword: () =>
              Promise.resolve({
                user: {
                  uid: "user123",
                  email: "unauthorized@test.com",
                  displayName: "Unauthorized User",
                },
              }),
            signOut: () => Promise.resolve(),
            onAuthStateChanged: (callback: any) => {
              callback(null);
              return () => {};
            },
          }),
        };

        // Mock unauthorized check
        (window as any).firestore = {
          collection: () => ({
            doc: () => ({
              get: () => Promise.resolve({ exists: false }),
            }),
          }),
        };
      });

      await page.goto("/login");

      await page.getByLabelText("Email Address").fill("unauthorized@test.com");
      await page.getByLabelText("Password").fill("password");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should show unauthorized message and redirect back to login
      await expect(
        page.getByText(
          "Access denied. You are not authorized to use this application."
        )
      ).toBeVisible();
      await expect(page).toHaveURL("/login");
    });

    test("invalid credentials error", async ({ page }) => {
      // Mock Firebase Auth error
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            signInWithEmailAndPassword: () =>
              Promise.reject({
                code: "auth/invalid-credential",
                message: "Invalid credentials",
              }),
            onAuthStateChanged: () => () => {},
          }),
        };
      });

      await page.goto("/login");

      await page.getByLabelText("Email Address").fill("admin@test.com");
      await page.getByLabelText("Password").fill("wrongpassword");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should show error message
      await expect(
        page.getByText(
          "Invalid credentials. Please check your email and password."
        )
      ).toBeVisible();
    });

    test("password reset flow", async ({ page }) => {
      // Mock Firebase password reset
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            sendPasswordResetEmail: () => Promise.resolve(),
            onAuthStateChanged: () => () => {},
          }),
        };
      });

      await page.goto("/login");

      // Click forgot password
      await page.getByText("Forgot password?").click();

      // Verify reset form
      await expect(page.getByText("Reset Password")).toBeVisible();
      await expect(page.getByLabelText("Email Address")).toBeVisible();

      // Enter email and submit
      await page.getByLabelText("Email Address").fill("admin@test.com");
      await page.getByRole("button", { name: /send reset email/i }).click();

      // Verify success message
      await expect(
        page.getByText("Password reset email sent! Check your inbox.")
      ).toBeVisible();

      // Return to login
      await page.getByText("Back to sign in").click();
      await expect(page.getByText("Sign In")).toBeVisible();
    });
  });

  test.describe("Player Authentication", () => {
    test("successful player login", async ({ page }) => {
      // Mock player auth service
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: (query: string) =>
            Promise.resolve([
              { id: "player1", name: "TestPlayer", category: "Pro" },
            ]),
          validatePlayerCredentials: (name: string, password: string) => {
            if (name === "TestPlayer" && password === "testpass") {
              return Promise.resolve({
                id: "player1",
                name: "TestPlayer",
                category: "Pro",
                isLoginEnabled: true,
              });
            }
            return Promise.resolve(null);
          },
        };
      });

      await page.goto("/login");

      // Switch to player login
      await page.getByRole("button", { name: /player/i }).click();

      // Verify player login form
      await expect(page.getByLabelText("Player Name")).toBeVisible();
      await expect(page.getByLabelText("Password")).toBeDisabled();

      // Type player name to trigger autocomplete
      const nameInput = page.getByLabelText("Player Name");
      await nameInput.fill("Test");

      // Wait for suggestions and click on player
      await page.waitForTimeout(500);
      await page.getByText("TestPlayer").click();

      // Verify password field is enabled
      await expect(page.getByLabelText("Password")).toBeEnabled();

      // Enter password and submit
      await page.getByLabelText("Password").fill("testpass");
      await page.getByRole("button", { name: /sign in as player/i }).click();

      // Should redirect to tournament page
      await expect(page).toHaveURL("/tournament");
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();
    });

    test("player name autocomplete functionality", async ({ page }) => {
      // Mock player suggestions
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: (query: string) => {
            const players = [
              { id: "player1", name: "TestPlayer1", category: "Pro" },
              { id: "player2", name: "TestPlayer2", category: "Noob" },
              { id: "player3", name: "AnotherPlayer", category: "Ultra Pro" },
            ];
            return Promise.resolve(
              players.filter((p) =>
                p.name.toLowerCase().includes(query.toLowerCase())
              )
            );
          },
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");

      // Test filtering
      await nameInput.fill("Test");
      await page.waitForTimeout(500);

      // Should show filtered suggestions
      await expect(page.getByText("TestPlayer1")).toBeVisible();
      await expect(page.getByText("TestPlayer2")).toBeVisible();
      await expect(page.getByText("AnotherPlayer")).not.toBeVisible();

      // Test selection
      await page.getByText("TestPlayer1").click();

      // Verify selection
      await expect(nameInput).toHaveValue("TestPlayer1");
      await expect(page.getByLabelText("Password")).toBeEnabled();

      // Test clearing and retyping
      await nameInput.clear();
      await nameInput.fill("Another");
      await page.waitForTimeout(500);

      await expect(page.getByText("AnotherPlayer")).toBeVisible();
      await expect(page.getByText("TestPlayer1")).not.toBeVisible();
    });

    test("invalid player credentials", async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: () =>
            Promise.resolve([
              { id: "player1", name: "TestPlayer", category: "Pro" },
            ]),
          validatePlayerCredentials: () => Promise.resolve(null),
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      // Select player and enter wrong password
      const nameInput = page.getByLabelText("Player Name");
      await nameInput.fill("Test");
      await page.waitForTimeout(500);
      await page.getByText("TestPlayer").click();

      await page.getByLabelText("Password").fill("wrongpassword");
      await page.getByRole("button", { name: /sign in as player/i }).click();

      // Should show error
      await expect(
        page.getByText(
          "Invalid credentials. Please check your name and password."
        )
      ).toBeVisible();
      await expect(page).toHaveURL("/login");
    });

    test("disabled player account", async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).playerAuthService = {
          getPlayerSuggestions: () =>
            Promise.resolve([
              { id: "player1", name: "DisabledPlayer", category: "Pro" },
            ]),
          validatePlayerCredentials: () =>
            Promise.resolve({
              id: "player1",
              name: "DisabledPlayer",
              isLoginEnabled: false,
            }),
        };
      });

      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      const nameInput = page.getByLabelText("Player Name");
      await nameInput.fill("Disabled");
      await page.waitForTimeout(500);
      await page.getByText("DisabledPlayer").click();

      await page.getByLabelText("Password").fill("password");
      await page.getByRole("button", { name: /sign in as player/i }).click();

      // Should show disabled account message
      await expect(
        page.getByText(
          "Your account has been disabled. Please contact an administrator."
        )
      ).toBeVisible();
    });

    test("player name required validation", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /player/i }).click();

      // Try to submit without selecting a player
      await page.getByRole("button", { name: /sign in as player/i }).click();

      // Should show validation error
      await expect(
        page.getByText("Please select your name from the suggestions")
      ).toBeVisible();
    });
  });

  test.describe("Session Management", () => {
    test("session persistence across page reloads", async ({ page }) => {
      // Mock authenticated player session
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          })
        );
      });

      await page.goto("/tournament");

      // Should be authenticated
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();
    });

    test("session expiration handling", async ({ page }) => {
      // Mock expired session
      await page.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player1",
            name: "TestPlayer",
            authType: "player",
            expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          })
        );
      });

      await page.goto("/tournament");

      // Should redirect to login due to expired session
      await expect(page).toHaveURL("/login");
      await expect(
        page.getByText("Your session has expired. Please log in again.")
      ).toBeVisible();
    });

    test("logout functionality", async ({ page }) => {
      // Mock authenticated admin session
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            signOut: () => Promise.resolve(),
            onAuthStateChanged: (callback: any) => {
              callback({
                uid: "admin123",
                email: "admin@test.com",
              });
              return () => {};
            },
          }),
        };

        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            uid: "admin123",
            email: "admin@test.com",
            role: "super_admin",
          })
        );
      });

      await page.goto("/admin");

      // Verify authenticated
      await expect(page.getByText("Admin Dashboard")).toBeVisible();

      // Click logout
      await page.getByRole("button", { name: /logout/i }).click();

      // Should redirect to login
      await expect(page).toHaveURL("/login");
      await expect(
        page.getByText("You have been logged out successfully.")
      ).toBeVisible();
    });

    test("concurrent session handling", async ({ page, context }) => {
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

      await page.goto("/tournament");
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();

      // Open new tab and login as different user
      const newPage = await context.newPage();
      await newPage.addInitScript(() => {
        localStorage.setItem(
          "playerAuth",
          JSON.stringify({
            id: "player2",
            name: "AnotherPlayer",
            authType: "player",
          })
        );
      });

      await newPage.goto("/tournament");

      // Both sessions should work independently
      await expect(page.getByRole("tab", { name: /vote/i })).toBeVisible();
      await expect(newPage.getByRole("tab", { name: /vote/i })).toBeVisible();
    });
  });

  test.describe("Route Protection", () => {
    test("admin routes protected from unauthenticated users", async ({
      page,
    }) => {
      await page.goto("/admin");

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });

    test("admin routes protected from player users", async ({ page }) => {
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

      // Should redirect to tournament page or show access denied
      await expect(page).not.toHaveURL("/admin");
      await expect(page.getByText("Access denied")).toBeVisible();
    });

    test("vote tab hidden from unauthenticated users", async ({ page }) => {
      await page.goto("/tournament");

      // Vote tab should not be visible
      await expect(page.getByRole("tab", { name: /vote/i })).not.toBeVisible();

      // Other tabs should be visible
      await expect(page.getByRole("tab", { name: /positions/i })).toBeVisible();
    });

    test("automatic redirect after authentication", async ({ page }) => {
      // Try to access protected route
      await page.goto("/admin");
      await expect(page).toHaveURL("/login");

      // Mock successful admin login
      await page.addInitScript(() => {
        (window as any).firebase = {
          auth: () => ({
            signInWithEmailAndPassword: () =>
              Promise.resolve({
                user: { uid: "admin123", email: "admin@test.com" },
              }),
            onAuthStateChanged: (callback: any) => {
              callback({ uid: "admin123", email: "admin@test.com" });
              return () => {};
            },
          }),
        };

        (window as any).firestore = {
          collection: () => ({
            doc: () => ({
              get: () =>
                Promise.resolve({
                  exists: true,
                  data: () => ({ role: "super_admin" }),
                }),
            }),
          }),
        };
      });

      // Login
      await page.getByLabelText("Email Address").fill("admin@test.com");
      await page.getByLabelText("Password").fill("password");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should redirect to originally requested admin page
      await expect(page).toHaveURL("/admin");
    });
  });
});
