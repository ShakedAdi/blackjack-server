import express, {type Application, type Request, type Response } from 'express';
import cors from 'cors';
import type { Game } from './types.js';
import { randomUUID } from 'node:crypto';

const app: Application = express();
const PORT: number = 42069;

app.use(express.json());
app.use(cors());

// health check endpoint
app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({isRunning: true});
});

// === game logic ===
const games = new Map<string, Game>();

app.post('/new-game', (req: Request, res: Response) => {
    const gameId = randomUUID();
    const game: Game = {
        player: [], 
        dealer: undefined, 
        state: "player-turn"
    };
    games.set(gameId, game);
    res.status(201).json({gameId});
});

// debug endpoint
app.get('/all-games', (req: Request, res: Response) => {
    res.status(200).json(Object.fromEntries(games));
});

app.listen(PORT, () => {
    console.log("[SERVER] Lets go my G");
})