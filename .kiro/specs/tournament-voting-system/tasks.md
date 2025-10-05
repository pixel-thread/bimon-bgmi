# Implementation Plan

- [x] 1. Set up database schema and types for voting system

  - Extend Player interface in lib/types.ts to include authentication fields (loginPassword, isLoginEnabled, lastLoginAt)
  - Create Poll interface with question, type, options, isActive, createdAt, createdBy, expiresAt fields
  - Create PollVote interface with pollId, playerId, playerName, vote, votedAt fields
  - Create EnhancedAuthState interface extending current AuthState with playerUser, authType, isPlayer fields
  - _Requirements: 1.1, 2.1, 6.1_

- [x] 2. Create player authentication service

  - Implement PlayerAuthService class in lib/playerAuthService.ts
  - Write validatePlayerCredentials method to check name and password against players collection
  - Write getPlayerSuggestions method to return filtered player names for autocomplete
  - Write updatePlayerPassword, enablePlayerLogin, disablePlayerLogin methods for admin management
  - Create unit tests for all PlayerAuthService methods
  - _Requirements: 1.2, 1.3, 5.2, 5.3_

- [x] 3. Create poll management service

  - Implement PollService class in lib/pollService.ts
  - Write createPoll, updatePoll, deletePoll methods for poll CRUD operations
  - Write getActivePolls method to fetch current polls for voting interface
  - Write getPollResults method to aggregate vote counts for admin dashboard
  - Write submitVote and hasPlayerVoted methods for vote recording and duplicate prevention
  - Create unit tests for all PollService methods
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 3.4_

- [x] 4. Enhance useAuth hook for dual authentication

  - Extend useAuth hook in hooks/useAuth.ts to support both Firebase and player authentication
  - Add playerUser state and authType tracking to existing auth state
  - Implement loginAsPlayer method to authenticate players using PlayerAuthService
  - Add logout method that clears both Firebase and player sessions
  - Implement refreshAuthState method to restore authentication on page reload
  - Write unit tests for enhanced authentication state management
  - _Requirements: 2.4, 6.1, 6.2, 6.3_

- [x] 5. Create unified login page

  - Create app/login/page.tsx with multiple authentication options
  - Implement email/password form using existing Firebase authentication
  - Implement Google sign-in button using existing Firebase authentication
  - Create username/password form with name autocomplete functionality
  - Build name suggestion dropdown that filters players as user types
  - Implement validation that requires clicking suggested name before password entry
  - Add loading states and error handling for all authentication methods
  - Write component tests for login page interactions
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2_

- [x] 6. Create name autocomplete component

  - Build reusable NameAutocomplete component in components/ui/name-autocomplete.tsx
  - Implement real-time filtering of player names as user types
  - Add click-to-select functionality that populates input and enables password field
  - Include keyboard navigation (arrow keys, enter, escape) for accessibility
  - Add loading and error states for name fetching
  - Style component to match existing UI design system
  - Write unit tests for autocomplete behavior and interactions
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 7. Implement vote tab in tournament page

  - Modify app/tournament/page.tsx to include Vote tab after Positions tab
  - Add conditional rendering logic to show Vote tab only for logged-in players
  - Create VoteTab component in components/VoteTab.tsx
  - Implement poll display with questions and answer options
  - Add vote submission functionality with confirmation dialogs
  - Display previous votes and disable voting for completed polls
  - Include real-time updates when new polls are added
  - Write component tests for vote tab functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Create poll management interface for admins

  - Create components/admin/PollManagement.tsx component
  - Implement poll creation form with question input and answer type selection
  - Add poll editing interface with ability to modify questions and options
  - Create poll results dashboard showing vote counts and player responses
  - Implement poll deletion with confirmation dialogs
  - Add poll status toggle (active/inactive) functionality
  - Include poll expiration date setting and management
  - Write component tests for admin poll management features
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Create player management interface for admins

  - Create components/admin/PlayerAuthManagement.tsx component
  - Implement player list with authentication status and password management
  - Add create player account functionality with name and password setting
  - Create password reset interface for individual players
  - Implement bulk password generation and assignment features
  - Add player account enable/disable toggle functionality
  - Include player login activity and voting history display
  - Write component tests for player authentication management
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Integrate poll management into admin dashboard

  - Modify app/admin/page.tsx to include poll management section
  - Add navigation tabs or sections for poll management and player auth management
  - Implement role-based access control to show poll management only to super admins
  - Create admin dashboard cards showing poll statistics and player activity
  - Add quick actions for common poll and player management tasks
  - Include real-time updates for poll results and player activity
  - Write integration tests for admin dashboard poll management features
  - _Requirements: 4.1, 4.2, 5.1, 6.4_

- [x] 11. Implement authentication state persistence

  - Add session storage or localStorage for player authentication state
  - Implement automatic session restoration on page reload for both auth types
  - Create session timeout handling with automatic logout
  - Add authentication state synchronization across browser tabs
  - Implement secure token management for player sessions
  - Write unit tests for session persistence and restoration
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 12. Add route protection and conditional rendering

  - Create ProtectedRoute component for player-only and admin-only pages
  - Implement conditional rendering logic throughout the application based on auth state
  - Add redirect logic for unauthorized access attempts
  - Create loading states for authentication checks on protected routes
  - Implement proper error boundaries for authentication failures
  - Write integration tests for route protection behavior
  - _Requirements: 2.3, 3.1, 6.4_

- [x] 13. Implement error handling and user feedback

  - Create comprehensive error handling for all authentication methods
  - Add user-friendly error messages for login failures and voting errors
  - Implement toast notifications for successful actions and errors
  - Create loading states for all async operations (login, voting, poll management)
  - Add form validation with real-time feedback for all input forms
  - Implement retry mechanisms for network failures
  - Write unit tests for error handling scenarios
  - _Requirements: 1.4, 6.5_

- [x] 14. Add real-time updates and notifications

  - Implement Firestore real-time listeners for active polls in vote interface
  - Add real-time vote count updates in admin poll results dashboard
  - Create notification system for new polls and voting deadlines
  - Implement automatic UI updates when polls are activated/deactivated
  - Add real-time player activity monitoring for admin dashboard
  - Write integration tests for real-time functionality
  - _Requirements: 3.3, 4.4_

- [x] 15. Create comprehensive test suite
  - Write end-to-end tests for complete player voting workflow using Playwright or Cypress
  - Create integration tests for admin poll management workflow
  - Implement authentication flow tests for all user types and scenarios
  - Add performance tests for name autocomplete and poll loading
  - Create accessibility tests for all new components and pages
  - Write security tests for authentication bypass attempts and vote manipulation
  - _Requirements: All requirements validation_
