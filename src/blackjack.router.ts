import { Router } from 'express';
import { createGame, hit, stand, split, getGameState, listAllGames, newRound } from './blackjack.controller.js';

const router = Router();

router.post('/new-game', createGame);
router.post('/games/:gameId/new-round', newRound);
router.post('/games/:gameId/hit', hit);
router.post('/games/:gameId/stand', stand);
router.post('/games/:gameId/split', split);
router.get('/games/:gameId', getGameState);
router.get('/all-games', listAllGames); // debug endpoint

export default router;