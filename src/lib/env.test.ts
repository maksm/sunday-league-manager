/**
 * Tests for environment variable validation
 * Note: Since env.ts validates on import, we test that the validation schema
 * is working correctly by checking the current environment is valid
 */

describe('env validation', () => {
  it('should have valid environment variables loaded', () => {
    // Import the validated env object
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('./env');

    // Verify required fields are present
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.NEXTAUTH_SECRET).toBeDefined();
    expect(env.NEXTAUTH_URL).toBeDefined();
    expect(env.NEXT_PUBLIC_LOCALE).toBeDefined();
    expect(['en', 'sl']).toContain(env.NEXT_PUBLIC_LOCALE);
  });

  it('should have NEXTAUTH_SECRET with minimum length', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('./env');
    expect(env.NEXTAUTH_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('should have valid NEXTAUTH_URL', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('./env');
    expect(() => new URL(env.NEXTAUTH_URL)).not.toThrow();
  });

  it('should have NODE_ENV set', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('./env');
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
  });
});
