import { Router } from 'express';
import { handshake } from './handshakeController';



const router = Router();



router.get('/', handshake);



export default router;