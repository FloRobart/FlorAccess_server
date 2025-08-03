import { Router } from 'express';
import { handshake } from '../controllers/handshakeController';



const router = Router();



router.post('/', handshake);



export default router;