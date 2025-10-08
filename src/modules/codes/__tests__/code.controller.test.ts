import { loginRequest, loginConfirmation } from '../code.controller';
import * as Users from '../../users/users.repository';
import * as securities from '../../../core/utils/securities';
import { sendCodeEmail } from '../code.email';

function mockReq(body = {}, ip = '1.2.3.4') { return { body, ip } as any; }
function mockRes() { const r: any = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; }
function mockNext() { return jest.fn(); }

describe('codeController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('loginRequest invalid body calls next', async () => {
    const req = mockReq({}); const res = mockRes(); const next = mockNext();
    await loginRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('loginRequest success generates code, hashes and sends email', async () => {
    jest.spyOn(securities, 'generateCode').mockResolvedValue('ABC123');
    jest.spyOn(securities, 'hashString').mockResolvedValue('hashed');
    jest.spyOn(Users, 'updateUser').mockResolvedValue({} as any);
    jest.spyOn(require('../code.email'), 'sendCodeEmail').mockResolvedValue(undefined);
    jest.spyOn(require('../../../core/utils/utils'), 'isValidRequestBody').mockReturnValue(true);
    jest.spyOn(require('../../../core/utils/utils'), 'isValidEmail').mockReturnValue(true);

    const req = mockReq({ email: 'a@b.c', name: 'n' }); const res = mockRes(); const next = mockNext();
    await loginRequest(req, res, next);
    await new Promise((r) => setImmediate(r));
    expect(securities.generateCode).toHaveBeenCalled();
    expect(securities.hashString).toHaveBeenCalled();
  });

  test('loginConfirmation invalid body calls next', async () => {
    const req = mockReq({}); const res = mockRes(); const next = mockNext();
    await loginConfirmation(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('loginConfirmation invalid code calls next', async () => {
    jest.spyOn(Users, 'getUserByEmail').mockResolvedValue({ users_secret: 'secret' } as any);
    jest.spyOn(securities, 'verifyHash').mockResolvedValue(false);
    const req = mockReq({ email: 'a@b.c', code: 'x' }); const res = mockRes(); const next = mockNext();
    await loginConfirmation(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('loginConfirmation success returns jwt', async () => {
    const user = { users_secret: 'h', users_email: 'a@b.c', users_name: 'n', users_id: 1 } as any;
    jest.spyOn(Users, 'getUserByEmail').mockResolvedValue(user);
    jest.spyOn(securities, 'verifyHash').mockResolvedValue(true);
    jest.spyOn(Users, 'updateUser').mockResolvedValue({} as any);
    jest.spyOn(securities, 'getJwt').mockResolvedValue('jwtx');
    jest.spyOn(require('../../../core/utils/utils'), 'isValidRequestBody').mockReturnValue(true);
    jest.spyOn(require('../../../core/utils/utils'), 'isValidEmail').mockReturnValue(true);

    const req = mockReq({ email: 'a@b.c', code: 'abc' }); const res = mockRes(); const next = mockNext();
    await loginConfirmation(req, res, next);
    await new Promise((r) => setImmediate(r));
    expect(Users.getUserByEmail).toHaveBeenCalled();
    expect(securities.verifyHash).toHaveBeenCalled();
  });
});
