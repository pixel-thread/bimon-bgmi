// app/login/page.tsx
"use client";

import React, { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import {
  IconBrandGoogle,
  IconLock,
  IconArrowLeft,
  IconUsers,
  IconUser,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { auth, db } from "@/src/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  UserCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SUPER_ADMIN_EMAIL } from "@/src/config/adminAccess";
import { NameAutocomplete } from "@/src/components/ui/name-autocomplete";
import { Player } from "@/src/lib/types";
import {
  ErrorHandler,
  AppError,
  ErrorCategory,
  ErrorSeverity,
  createAuthError,
  createValidationError,
  handleAsync,
} from "@/src/lib/errorHandling";
import { useLoadingState, LoadingOperation } from "@/src/lib/loadingStates";
import {
  useFormValidation,
  LoginValidationSchemas,
  validateEmail,
} from "@/src/lib/validation";
import { LoginRedirectService } from "@/src/lib/loginRedirectService";

function LoginContent() {
  const authState = useAuth();
  const { isAuthorized, loading, loginAsPlayer, loginAsPlayerWithSocial } =
    authState;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect parameter from URL (don't calculate default redirect early)
  const redirectTo = searchParams?.get("redirect");

  // Loading state management
  const loadingState = useLoadingState();

  // Authentication method selection
  const [authMethod, setAuthMethod] = useState<"admin" | "player">("player");

  // Admin authentication states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminStep, setAdminStep] = useState<"login" | "signup" | "reset">(
    "login"
  );
  const [isNewUser, setIsNewUser] = useState(false);

  // Player authentication states
  const [playerName, setPlayerName] = useState("");
  const [playerPassword, setPlayerPassword] = useState("");
  const [showPlayerPassword, setShowPlayerPassword] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Form validation
  const adminValidation = useFormValidation(
    adminStep === "reset"
      ? LoginValidationSchemas.passwordReset
      : LoginValidationSchemas.adminLogin
  );
  const playerValidation = useFormValidation(
    LoginValidationSchemas.playerLogin
  );

  useEffect(() => {
    if (!loading && isAuthorized) {
      // Check if we just came from a logout (prevent immediate redirect)
      const justLoggedOut = sessionStorage.getItem("just_logged_out");
      if (justLoggedOut) {
        sessionStorage.removeItem("just_logged_out");
        return;
      }

      // Simple delay to ensure auth state is stable, then redirect
      const timeoutId = setTimeout(async () => {
        const destination =
          redirectTo || (await LoginRedirectService.getRedirectPath(authState));

        console.log("🔄 Login Page - Redirecting user:", {
          isAuthorized,
          authType: authState.authType,
          role: authState.role,
          hasPlayerUser: !!authState.playerUser,
          redirectTo,
          destination,
          currentPath: window.location.pathname,
        });

        // Force page reload to ensure fresh state
        window.location.href = destination;
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthorized, loading, redirectTo, authState]);

  // Player Social Authentication
  const handlePlayerSocialAuth = async (
    providerId: string,
    useRedirect: boolean = false
  ) => {
    const operationId = "player-social-auth";

    try {
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
        await import("firebase/auth");

      let provider;
      switch (providerId) {
        case "google.com":
          provider = new GoogleAuthProvider();
          break;
        default:
          throw new Error("Unsupported social provider");
      }
      provider.setCustomParameters({
        prompt: "select_account",
      });

      loadingState.startLoading(
        LoadingOperation.GOOGLE_SIGNIN,
        undefined,
        operationId
      );

      let result;
      if (useRedirect) {
        await signInWithRedirect(auth, provider);
        return; // Redirect will handle the rest
      } else {
        try {
          result = await signInWithPopup(auth, provider);
        } catch (popupError: any) {
          // If popup is blocked, fall back to redirect
          if (popupError?.code === "auth/popup-blocked") {
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupError;
        }
      }

      if (result?.user) {
        const user = result.user;
        const providerData = user.providerData.find(
          (p) => p.providerId === providerId
        );

        if (!providerData) {
          throw new Error("No provider data found");
        }

        // Try to authenticate the player using social provider
        try {
          await loginAsPlayerWithSocial(
            providerId,
            providerData.uid,
            providerData.email || undefined
          );

          const providerName =
            providerId.replace(".com", "").charAt(0).toUpperCase() +
            providerId.replace(".com", "").slice(1);
          ErrorHandler.showSuccess(
            `Successfully logged in with ${providerName}!`
          );
        } catch (error: any) {
          // If no player found, we can either:
          // 1. Show an error asking them to link their account first
          // 2. Create a new player account (if we want to allow that)
          // For now, let's show an informative error

          if (
            error.message?.includes("No player found with this social account")
          ) {
            // Sign out from Firebase since no player account exists
            await auth.signOut();

            const appError = new AppError(
              "No player account linked",
              ErrorCategory.AUTHENTICATION,
              ErrorSeverity.MEDIUM,
              "No player account is linked to this social account. Please contact an admin to link your social account to your player profile, or use traditional login.",
              error,
              { providerId, email: providerData.email },
              false
            );
            ErrorHandler.showError(appError);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      const providerName =
        providerId.replace(".com", "").charAt(0).toUpperCase() +
        providerId.replace(".com", "").slice(1);
      const appError = ErrorHandler.handle(error, {
        operation: "player_social_auth",
        provider: providerId,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // The onAuthStateChanged will handle the rest
        }
      } catch (error) {
        ErrorHandler.showError(
          createAuthError(
            "Sign-in failed after redirect. Please try again.",
            error instanceof Error ? error : undefined
          )
        );
      }
    };

    handleRedirectResult();
  }, []);

  // Admin Social Sign-In with Redirect Fallback
  const handleSocialAuth = async (
    providerId: string,
    useRedirect: boolean = false
  ) => {
    const operationId = "social-auth";

    try {
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
        await import("firebase/auth");

      let provider;
      switch (providerId) {
        case "google.com":
          provider = new GoogleAuthProvider();
          break;
        default:
          throw new Error("Unsupported social provider");
      }
      provider.setCustomParameters({
        prompt: "select_account",
      });

      loadingState.startLoading(
        LoadingOperation.GOOGLE_SIGNIN,
        undefined,
        operationId
      );

      let result;
      if (useRedirect) {
        await signInWithRedirect(auth, provider);
        return; // Redirect will handle the rest
      } else {
        try {
          result = await signInWithPopup(auth, provider);
        } catch (popupError: any) {
          // If popup is blocked, fall back to redirect
          if (popupError?.code === "auth/popup-blocked") {
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupError;
        }
      }

      if (result?.user) {
        // Check if user is authorized
        const emailDoc = await getDoc(
          doc(db, "authorized_emails", result.user.email!)
        );

        if (emailDoc.exists()) {
          const providerName =
            providerId.replace(".com", "").charAt(0).toUpperCase() +
            providerId.replace(".com", "").slice(1);
          ErrorHandler.showSuccess(
            `Successfully logged in with ${providerName}!`
          );
        } else {
          // User not authorized, sign them out
          await auth.signOut();
          const appError = new AppError(
            "Unauthorized email access",
            ErrorCategory.PERMISSION,
            ErrorSeverity.HIGH,
            "This email is not authorized to access the admin panel.",
            new Error("Email not in authorized_emails collection")
          );
          ErrorHandler.showError(appError);
        }
      }
    } catch (error) {
      const providerName =
        providerId.replace(".com", "").charAt(0).toUpperCase() +
        providerId.replace(".com", "").slice(1);
      const appError = ErrorHandler.handle(error, {
        operation: "social_auth",
        provider: providerId,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  // Admin Google Sign-In
  const handleGoogleSignIn = async () => {
    const operationId = "google-signin";

    try {
      loadingState.startLoading(
        LoadingOperation.GOOGLE_SIGNIN,
        undefined,
        operationId
      );
      adminValidation.clearErrors();

      // Configure Google Auth Provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      provider.addScope("email");
      provider.addScope("profile");

      // Try to detect if popup is blocked
      let popup: Window | null = null;
      try {
        popup = window.open("", "_blank", "width=500,height=600");
        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          throw new Error("Popup blocked");
        }
        popup.close();
      } catch (popupError) {
        ErrorHandler.showError(
          createAuthError(
            "Popup was blocked by your browser. Please allow popups for this site and try again.",
            popupError instanceof Error ? popupError : undefined
          )
        );
        return;
      }

      // Add timeout to prevent infinite loading
      const signInPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Sign-in timeout")), 60000);
      });

      const [result, signInError] = await handleAsync<UserCredential>(
        Promise.race([
          signInPromise,
          timeoutPromise,
        ]) as Promise<UserCredential>,
        { operation: "google_signin" }
      );

      if (signInError) {
        if (
          signInError.message.includes("popup") ||
          signInError.message.includes("blocked")
        ) {
          ErrorHandler.showError(
            createAuthError(
              "Popup was blocked. Please allow popups for this site and try again.",
              signInError.originalError instanceof Error
                ? signInError.originalError
                : undefined
            )
          );
        } else if (signInError.message.includes("timeout")) {
          ErrorHandler.showError(
            createAuthError(
              "Sign-in timed out. Please try again.",
              signInError.originalError instanceof Error
                ? signInError.originalError
                : undefined
            )
          );
        } else {
          ErrorHandler.showError(signInError);
        }
        return;
      }

      const userEmail = result?.user?.email;
      if (!userEmail) {
        ErrorHandler.showError(
          createAuthError("No email found in Google account")
        );
        return;
      }

      // Auto-add super admin if it's the super admin email
      if (userEmail === SUPER_ADMIN_EMAIL) {
        const [, setDocError] = await handleAsync(
          setDoc(doc(db, "authorized_emails", userEmail), {
            authorized: true,
            role: "super_admin",
            addedAt: new Date().toISOString(),
          }),
          { operation: "auto_add_super_admin", email: userEmail }
        );

        if (setDocError) {
          console.warn("Failed to auto-add super admin:", setDocError);
        }
      }

      // Check if email is authorized with retry logic
      let emailSnap, emailError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        [emailSnap, emailError] = await handleAsync(
          getDoc(doc(db, "authorized_emails", userEmail)),
          {
            operation: "check_email_authorization",
            email: userEmail,
            retry: retryCount,
          }
        );

        if (!emailError || !emailError.message.includes("blocked")) {
          break;
        }

        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (emailError) {
        ErrorHandler.showError(emailError);
        await auth.signOut();
        return;
      }

      // Special handling for super admin if Firestore is blocked
      if (!emailSnap?.exists() && userEmail === SUPER_ADMIN_EMAIL) {
        ErrorHandler.showSuccess("Successfully signed in as Super Admin!");
        return;
      }

      if (!emailSnap?.exists()) {
        await auth.signOut();
        ErrorHandler.showError(
          createAuthError(
            `This email (${userEmail}) is not authorized to access the admin panel.`,
            new Error("Email not in authorized_emails collection")
          )
        );
        return;
      }

      ErrorHandler.showSuccess("Successfully signed in with Google!");

      // Let the main useEffect handle the redirect when auth state is ready
      // Don't redirect immediately as authState might not be updated yet
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "google_signin",
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  // Admin Email/Password Submit
  const handleAdminEmailSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const operationId = "admin-email-login";
    const formData = { email, password };

    // Validate form
    const validation = adminValidation.validateForm(formData);
    if (!validation.isValid) {
      ErrorHandler.showError(
        createValidationError(
          validation.firstError || "Please check your input"
        )
      );
      return;
    }

    try {
      loadingState.startLoading(LoadingOperation.LOGIN, undefined, operationId);

      // Check if email is authorized first
      const [emailSnap, emailError] = await handleAsync(
        getDoc(doc(db, "authorized_emails", email)),
        { operation: "check_email_authorization", email }
      );

      if (emailError) {
        ErrorHandler.showError(emailError);
        return;
      }

      if (!emailSnap?.exists()) {
        const error = createAuthError(
          "This email is not authorized to access the admin panel.",
          new Error("Email not in authorized_emails collection")
        );
        ErrorHandler.showError(error);
        return;
      }

      // Perform authentication
      if (adminStep === "signup") {
        const [, signupError] = await handleAsync(
          createUserWithEmailAndPassword(auth, email, password),
          { operation: "create_user", email }
        );

        if (signupError) {
          // Handle specific signup errors
          if (signupError.message.includes("email-already-in-use")) {
            ErrorHandler.showError(
              createAuthError(
                "Account already exists. Please sign in instead.",
                signupError.originalError instanceof Error
                  ? signupError.originalError
                  : undefined
              )
            );
            setAdminStep("login");
          } else {
            ErrorHandler.showError(signupError);
          }
          return;
        }

        ErrorHandler.showSuccess("Account created successfully!");

        // Let the main useEffect handle the redirect when auth state is ready
      } else {
        const [, signinError] = await handleAsync(
          signInWithEmailAndPassword(auth, email, password),
          { operation: "sign_in", email }
        );

        if (signinError) {
          // Handle specific signin errors
          if (signinError.message.includes("user-not-found")) {
            ErrorHandler.showError(
              createAuthError(
                "No account found with this email. Would you like to create one?",
                signinError.originalError instanceof Error
                  ? signinError.originalError
                  : undefined
              )
            );
            setIsNewUser(true);
          } else {
            ErrorHandler.showError(signinError);
          }
          return;
        }

        ErrorHandler.showSuccess("Signed in successfully!");

        // Let the main useEffect handle the redirect when auth state is ready
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "admin_email_auth",
        email,
        step: adminStep,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  // Admin Password Reset
  const handlePasswordReset = async () => {
    const operationId = "password-reset";

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      ErrorHandler.showError(createValidationError(emailError, "email"));
      return;
    }

    try {
      loadingState.startLoading(
        LoadingOperation.SEND_PASSWORD_RESET,
        undefined,
        operationId
      );

      const [, resetError] = await handleAsync(
        sendPasswordResetEmail(auth, email),
        { operation: "send_password_reset", email }
      );

      if (resetError) {
        ErrorHandler.showError(resetError);
        return;
      }

      ErrorHandler.showSuccess("Password reset email sent! Check your inbox.");
      setAdminStep("login");
      adminValidation.clearErrors();
    } catch (error) {
      const appError = ErrorHandler.handle(error, {
        operation: "password_reset",
        email,
      });
      ErrorHandler.showError(appError);
    } finally {
      loadingState.stopLoading(operationId);
    }
  };

  // Player Login Submit
  const handlePlayerLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!selectedPlayer) {
      const error = createValidationError(
        "Please select your name from the suggestions",
        "playerName"
      );
      ErrorHandler.showError(error);
      return;
    }

    const formData = {
      playerName: selectedPlayer.name,
      password: playerPassword,
    };

    const validation = playerValidation.validateForm(formData);
    if (!validation.isValid) {
      ErrorHandler.showError(
        createValidationError(
          validation.firstError || "Please check your input"
        )
      );
      return;
    }

    try {
      await loginAsPlayer(selectedPlayer.name, playerPassword);

      // Force a refresh of auth state to ensure we have the latest data
      // This is especially important for linkedRole updates
      setTimeout(async () => {
        try {
          await authState.refreshAuthState();
        } catch (error) {
          console.error("Error refreshing auth state after login:", error);
        }
      }, 100);

      // Don't redirect immediately - let the useEffect handle it
      // when the auth state is properly updated
    } catch (error) {
      // Error handling is done in loginAsPlayer method
      console.error("Player login error:", error);
    }
  };

  // Clear errors when switching auth methods
  const handleAuthMethodChange = (method: "admin" | "player") => {
    setAuthMethod(method);
    adminValidation.clearErrors();
    playerValidation.clearErrors();
    ErrorHandler.clearAllRetryAttempts();
  };

  // Real-time validation handlers
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    adminValidation.validateField("email", value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    adminValidation.validateField("password", value);
  };

  const handlePlayerPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setPlayerPassword(value);
    playerValidation.validateField("password", value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="shadow-2xl mx-auto w-full max-w-md rounded-2xl bg-white p-8 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Tournament Access
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Choose your login method
          </p>
        </div>

        {/* Auth Method Selection */}
        <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleAuthMethodChange("admin")}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              authMethod === "admin"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <IconLock className="h-4 w-4" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleAuthMethodChange("player")}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              authMethod === "player"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <IconUsers className="h-4 w-4" />
            <span>Player</span>
          </button>
        </div>

        {/* Admin Authentication */}
        {authMethod === "admin" && (
          <>
            {adminStep === "reset" ? (
              // Password Reset Form
              <div className="space-y-6">
                <LabelInputContainer>
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    placeholder="your-email@gmail.com"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={cn(
                      "h-11",
                      adminValidation.errors.email &&
                        "border-red-500 focus:border-red-500"
                    )}
                    disabled={loadingState.isLoading("password-reset")}
                  />
                  {adminValidation.errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {adminValidation.errors.email}
                    </p>
                  )}
                </LabelInputContainer>

                <button
                  onClick={handlePasswordReset}
                  disabled={
                    loadingState.isLoading("password-reset") ||
                    !!adminValidation.errors.email
                  }
                  className="group/btn relative block h-11 w-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loadingState.isLoading("password-reset") ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <IconLock className="h-4 w-4" />
                    )}
                    <span>
                      {loadingState.isLoading("password-reset")
                        ? "Sending..."
                        : "Send Reset Email"}
                    </span>
                  </div>
                  <BottomGradient />
                </button>

                <button
                  onClick={() => {
                    setAdminStep("login");
                    adminValidation.clearErrors();
                  }}
                  className="flex items-center justify-center space-x-2 w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  <span>Back to sign in</span>
                </button>
              </div>
            ) : (
              // Login/Signup Form
              <form className="space-y-6" onSubmit={handleAdminEmailSubmit}>
                <LabelInputContainer>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder="your-email@gmail.com"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={cn(
                      "h-11",
                      adminValidation.errors.email &&
                        "border-red-500 focus:border-red-500"
                    )}
                    disabled={loadingState.isLoading("admin-email-login")}
                  />
                  {adminValidation.errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {adminValidation.errors.email}
                    </p>
                  )}
                </LabelInputContainer>

                <LabelInputContainer>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      className={cn(
                        "h-11 px-4 pr-10 w-full text-base",
                        adminValidation.errors.password &&
                          "border-red-500 focus:border-red-500"
                      )}
                      disabled={loadingState.isLoading("admin-email-login")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <IconEyeOff className="h-5 w-5" />
                      ) : (
                        <IconEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {adminValidation.errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {adminValidation.errors.password}
                    </p>
                  )}
                </LabelInputContainer>

                <button
                  className="group/btn relative block h-11 w-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  type="submit"
                  disabled={
                    loadingState.isLoading("admin-email-login") ||
                    adminValidation.hasErrors ||
                    !email.trim() ||
                    !password.trim()
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loadingState.isLoading("admin-email-login") ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <IconLock className="h-4 w-4" />
                    )}
                    <span>
                      {loadingState.isLoading("admin-email-login")
                        ? "Signing in..."
                        : adminStep === "signup"
                        ? "Create Account"
                        : "Sign In"}
                    </span>
                  </div>
                  <BottomGradient />
                </button>

                {/* Toggle between login/signup */}
                <div className="text-center space-y-2">
                  {isNewUser && adminStep === "login" && (
                    <button
                      type="button"
                      onClick={() => setAdminStep("signup")}
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Create new account instead
                    </button>
                  )}

                  {adminStep === "signup" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminStep("login");
                        setIsNewUser(false);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Already have an account? Sign in
                    </button>
                  )}

                  {adminStep === "login" && (
                    <button
                      type="button"
                      onClick={() => setAdminStep("reset")}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    className="group/btn shadow-lg relative flex h-11 w-full items-center justify-center space-x-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                    type="button"
                    onClick={() => handleSocialAuth("google.com")}
                    disabled={loadingState.isLoading("social-auth")}
                  >
                    {loadingState.isLoading("social-auth") ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
                    ) : (
                      <IconBrandGoogle className="h-5 w-5 text-red-500" />
                    )}
                    <span>Google</span>
                    <BottomGradient />
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Player Authentication */}
        {authMethod === "player" && (
          <form className="space-y-6" onSubmit={handlePlayerLogin} role="form">
            <NameAutocomplete
              value={playerName}
              onValueChange={setPlayerName}
              onPlayerSelect={setSelectedPlayer}
              placeholder="Start typing your name..."
              disabled={loadingState.isLoading("player-login")}
              error={playerValidation.errors.playerName}
            />

            <LabelInputContainer>
              <Label htmlFor="player-password">Password</Label>
              <div className="relative">
                <Input
                  id="player-password"
                  placeholder="Enter your assigned password"
                  type={showPlayerPassword ? "text" : "password"}
                  value={playerPassword}
                  onChange={handlePlayerPasswordChange}
                  disabled={
                    !selectedPlayer || loadingState.isLoading("player-login")
                  }
                  className={cn(
                    "h-11 px-4 pr-10 w-full text-base",
                    !selectedPlayer && "bg-slate-50 dark:bg-slate-800",
                    playerValidation.errors.password &&
                      "border-red-500 focus:border-red-500"
                  )}
                />
                {selectedPlayer && (
                  <button
                    type="button"
                    onClick={() => setShowPlayerPassword(!showPlayerPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    disabled={!selectedPlayer}
                    tabIndex={-1}
                  >
                    {showPlayerPassword ? (
                      <IconEyeOff className="h-5 w-5" />
                    ) : (
                      <IconEye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              {!selectedPlayer ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select your name first to enable password entry
                </p>
              ) : playerValidation.errors.password ? (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {playerValidation.errors.password}
                </p>
              ) : null}
            </LabelInputContainer>

            <button
              className="group/btn relative block h-11 w-full rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              type="submit"
              disabled={
                !selectedPlayer ||
                !playerPassword.trim() ||
                loadingState.isLoading("player-login") ||
                playerValidation.hasErrors
              }
            >
              <div className="flex items-center justify-center space-x-2">
                {loadingState.isLoading("player-login") ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <IconUser className="h-4 w-4" />
                )}
                <span>
                  {loadingState.isLoading("player-login")
                    ? "Signing in..."
                    : "Sign In as Player"}
                </span>
              </div>
              <BottomGradient />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                className="group/btn shadow-lg relative flex h-11 w-full items-center justify-center space-x-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                type="button"
                onClick={() => handlePlayerSocialAuth("google.com")}
                disabled={loadingState.isLoading("player-social-auth")}
              >
                {loadingState.isLoading("player-social-auth") ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
                ) : (
                  <IconBrandGoogle className="h-5 w-5 text-red-500" />
                )}
                <span>Google</span>
                <BottomGradient />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
