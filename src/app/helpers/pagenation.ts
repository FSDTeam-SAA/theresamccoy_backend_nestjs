import { SortOrder } from 'mongoose';

export interface IOptions {
  page?: number;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface IPaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: SortOrder;
}

const paginationHelper = (options: IOptions): IPaginationResult => {
  const positiveInteger = (value: unknown, fallback: number) => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : fallback;
  };
  const page = Math.min(positiveInteger(options.page, 1), 1000000);
  const limit = Math.min(positiveInteger(options.limit, 10), 100);
  const skip = (page - 1) * limit;
  const sortBy =
    typeof options.sortBy === 'string' &&
    /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(options.sortBy)
      ? options.sortBy
      : 'createdAt';
  const sortOrder: SortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';
  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export default paginationHelper;
