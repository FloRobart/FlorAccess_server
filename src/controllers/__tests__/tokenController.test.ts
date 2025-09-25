import { sendToken } from '../tokenController';
import * as Users from '../../database/usersDao';
import { sendTokenEmail } from '../../email/tokenMail';
import { AppError } from '../../models/ErrorModel';

function mockReq(body = {}) { return { body } as any; }
function mockRes() { const r:any={}; r.status=jest.fn().mockReturnValue(r); r.json=jest.fn().mockReturnValue(r); return r; }
function mockNext(){ return jest.fn(); }

describe('tokenController', () => {
  beforeEach(()=>jest.resetAllMocks());

  test('sendToken invalid body calls next', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    await sendToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('sendToken user not found calls next', async () => {
    jest.spyOn(Users, 'getUserByEmail').mockRejectedValue(new Error('notfound'));
    const req = mockReq({ email: 'a@b.c' });
    const res = mockRes();
    const next = mockNext();
    await sendToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('sendToken success sends email and responds', async () => {
  const user = { users_id: 1, users_email: 'a@b.c', users_secret: null } as any;
    jest.spyOn(Users, 'getUserByEmail').mockResolvedValue(user);
    jest.spyOn(Users, 'updateUser').mockResolvedValue({ users_secret: 's' } as any);
    jest.spyOn(require('../../utils/utils'), 'generateUserToken').mockReturnValue('tokenx');
    jest.spyOn(require('../../email/tokenMail'), 'sendTokenEmail').mockResolvedValue(undefined);
  jest.spyOn(require('../../utils/utils'), 'isValidRequestBody').mockReturnValue(true);
  jest.spyOn(require('../../utils/utils'), 'isValidEmail').mockReturnValue(true);

    const req = mockReq({ email: 'a@b.c' });
    const res = mockRes();
    const next = mockNext();
    await sendToken(req, res, next);
    // wait for the internal promise chains
    await new Promise((r) => setImmediate(r));
    expect(Users.getUserByEmail).toHaveBeenCalled();
    expect(Users.updateUser).toHaveBeenCalled();
    expect(require('../../email/tokenMail').sendTokenEmail).toHaveBeenCalled();
  });
});
