import type { Card, Rank, Suit } from "./types.js";

function cardValue(rank: Rank): number {
    if (!isNaN(Number(rank)) && isFinite(Number(rank))) return Number(rank);
    if (rank === "A") return 11;
    return 10;
}

export function generateDeck(): Card[] {
    let cards: Card[] = [];
    const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const suits: Suit[] = ["clubs", "diamonds", "hearts", "spades"];

    ranks.forEach(rank => {
        const value: number = cardValue(rank);
        suits.forEach(suit => {
            cards.push({rank, suit, value});
        });
    });

    return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]; 
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  
  return shuffled;
}