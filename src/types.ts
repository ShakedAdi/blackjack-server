export const Suit = {
    Spades: "spades",
    Hearts: "hearts",
    Diamonds: "diamonds",
    Clubs: "clubs",
} as const;
export type Suit = (typeof Suit)[keyof typeof Suit];

export const Rank = {
    Two: "2",
    Three: "3",
    Four: "4",
    Five: "5",
    Six: "6",
    Seven: "7",
    Eight: "8",
    Nine: "9",
    Ten: "10",
    Jack: "J",
    Queen: "Q",
    King: "K",
    Ace: "A",
} as const;
export type Rank = (typeof Rank)[keyof typeof Rank];

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
