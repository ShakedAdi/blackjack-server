type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type HandStatus = "playing" | "stood" | "busted" | "blackjack";

export interface Card {
    readonly id: number,
    readonly rank: Rank,
    readonly suit: Suit,
    readonly value: number,
}

export interface Hand {
    cards: Card[],
    status: HandStatus
}

export interface DealerHand {
    cards: Card[],
    isHoleCardHidden: boolean,
    status: HandStatus
}

export interface Game {
    player: Hand[],
    dealer: DealerHand | undefined,
    state: "player-turn" | "dealer-turn" | "round-over"
}