# Firebase Firestore Indexes Required

Based on the errors you're seeing, you need to create these composite indexes in your Firebase console:

## Required Indexes

### 1. For `polls` collection:

- **Collection ID**: `polls`
- **Fields**:
  - `isActive` (Ascending)
  - `createdAt` (Descending)
  - `__name__` (Descending)

### 2. For `poll_votes` collection:

- **Collection ID**: `poll_votes`
- **Fields**:
  - `playerId` (Ascending)
  - `votedAt` (Descending)
  - `__name__` (Descending)

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `bgmi-form`
3. Navigate to Firestore Database
4. Click on "Indexes" tab
5. Click "Create Index"
6. Add the fields as specified above

## Alternative: Use the provided links

The error messages contain direct links to create the indexes:

1. **Polls index**: https://console.firebase.google.com/v1/r/project/bgmi-form/firestore/indexes?create_composite=Ckdwcm9qZWN0cy9iZ21pLWZvcm0vZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3BvbGxzL2luZGV4ZXMvXxABGgwKCGlzQWN0aXZlEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

2. **Poll votes index**: https://console.firebase.google.com/v1/r/project/bgmi-form/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9iZ21pLWZvcm0vZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3BvbGxfdm90ZXMvaW5kZXhlcy9fEAEaDAoIcGxheWVySWQQARoLCgd2b3RlZEF0EAIaDAoIX19uYW1lX18QAg

Just click these links and confirm the index creation.

## Index Creation Time

- Indexes typically take a few minutes to build
- You'll see a "Building" status that changes to "Enabled" when ready
- The app will work normally once indexes are created
