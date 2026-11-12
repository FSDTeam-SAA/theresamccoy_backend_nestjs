import { IFilterParams } from './pick';

export const escapeSearch = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildWhereConditions = (
  params: IFilterParams,
  searchAbleFields: string[] = [],
  extraConditions: Record<string, unknown> = {},
): Record<string, unknown> => {
  const { searchTerm, ...filterData } = params;
  const conditions: Record<string, unknown>[] = [];
  if (typeof searchTerm === 'string' && searchTerm && searchAbleFields.length) {
    conditions.push({
      $or: searchAbleFields.map((field) => ({
        [field]: { $regex: escapeSearch(searchTerm), $options: 'i' },
      })),
    });
  }
  for (const [key, value] of Object.entries(filterData)) {
    // Reject query objects such as status[$ne]=...; controllers select allowed keys.
    if (
      !key.startsWith('$') &&
      ['string', 'number', 'boolean'].includes(typeof value)
    )
      conditions.push({ [key]: value });
  }
  if (Object.keys(extraConditions).length) conditions.push(extraConditions);
  return conditions.length ? { $and: conditions } : {};
};
export default buildWhereConditions;
