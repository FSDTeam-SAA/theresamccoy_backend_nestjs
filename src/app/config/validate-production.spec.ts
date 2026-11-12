import { validateProductionEnvironment } from './validate-production';
describe('production configuration', () => {
  it('rejects missing or shared secrets', () => {
    expect(() =>
      validateProductionEnvironment({ NODE_ENV: 'production' }),
    ).toThrow('ACCESS_TOKEN_SECRET');
    expect(() =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        ACCESS_TOKEN_SECRET: 'a'.repeat(32),
        REFRESH_TOKEN_SECRET: 'a'.repeat(32),
      }),
    ).toThrow('must differ');
  });
  it('accepts explicit production credentials and development without them', () => {
    expect(() =>
      validateProductionEnvironment({ NODE_ENV: 'development' }),
    ).not.toThrow();
    expect(() =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        ACCESS_TOKEN_SECRET: 'a'.repeat(32),
        REFRESH_TOKEN_SECRET: 'b'.repeat(32),
        MONGO_URI: 'mongodb://localhost/test',
        CORS_ORIGIN: 'https://example.com',
      }),
    ).not.toThrow();
  });
});
