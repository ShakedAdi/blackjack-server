import express, {type Application, type Request, type Response } from 'express';
import cors from 'cors';
import type { Card, Game } from './types.js';
import { randomUUID } from 'node:crypto';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { handValue, initializeGame } from './utils.js';


const app: Application = express();
const PORT: number = 42069;

app.use(express.json());
app.use(cors());

const spec = parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

// health check endpoint
app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({isRunning: true});
});


// === game logic ===
const games = new Map<string, Game>();

app.post('/new-game', (req: Request, res: Response) => {
    const gameId = randomUUID();
    const game: Game = initializeGame();
    games.set(gameId, game);
    res.status(201).json({gameId, dealersCard: game.dealer?.cards[0], playersCards: game.player[0]?.cards});
});

app.post('/games/:gameId/hit', (req: Request<{gameId: string}>, res: Response) => {
    const game: Game | undefined = games.get(req.params.gameId);
    if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
    }

    if (game.state !== "player-turn") {
        res.status(409).json({ error: "It is not the player's turn" });
        return;
    }

    for (const hand of game.player) {
        if (hand.status == "playing") {
            const newCard: Card = game.deck.pop()!;
            hand.cards.push(newCard);

            const value: number = handValue(hand);
            if (value > 21) hand.status = "busted";
            if (value === 21) hand.status = "stood";

            res.status(200).json({ newCard, status: hand.status });
            return;
        }
    }

    res.status(409).json({ error: "No active hand to hit" });
    return;
});

// === game logic ===


// debug endpoint
app.get('/all-games', (req: Request, res: Response) => {
    res.status(200).json(Object.fromEntries(games));
});

app.listen(PORT, () => {
    console.log("[SERVER] Lets go my G");
})