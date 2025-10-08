import { getJwt as getJwtController, verifyToken, getUserFromJwt } from '../jwt.controller';
import * as Users from '../../users/users.repository';
import * as authorizedDao from '../../handshakes/authorizedApi.repository';
import JWT from 'jsonwebtoken';
import { AppError } from '../../../core/models/ErrorModel';

function mockReq(query = {}, params = {}, headers = {}, ip = '') { return { query, params, headers, ip } as any; }
function mockRes() { const r: any = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; }
function mockNext() { return jest.fn(); }

describe('jwtController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('getJwt: invalid query returns next', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();
    await getJwtController(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('getJwt: expired token returns error via next', async () => {
    const token = 'abc.1.5';
    jest.spyOn(Users, 'getUserByEmailToken').mockResolvedValue({ users_id: 9, users_email: 'a@b.c' } as any);
    const req = mockReq({ email: 'a@b.c', token });
    const res = mockRes();
    const next = mockNext();

    await getJwtController(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('verifyToken: no auth header returns next', async () => {
    const req = mockReq({}, { jwt: 'x' }, {});
    const res = mockRes();
    const next = mockNext();
    await verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('verifyToken: invalid jwt returns valid:false', async () => {
    const req = mockReq({}, { jwt: 'x' }, { authorization: 'Bearer token' });
    const res = mockRes();
    const next = mockNext();
    jest.spyOn(JWT, 'verify').mockImplementation((tok: any, key: any, cb: any) => cb(new Error('fail')));
    await verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
  });

  test('getUserFromJwt: missing auth header calls next', async () => {
    const req = mockReq({}, {}, {});
    const res = mockRes();
    const next = mockNext();
    await getUserFromJwt(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('getUserFromJwt: unauthorized api name calls next', async () => {
    const req = mockReq({ jwt: 'x' }, {}, { authorization: 'Api token' });
    const res = mockRes();
    const next = mockNext();
    jest.spyOn(authorizedDao, 'getAuthorizedApiByName').mockResolvedValue(null);
    await getUserFromJwt(req, res, next);
    expect(next).toHaveBeenCalled();
  });

});
