import * as dao from '../authorizedApi.repository';
import * as db from '../../../core/database/database';

describe('authorizedApiDao', () => {
  beforeEach(() => jest.resetAllMocks());

  test('createAuthorizedApi empty result throws', async () => {
    jest.spyOn(db, 'executeQuery').mockResolvedValue([] as any);
    await expect(dao.createAuthorizedApi({ api_name: 'a', api_url: 'u' })).rejects.toThrow();
  });

  test('getAllAuthorizedApi empty throws', async () => {
    jest.spyOn(db, 'executeQuery').mockResolvedValue([] as any);
    await expect(dao.getAllAuthorizedApi()).rejects.toThrow();
  });

  test('getAuthorizedApiByName returns null on empty', async () => {
    jest.spyOn(db, 'executeQuery').mockResolvedValue([] as any);
    const r = await dao.getAuthorizedApiByName('a');
    expect(r).toBeNull();
  });
});
