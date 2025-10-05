# Requirements Document

## Introduction

This feature implements a comprehensive tournament voting system that allows players to vote on tournament participation through a unified authentication system. The system supports multiple authentication methods (Firebase email/Google and username/password) and provides admin controls for managing polls and questions.

## Requirements

### Requirement 1

**User Story:** As a tournament player, I want to login using my name and admin-assigned password, so that I can vote on tournament participation without needing technical accounts.

#### Acceptance Criteria

1. WHEN a player visits /login THEN the system SHALL display a unified login page with multiple authentication options
2. WHEN a player types their name in the username field THEN the system SHALL show autocomplete suggestions from the players database
3. WHEN a player clicks on a suggested name THEN the system SHALL enable the password field and require the admin-assigned password
4. WHEN a player enters correct credentials THEN the system SHALL authenticate them and redirect to /tournament
5. IF a player tries to type a name without selecting from suggestions THEN the system SHALL prevent login

### Requirement 2

**User Story:** As a super admin or helper, I want to continue using my existing email/Google authentication, so that I can access admin features without changing my login method.

#### Acceptance Criteria

1. WHEN an admin visits /login THEN the system SHALL display email/password and Google sign-in options alongside the new username option
2. WHEN an admin uses Firebase authentication THEN the system SHALL maintain existing authorization checks
3. WHEN an admin successfully logs in THEN the system SHALL redirect them to /admin with appropriate permissions
4. WHEN the system processes authentication THEN it SHALL support both Firebase users and player users simultaneously

### Requirement 3

**User Story:** As a logged-in player, I want to see a Vote tab in the tournament page, so that I can participate in tournament polls.

#### Acceptance Criteria

1. WHEN a player is logged in and visits /tournament THEN the system SHALL display a Vote tab after the Positions tab
2. WHEN a non-logged-in user visits /tournament THEN the system SHALL hide the Vote tab
3. WHEN a player clicks the Vote tab THEN the system SHALL display active polls with questions and answer options
4. WHEN a player submits a vote THEN the system SHALL record their response and prevent duplicate voting
5. WHEN a player has already voted THEN the system SHALL display their previous vote and disable further voting

### Requirement 4

**User Story:** As a super admin, I want to create and manage tournament polls, so that I can gather player feedback on various tournament aspects.

#### Acceptance Criteria

1. WHEN a super admin accesses poll management THEN the system SHALL allow creating new polls with custom questions
2. WHEN creating a poll THEN the system SHALL support multiple answer types (Yes/No, Yes/No/Maybe, multiple choice)
3. WHEN a super admin edits a poll THEN the system SHALL allow modifying questions, answers, and poll status
4. WHEN a super admin views poll results THEN the system SHALL display vote counts and player responses
5. WHEN a super admin deletes a poll THEN the system SHALL remove it and all associated votes

### Requirement 5

**User Story:** As a super admin, I want to manage player accounts and passwords, so that I can control access to the voting system.

#### Acceptance Criteria

1. WHEN a super admin accesses player management THEN the system SHALL display all players with their login credentials
2. WHEN a super admin creates a player account THEN the system SHALL allow setting name and password
3. WHEN a super admin resets a player password THEN the system SHALL update the password and notify the admin
4. WHEN a super admin views player activity THEN the system SHALL show voting history and login status
5. WHEN a super admin disables a player account THEN the system SHALL prevent that player from logging in

### Requirement 6

**User Story:** As a system, I want to maintain secure authentication state, so that user sessions are properly managed across different authentication methods.

#### Acceptance Criteria

1. WHEN any user logs in THEN the system SHALL create a unified authentication state
2. WHEN a user's session expires THEN the system SHALL redirect them to the login page
3. WHEN a user logs out THEN the system SHALL clear all authentication data
4. WHEN the system checks permissions THEN it SHALL correctly identify user type (player, helper, super admin)
5. WHEN authentication fails THEN the system SHALL display appropriate error messages
