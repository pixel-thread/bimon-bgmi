import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

type Props = {
  children: React.ReactNode;
};

const client = new QueryClient({
  mutationCache: new MutationCache(),
  queryCache: new QueryCache(),
  defaultOptions: {
    queries: {
      // Don't refetch when window regains focus - reduces unnecessary API calls
      refetchOnWindowFocus: false,
      // Don't refetch when reconnecting - let user manually refresh if needed
      refetchOnReconnect: false,
      // Keep data fresh for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Retry failed requests only once
      retry: 1,
    },
  },
});

export const TQueryProvider = ({ children }: Props) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
