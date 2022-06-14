import express from 'express';
import controller from '../controllers/game';
const router = express.Router();

router.get('/session/:id/status', controller.get_session_status);
router.get('/game/:id', controller.get_game);
router.post('/game/:id/move', controller.submit_move);
router.post('/session/join-as/:name', controller.join_new_session);

export default router;