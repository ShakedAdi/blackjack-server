type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type HandStatus = "playing" | "stood" | "busted" | "blackjack";

export interface Card {
    id: number,
    rank: Rank,
    suit: Suit,
    value: number,
}

export interface Hand {
    readonly id: number,
    cards: Card[],
    status: HandStatus
}

export interface DealerHand {
    cards: Card[],
    isHoleCardHidden: boolean,
    status: HandStatus
}

export interface Game {
    readonly id: number,
    player: Hand[],
    dealer: DealerHand,
    state: "player-turn" | "dealer-turn" | "round-over"
}