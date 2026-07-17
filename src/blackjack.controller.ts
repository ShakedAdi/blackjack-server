import type { Request, Response } from 'express';
import type { BetRequest, Card, Game, Hand } from './types.js';
import { randomUUID } from 'node:crypto';
import { advanceGameState, first, getBetValidationError, handValue, initializeGame, initializeRound, popCard } from './blackjack.service.js';
import { getGame, saveGame, getAllGames } from './blackjack.store.js';

export function createGame(req: Request<unknown, unknown, BetRequest>, res: Response): void {
    const { bet } = req.body;
    const error = getBetValidationError(1000, bet);
    if (error) {
        res.status(error === "Insufficient balance for this bet" ? 409 : 400).json({ error });
        return;
    }

    const gameId = randomUUID();
    const game: Game = initializeGame(bet);
    saveGame(gameId, game);
    advanceGameState(game);
    res.status(201).json({ gameId, dealersCard: first(game.dealer.cards), playersHand: first(game.player), balance: game.balance });
}

export function newRound(req: Request<{ gameId: string }, unknown, BetRequest>, res: Response): void {
    let game = getGame(req.params.gameId);
    if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
    }
    if (game.state !== "round-over") {
        res.status(409).json({ error: "The round is not over" });
        return;
    }

    const { bet } = req.body;
    const error = getBetValidationError(game.balance, bet);
    if (error) {
        res.status(error === "Insufficient balance for this bet" ? 409 : 400).json({ error });
        return;
    }

    game = initializeRound(game, bet);
    saveGame(req.params.gameId, game);
    advanceGameState(game);
    res.status(201).json({ dealersCard: first(game.dealer.cards), playersHand: first(game.player), balance: game.balance });
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
            const newCard: Card = popCard(game.deck);
            hand.cards.push(newCard);
            const value = handValue(hand.cards);
            if (value > 21) hand.status = "busted";
            if (value === 21) hand.status = "stood";
            advanceGameState(game);
            res.status(200).json({ newCard, status: hand.status });
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
            advanceGameState(game);
            res.status(200).json();
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
            const error = getBetValidationError(game.balance, hand.bet);
            if (error) {
                res.status(409).json({ error: "Insufficient balance to split" });
                return;
            }
            game.balance -= hand.bet;

            const newHand: Hand = { cards: [popCard(hand.cards)], status: "playing", bet: hand.bet };
            hand.cards.push(popCard(game.deck));
            newHand.cards.push(popCard(game.deck));
            for (const h of [hand, newHand]) {
                const value = handValue(h.cards);
                if (value === 21) h.status = "stood";
            }
            game.player.push(newHand);
            advanceGameState(game);
            res.status(200).json({ firstHand: hand, secondHand: newHand });
            return;
        }
    }
    res.status(409).json({ error: "No active hand to split" });
}

export function double(req: Request<{ gameId: string }>, res: Response): void {
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
        if (hand.status == "playing" && hand.cards.length === 2) {
            const error = getBetValidationError(game.balance, hand.bet);
            if (error) {
                res.status(409).json({ error: "Insufficient balance to double" });
                return;
            }

            game.balance -= hand.bet;
            hand.bet += hand.bet;

            const newCard: Card = popCard(game.deck);
            hand.cards.push(newCard);
            hand.status = handValue(hand.cards) > 21 ? "busted" : "stood";
            advanceGameState(game);
            res.status(200).json({ newCard, status: hand.status });

            return;
        }
    }
    res.status(409).json({ error: "No active hand to double" });
}

export function getGameState(req: Request<{ gameId: string }>, res: Response): void {
    const game = getGame(req.params.gameId);
    if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
    }
    const dealer: Card[] = game.dealer.isHoleCardHidden ? [first(game.dealer.cards)] : game.dealer.cards;
    res.status(200).json({ state: game.state, isHoleCardHidden: game.dealer.isHoleCardHidden, player: game.player, dealer, balance: game.balance });
}

export function listAllGames(req: Request, res: Response): void {
    res.status(200).json(getAllGames());
}