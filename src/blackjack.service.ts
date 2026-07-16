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
export function initializeRound(game: Game, bet: number): Game {
    game.state = "player-turn";
        game.balance -= bet;

    game.player = [{cards: [game.deck.pop()!], status: "playing", bet}]; // handing the player his first card
    game.dealer = {cards: [game.deck.pop()!], isHoleCardHidden: true, status: "playing"}; // handing the dealer his first card
    game.player[0]?.cards.push(game.deck.pop()!); // handing the player his second card
    game.dealer.cards.push(game.deck.pop()!); // handing the dealer his second card

    if (handValue(game.player[0]!.cards) === 21) game.player[0]!.status = "blackjack"; // checks if the player got a blackjack
    if (handValue(game.dealer.cards) === 21) game.dealer.status = "blackjack"; // checks if the dealer got a blackjack\

    return game;
}

// initiliaze the game object with the shuffled deck, player's hand and the dealers hand
export function initializeGame(bet: number): Game {
    let game: Game = {
        deck: shuffleDeck(generateDeck()),
        player: [],
        dealer: undefined,
        state: "player-turn",
        balance: 1000
    }
    
    game = initializeRound(game, bet);
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

// settles the bet according to the game result
function resolveBets(game: Game): void {
    const dealer = game.dealer!;

    for (const hand of game.player) {
        if (dealer.status === "blackjack") {
            if (hand.status === "blackjack") {
                hand.outcome = "push";
                game.balance += hand.bet;
            } else {
                hand.outcome = "loss";
            }
            continue;
        }

        if (hand.status === "busted") {
            hand.outcome = "loss";
        } else if (hand.status === "blackjack") {
            hand.outcome = "win";
            game.balance += hand.bet * 2.5;
        } else if (dealer.status === "busted" || handValue(hand.cards) > handValue(dealer.cards)) {
            hand.outcome = "win";
            game.balance += hand.bet * 2;
        } else if (handValue(hand.cards) === handValue(dealer.cards)) {
            hand.outcome = "push";
            game.balance += hand.bet;
        } else {
            hand.outcome = "loss";
        }
    }
}

// advances the game state if it should be advanced
export function advanceGameState(game: Game) {
    if (game.state === "player-turn" &&
        (game.dealer!.status === "blackjack" || game.player.every(hand => hand.status !== "playing"))) {
        game.state = "dealer-turn";
        dealerPlay(game);
        resolveBets(game);
        game.state = "round-over";        
    }
}

// returns an error message if the bet is invalid, otherwise undefined
export function getBetValidationError(balance: number, bet: number): string | undefined {
    if (!Number.isFinite(bet) || bet <= 0) return "Bet must be a positive number";
    if (bet > balance) return "Insufficient balance for this bet";
    return undefined;
}