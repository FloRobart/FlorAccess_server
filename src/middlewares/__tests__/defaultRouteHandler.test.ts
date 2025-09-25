import { defaultRouteHandler } from '../defaultRouteHandler';
import { AppError } from '../../models/ErrorModel';

function mockReq(){ return {} as any; }
function mockRes(){ return {} as any; }
function mockNext(){ return jest.fn(); }

describe('defaultRouteHandler', ()=>{
  test('calls next with AppError 404', ()=>{
    const next = mockNext();
    defaultRouteHandler(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.httpStatus).toBe(404);
  });
});
