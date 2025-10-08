import { errorHandler } from '../errorHandler';
import { AppError, internalMessage } from '../../models/ErrorModel';
import * as logger from '../../utils/logger';

function mockReq(){ return {} as any; }
function mockRes(){ const r:any={}; r.status=jest.fn().mockReturnValue(r); r.json=jest.fn().mockReturnValue(r); return r; }
function mockNext(){ return jest.fn(); }

describe('errorHandler', ()=>{
  beforeEach(()=>jest.resetAllMocks());

  test('logs error for 500 and returns body', ()=>{
    const err = new AppError({message:'x', httpStatus:500, internalStatus:1});
    const res = mockRes(); const req = mockReq(); const next = mockNext();
    const spy = jest.spyOn(logger, 'error').mockImplementation(()=>{});
    errorHandler(err, req, res, next);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'x' }));
  });

  test('logs warning for 400', ()=>{
    const err = new AppError({message:'x', httpStatus:400, internalStatus:2});
    const res = mockRes(); const req = mockReq(); const next = mockNext();
    const spy = jest.spyOn(logger, 'warning').mockImplementation(()=>{});
    errorHandler(err, req, res, next);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
