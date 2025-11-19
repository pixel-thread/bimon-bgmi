import { DEFAULT_PAGE_SIZE } from './paginationOptions';

type GetMetaProps = {
  total: number;
  currentPage: string;
};
export const getMeta = ({ total, currentPage }: GetMetaProps) => {
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return {
    total,
    page: parseInt(currentPage),
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages,
    hasNextPage: parseInt(currentPage) < totalPages,
    hasPreviousPage: parseInt(currentPage) > 1,
  };
};
