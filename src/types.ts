type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type HandStatus = "playing" | "stood" | "busted" | "blackjack";

export interface Card {
    id: number,
    rank: Rank,
    suit: Suit,
    value: number,
    cardPath: string
}

export interface Hand {
    id: number,
    cards: Card[],
    status: HandStatus
}

export interface DealerHand {
    cards: Card[],
    isHoleCardHidden: boolean,
    status: HandStatus
}