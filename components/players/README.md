# Players Tab Refactoring

The PlayersTab component has been refactored into smaller, reusable components for better maintainability and code organization.

## Component Structure

### Core Components

- **PlayersTab.tsx** - Main container component that orchestrates all other components
- **PlayerCard.tsx** - Individual player card component for mobile view
- **PlayerTable.tsx** - Table component for desktop view with both desktop table and mobile cards
- **PlayerStats.tsx** - Header component showing player statistics and category counts
- **PlayerFilters.tsx** - Search and filter controls component
- **PlayerActions.tsx** - Action buttons (Add Player, Export CSV)
- **PlayerDialog.tsx** - Reusable modal for adding/editing players
- **PlayerStatsModal.tsx** - Modal showing detailed player statistics

### Hooks

- **usePlayerData.ts** - Custom hook managing player data fetching, adding, and updating

### Types

- **types.ts** - TypeScript interfaces and types used across components

## Benefits of Refactoring

1. **Modularity** - Each component has a single responsibility
2. **Reusability** - Components can be reused in other parts of the application
3. **Maintainability** - Easier to maintain and debug individual components
4. **Testability** - Smaller components are easier to unit test
5. **Code Organization** - Related functionality is grouped together

## Usage

```tsx
import { PlayersTab } from "@/components/players";

// Basic usage
<PlayersTab />

// With props
<PlayersTab readOnly={true} hideCsvExport={true} />
```

## Individual Component Usage

```tsx
import { PlayerCard, PlayerFilters, usePlayerData } from "@/components/players";

// Use individual components
const { players, isLoading } = usePlayerData("all");

<PlayerFilters
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  // ... other props
/>;
```

## TODO

The following components still need to be implemented:

- **BalanceHistoryModal** - Modal for viewing player balance history
- **BalanceAdjustmentModal** - Modal for adjusting player balances

These were part of the original component but are currently stubbed out in the refactored version.
