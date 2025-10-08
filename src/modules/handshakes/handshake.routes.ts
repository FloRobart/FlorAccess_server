import { Router } from 'express';
import { handshake } from './handshake.controller';



const router = Router();



router.get('/', handshake);



export default router;