export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export const HandStatus = {
    Playing: "playing",
    Stood: "stood",
    Busted: "busted",
    Blackjack: "blackjack",
} as const;
export type HandStatus = (typeof HandStatus)[keyof typeof HandStatus];

export const GameState = {
    PlayerTurn: "player-turn",
    DealerTurn: "dealer-turn",
    RoundOver: "round-over"
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export const HandOutcome = {
    Win: "win",
    Loss: "loss",
    Push: "push"
} as const;
export type HandOutcome = (typeof HandOutcome)[keyof typeof HandOutcome];

export interface Card {
    readonly rank: Rank,
    readonly suit: Suit,
    readonly value: number,
}

export interface Hand {
    cards: Card[],
    status: HandStatus,
    bet: number,
    outcome?: HandOutcome
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
    state: GameState,
    balance: number
}

export interface BetRequest {
    bet: number
}

export interface BetValidationError {
    status: 400 | 409,
    message: string
}
