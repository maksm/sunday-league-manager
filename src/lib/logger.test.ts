import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { logError, logInfo, logWarning } from './logger';

describe('logger', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('logError', () => {
    it('should log error with message and context', () => {
      const error = new Error('Test error');
      logError('Something went wrong', error, {
        endpoint: '/api/test',
        userId: 'user-123',
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        message: 'Something went wrong',
        error: 'Test error',
        endpoint: '/api/test',
        userId: 'user-123',
      });
      expect(loggedData.timestamp).toBeDefined();
      expect(loggedData.stack).toContain('Error: Test error');
    });

    it('should handle non-Error objects', () => {
      logError('String error', 'Simple error string');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        message: 'String error',
        error: 'Simple error string',
      });
      expect(loggedData.stack).toBeUndefined();
    });

    it('should work without context', () => {
      const error = new Error('Test error');
      logError('Error without context', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        message: 'Error without context',
        error: 'Test error',
      });
    });
  });

  describe('logInfo', () => {
    it('should log info message with context', () => {
      logInfo('User logged in', {
        userId: 'user-123',
        endpoint: '/api/login',
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        level: 'info',
        message: 'User logged in',
        userId: 'user-123',
        endpoint: '/api/login',
      });
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should work without context', () => {
      logInfo('Simple info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        level: 'info',
        message: 'Simple info message',
      });
    });
  });

  describe('logWarning', () => {
    it('should log warning message with context', () => {
      logWarning('Deprecated API called', {
        endpoint: '/api/old-endpoint',
        userId: 'user-123',
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        level: 'warning',
        message: 'Deprecated API called',
        endpoint: '/api/old-endpoint',
        userId: 'user-123',
      });
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should work without context', () => {
      logWarning('Simple warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);

      expect(loggedData).toMatchObject({
        level: 'warning',
        message: 'Simple warning message',
      });
    });
  });
});
