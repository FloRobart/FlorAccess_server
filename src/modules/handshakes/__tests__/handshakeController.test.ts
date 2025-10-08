import { handshake } from '../handshakeController';
import * as authorizedDao from '../authorizedApiDao';
import config from '../../../config/config';

function mockReq(query = {}, headers = {}) { return { query, headers } as any; }
function mockRes() { const r: any = {}; r.status = jest.fn().mockReturnValue(r); r.send = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; }
function mockNext() { return jest.fn(); }

describe('handshakeController', () => {
  beforeEach(() => jest.resetAllMocks());

  test('handshake missing params or header calls next', async () => {
    const req = mockReq({}, {}); const res = mockRes(); const next = mockNext();
    await handshake(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('handshake unauthorized static token calls next', async () => {
    const params = Buffer.from('a.b.1').toString('base64');
    const req = mockReq({ params }, { authorization: 'Bearer wrong' }); const res = mockRes(); const next = mockNext();
    await handshake(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('handshake invalid params length calls next', async () => {
    const req = mockReq({ params: Buffer.from('a.b').toString('base64') }, { authorization: `Bearer ${config.handshake_static_token}` }); const res = mockRes(); const next = mockNext();
    await handshake(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('handshake valid but mismatch calls next', async () => {
    const saved = { api_name: 'a', api_privatetoken: 't', api_lastaccess: '2' } as any;
    jest.spyOn(authorizedDao, 'getAuthorizedApiByName').mockResolvedValue(saved);
    const params = Buffer.from('a.' + 'nohash' + '.2').toString('base64');
    const req = mockReq({ params }, { authorization: `Bearer ${config.handshake_static_token}` }); const res = mockRes(); const next = mockNext();
    await handshake(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
