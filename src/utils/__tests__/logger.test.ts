// Ensure config app_env is set to desired levels before importing
import config from '../../config/config';
import { ENABLE_ENV } from '../../config/enableenv';

jest.mock('../../email/errorEmail', () => ({
  sendErrorEmail: jest.fn(async () => Promise.resolve())
}));

import * as logger from '../logger';
import { sendErrorEmail } from '../../email/errorEmail';

describe('logger', () => {
  let origEnv: string;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    origEnv = config.app_env;
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
    infoSpy.mockRestore();
    debugSpy.mockRestore();
  });

  test('error logs when app_env >=1 and triggers email at level 4', async () => {
    // simulate level 4
    (config as any).app_env = Object.keys(ENABLE_ENV).find(k => ENABLE_ENV[k] === 4) || config.app_env;
    await logger.error('err');
    expect(errorSpy).toHaveBeenCalled();
    // sendErrorEmail was mocked to resolve
    // ensure it was called when app_env===4
    expect(sendErrorEmail).toHaveBeenCalled();
  });

  test('error email failure logs fallback', async () => {
    (config as any).app_env = Object.keys(ENABLE_ENV).find(k => ENABLE_ENV[k] === 4) || config.app_env;
    (sendErrorEmail as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('boom')));
    await logger.error('err2');
    // Should have attempted to send email and then logged the failure
    expect(sendErrorEmail).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  test('warning logs when app_env >=2', () => {
    (config as any).app_env = Object.keys(ENABLE_ENV).find(k => ENABLE_ENV[k] === 2) || config.app_env;
    logger.warning('warn');
    expect(warnSpy).toHaveBeenCalled();
  });

  test('success logs when app_env >=3', () => {
    (config as any).app_env = Object.keys(ENABLE_ENV).find(k => ENABLE_ENV[k] === 3) || config.app_env;
    logger.success('ok');
    expect(logSpy).toHaveBeenCalled();
  });

  test('info logs when app_env >=4', () => {
    (config as any).app_env = Object.keys(ENABLE_ENV).find(k => ENABLE_ENV[k] === 4) || config.app_env;
    logger.info('info');
    expect(infoSpy).toHaveBeenCalled();
  });

  test('debug logs when app_env >=5', () => {
    (config as any).app_env = Object.keys(ENABLE_ENV).find(k => ENABLE_ENV[k] === 5) || config.app_env;
    logger.debug('dbg');
    expect(debugSpy).toHaveBeenCalled();
  });
});
