import express, {type Application, type Request, type Response } from 'express';
import cors from 'cors';
import type { Card, Game, Hand } from './types.js';
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
    res.status(201).json({gameId, dealersCard: game.dealer?.cards[0], playersHand: game.player[0]});
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

            const value: number = handValue(hand.cards);
            if (value > 21) hand.status = "busted";
            if (value === 21) hand.status = "stood";

            res.status(200).json({ newCard, status: hand.status });
            return;
        }
    }

    res.status(409).json({ error: "No active hand to hit" });
    return;
});

app.post('/games/:gameId/stand', (req: Request<{gameId: string}>, res: Response) => {
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
            hand.status = "stood";
            res.status(200).json();
            return;
        }
    }

    res.status(409).json({ error: "No active hand" });
    return;


});

app.post('/games/:gameId/split', (req: Request<{gameId: string}>, res: Response) => {
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
        if (hand.status == "playing" && hand.cards.length === 2 && hand.cards[0]?.rank === hand.cards[1]?.rank) {
            // creates the new hand
            const newHand: Hand = {cards: [hand.cards.pop()!], status: "playing"}; 

            // deals a new card for the two hands
            hand.cards.push(game.deck.pop()!);
            newHand.cards.push(game.deck.pop()!);

            // checks for blackjack in the two hands
            for (const h of [hand, newHand]) {
                const value = handValue(h.cards);
                if (value === 21) h.status = "stood";
            }
            // adds the new hand to the player
            game.player.push(newHand); 
            
            res.status(200).json({firstHand: hand, secondHand: newHand});
            return;
        }
    }

    res.status(409).json({ error: "No active hand to split" });
    return;
});

app.get('/games/:gameId', (req: Request<{gameId: string}>, res: Response) => {
    const game: Game | undefined = games.get(req.params.gameId);
    if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
    }

    const dealer: Card[] = game.dealer!.isHoleCardHidden ? [game.dealer!.cards[0]!] : game.dealer!.cards;
    res.status(200).json({state: game.state, isHoleCardHidden: game.dealer?.isHoleCardHidden, player: game.player, dealer});
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