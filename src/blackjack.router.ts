import { Router } from 'express';
import { createGame, hit, stand, split, getGameState, newRound, double } from './blackjack.controller.js';

const router = Router();

router.post('/new-game', createGame);
router.post('/games/:gameId/new-round', newRound);
router.post('/games/:gameId/hit', hit);
router.post('/games/:gameId/stand', stand);
router.post('/games/:gameId/split', split);
router.post('/games/:gameId/double', double);
router.get('/games/:gameId', getGameState);

export default router;