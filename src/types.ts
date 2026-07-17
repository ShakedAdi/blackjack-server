export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type HandStatus = "playing" | "stood" | "busted" | "blackjack";

export interface Card {
    readonly rank: Rank,
    readonly suit: Suit,
    readonly value: number,
}

export interface Hand {
    cards: Card[],
    status: HandStatus,
    bet: number,
    outcome?: "win" | "loss" | "push"
}

export interface DealerHand {
    cards: Card[],
    isHoleCardHidden: boolean,
    status: HandStatus
}

export interface Game {
    deck: Card[],
    player: Hand[],
    dealer: DealerHand,
    state: "player-turn" | "dealer-turn" | "round-over",
    balance: number
}

export interface BetRequest {
    bet: number
}
