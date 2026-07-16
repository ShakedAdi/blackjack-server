import type { Game } from "./types.js";

const games = new Map<string, Game>();

export function saveGame(gameId: string, game: Game): void {
    games.set(gameId, game);
}

export function getGame(gameId: string): Game | undefined {
    return games.get(gameId);
}

export function getAllGames(): Record<string, Game> {
    return Object.fromEntries(games);
}