import type { Card, Game, Rank, Suit } from "./types.js";

// returns the card value as a number
function cardValue(rank: Rank): number {
    if (!isNaN(Number(rank)) && isFinite(Number(rank))) return Number(rank);
    if (rank === "A") return 11;
    return 10;
}

// generates an unshuffled deck containing all 52 cards
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

// returns a shuffled copy of the given Card array
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]; 
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  
  return shuffled;
}

// initializes a round
export function initializeRound(game: Game): Game {
    game.state = "player-turn";
    
    game.player = [{cards: [game.deck.pop()!], status: "playing"}]; // handing the player his first card
    game.dealer = {cards: [game.deck.pop()!], isHoleCardHidden: true, status: "playing"}; // handing the dealer his first card
    game.player[0]?.cards.push(game.deck.pop()!); // handing the player his second card
    game.dealer.cards.push(game.deck.pop()!); // handing the dealer his second card

    if (handValue(game.player[0]!.cards) === 21) game.player[0]!.status = "blackjack"; // checks if the player got a blackjack
    if (handValue(game.dealer.cards) === 21) game.dealer.status = "blackjack"; // checks if the dealer got a blackjack\

    return game;
}

// initiliaze the game object with the shuffled deck, player's hand and the dealers hand
export function initializeGame(): Game {
    let game: Game = {
        deck: shuffleDeck(generateDeck()),
        player: [],
        dealer: undefined,
        state: "player-turn"
    }
    
    game = initializeRound(game);
    return game;
}

// returns the value of a given hand
export function handValue(cards: Card[]): number {
    let aceCount = 0;
    let value = 0;

    // accumulating all the crads' values
    cards.forEach(card => {
        if (card.rank === "A") aceCount++;
        value += card.value;
    });

    // downgrading aces' values if the total value goes over 21
    for (let i = 0; i < aceCount; i++) {
        if (value > 21) value -= 10;
    }

    return value;
}

// dealer play startegy - hits on anything below 17
export function dealerPlay(game: Game) {
    game.dealer!.isHoleCardHidden = false;
    while (handValue(game.dealer!.cards) < 17) {
        game.dealer!.cards.push(game.deck.pop()!);
    }
    
    if (game.dealer!.status !== "blackjack") {
        game.dealer!.status = handValue(game.dealer!.cards) > 21 ? "busted" : "stood";
    }
}

// advances the game state if it should be advanced
export function advanceGameState(game: Game) {
    if (game.state === "player-turn" && game.player.every(hand => hand.status !== "playing")) {
        game.state = "dealer-turn";
        dealerPlay(game);
        game.state = "round-over";        
    }
}