import { getUserProfile, logoutUser, registerUser, updateUserById, deleteUserById } from '../userController';
import * as Users from '../usersDao';
import * as securities from '../../../core/utils/securities';
import { AppError } from '../../../core/models/ErrorModel';

// Helper to mock req/res/next
function mockReq(headers = {}, body = {}, query = {}, ip = '1.2.3.4') {
  return { headers, body, query, ip } as any;
}
function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() { return jest.fn(); }

describe('userController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('getUserProfile: missing auth header calls next with AppError', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await getUserProfile(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
  });

  test('getUserProfile: invalid bearer format calls next', async () => {
    const req = mockReq({ authorization: 'BadToken' });
    const res = mockRes();
    const next = mockNext();

    await getUserProfile(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('getUserProfile: valid token returns user', async () => {
    const user = { users_id: 1, users_email: 'a@b.c', users_name: 'n', users_authmethod: 'local' } as any;
    jest.spyOn(securities, 'verifyJwt').mockResolvedValue(user);

    const req = mockReq({ authorization: 'Bearer token123' });
    const res = mockRes();
    const next = mockNext();

    await getUserProfile(req, res, next);
    // verifyJwt is async via then; wait a tick
    await Promise.resolve();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('registerUser: invalid body calls next', async () => {
    const req = mockReq({}, {});
    const res = mockRes();
    const next = mockNext();

    await registerUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('registerUser: valid body creates user and returns jwt', async () => {
    const createdUser = { users_id: 2, users_email: 'b@c.d', users_name: 'x' } as any;
    jest.spyOn(Users, 'createUser').mockResolvedValue(createdUser);
    jest.spyOn(securities, 'getJwt').mockResolvedValue('jwt123');
    jest.spyOn(require('../../../core/utils/utils'), 'isValidRequestBody').mockReturnValue(true);
    jest.spyOn(require('../../../core/utils/utils'), 'isValidEmail').mockReturnValue(true);

    const req = mockReq({}, { email: 'b@c.d', name: 'x' });
    const res = mockRes();
    const next = mockNext();

    await registerUser(req, res, next);
    await new Promise((r) => setImmediate(r));
    expect(Users.createUser).toHaveBeenCalled();
    expect(securities.getJwt).toHaveBeenCalled();
  });

});
