import * as usersDao from '../users.repository';
import * as db from '../../../core/database/database';

describe('usersDao', () => {
  beforeEach(() => jest.resetAllMocks());

  test('createUser with invalid email throws', async () => {
    await expect(usersDao.createUser('', null, 'n')).rejects.toThrow();
  });

  test('createUser database returns empty throws', async () => {
    jest.spyOn(db.Database, 'execute' as any).mockResolvedValue([] as any);
    await expect(usersDao.createUser('a@b.c', null, 'n')).rejects.toThrow('Failed to create user.');
  });

  test('getUserByEmailToken invalid args throw', async () => {
    await expect(usersDao.getUserByEmailToken('', '')).rejects.toThrow();
  });

  test('getUserByEmailToken not found throws', async () => {
    jest.spyOn(db.Database, 'execute' as any).mockResolvedValue([] as any);
    await expect(usersDao.getUserByEmailToken('a@b.c', 't')).rejects.toThrow();
  });

  test('getUserByEmail success returns user', async () => {
    jest.spyOn(db.Database, 'execute' as any).mockResolvedValue([{ users_id: 1, users_email: 'a@b.c' }] as any);
    const r = await usersDao.getUserByEmail('a@b.c');
    expect(r.users_email).toBe('a@b.c');
  });

  test('updateUser invalid user throws', async () => {
    await expect(usersDao.updateUser({} as any)).rejects.toThrow();
  });
});
