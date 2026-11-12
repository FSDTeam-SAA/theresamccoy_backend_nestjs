import paginationHelper from './pagenation';
import buildWhereConditions, { escapeSearch } from './buildWhereConditions';
describe('safe list queries', () => {
  it('bounds invalid and excessively large pagination values', () => {
    expect(paginationHelper({ page: -1, limit: -10 })).toMatchObject({
      page: 1,
      limit: 10,
      skip: 0,
    });
    expect(paginationHelper({ limit: 100000 }).limit).toBe(100);
    expect(paginationHelper({ page: Infinity }).page).toBe(1);
  });
  it('treats regex input as literal text', () => {
    expect(new RegExp(escapeSearch('a.*(b)')).test('a.*(b)')).toBe(true);
    expect(new RegExp(escapeSearch('a.*(b)')).test('axxb')).toBe(false);
  });
  it('does not accept Mongo operators through query filter objects', () => {
    expect(buildWhereConditions({ status: { $ne: 'active' } } as any)).toEqual(
      {},
    );
  });
});
