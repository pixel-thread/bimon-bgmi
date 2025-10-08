// src/utils/pagination.ts

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from './paginationOptions';

export type PaginationParams = {
  page?: string | number;
  pageSize?: number;
};

export type PaginationResult = {
  skip: number;
  take: number;
  currentPage: number;
  pageSize: number;
};

export function getPagination({
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginationParams): PaginationResult {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;

  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;

  const size = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;

  return {
    skip: (currentPage - 1) * size,
    take: size,
    currentPage,
    pageSize: size,
  };
}
