import { Router } from 'express';
import { handshake } from '../controllers/handshakeController';



const router = Router();



router.get('/', handshake);



export default router;