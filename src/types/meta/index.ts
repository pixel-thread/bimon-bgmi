export type MetaT = {
  total?: number;
  page?: number;
  hasNextPage?: boolean;
  pageSize?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  // Prize pool info for rankings
  entryFee?: number;
  totalPlayers?: number;
  prizePool?: number;
  ucExemptCount?: number;
  // Balance aggregates for admin
  totalBalance?: number;
  negativeBalance?: number;
};
