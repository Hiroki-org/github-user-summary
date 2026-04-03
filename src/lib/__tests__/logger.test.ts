import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call console.info with correct arguments', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const message = 'test info message';
    const arg1 = { key: 'value' };
    const arg2 = 42;

    logger.info(message, arg1, arg2);

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(message, arg1, arg2);
  });

  it('should call console.warn with correct arguments', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const message = 'test warn message';
    const arg1 = 'warning details';

    logger.warn(message, arg1);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(message, arg1);
  });

  it('should call console.error with correct arguments', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const message = 'test error message';
    const errorObj = new Error('Test error');

    logger.error(message, errorObj);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(message, errorObj);
  });
});
