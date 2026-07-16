import type { Request, Response } from 'express';
import type { Card, Game, Hand } from './types.js';
import { randomUUID } from 'node:crypto';
import { advanceGameState, handValue, initializeGame } from './blackjack.service.js';
import { getGame, saveGame, getAllGames } from './blackjack.store.js';

export function createGame(req: Request, res: Response): void {
    const gameId = randomUUID();
    const game: Game = initializeGame();
    saveGame(gameId, game);
    res.status(201).json({ gameId, dealersCard: game.dealer?.cards[0], playersHand: game.player[0] });
    advanceGameState(game);
}

export function hit(req: Request<{ gameId: string }>, res: Response): void {
    const game = getGame(req.params.gameId);
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
            const value = handValue(hand.cards);
            if (value > 21) hand.status = "busted";
            if (value === 21) hand.status = "stood";
            res.status(200).json({ newCard, status: hand.status });
            advanceGameState(game);
            return;
        }
    }
    res.status(409).json({ error: "No active hand to hit" });
}

export function stand(req: Request<{ gameId: string }>, res: Response): void {
    const game = getGame(req.params.gameId);
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
            advanceGameState(game);
            return;
        }
    }
    res.status(409).json({ error: "No active hand" });
}

export function split(req: Request<{ gameId: string }>, res: Response): void {
    const game = getGame(req.params.gameId);
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
            const newHand: Hand = { cards: [hand.cards.pop()!], status: "playing" };
            hand.cards.push(game.deck.pop()!);
            newHand.cards.push(game.deck.pop()!);
            for (const h of [hand, newHand]) {
                const value = handValue(h.cards);
                if (value === 21) h.status = "stood";
            }
            game.player.push(newHand);
            res.status(200).json({ firstHand: hand, secondHand: newHand });
            advanceGameState(game);
            return;
        }
    }
    res.status(409).json({ error: "No active hand to split" });
}

export function getGameState(req: Request<{ gameId: string }>, res: Response): void {
    const game = getGame(req.params.gameId);
    if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
    }
    const dealer: Card[] = game.dealer!.isHoleCardHidden ? [game.dealer!.cards[0]!] : game.dealer!.cards;
    res.status(200).json({ state: game.state, isHoleCardHidden: game.dealer?.isHoleCardHidden, player: game.player, dealer });
}

export function listAllGames(req: Request, res: Response): void {
    res.status(200).json(getAllGames());
}