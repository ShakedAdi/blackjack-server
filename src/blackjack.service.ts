import type { Card, DealerHand, Game, Hand, Rank, Suit } from "./types.js";

// returns the card value as a number
function cardValue(rank: Rank): number {
    if (!isNaN(Number(rank)) && isFinite(Number(rank))) return Number(rank);
    if (rank === "A") return 11;
    return 10;
}

// pops the top card off an array of cards, throwing if none remain
export function popCard(cards: Card[]): Card {
    const card = cards.pop();
    if (!card) throw new Error("Cannot draw a card: array is empty");
    return card;
}

// returns the first element of an array, throwing if it's empty
export function first<T>(items: T[]): T {
    const item = items[0];
    if (item === undefined) throw new Error("Expected a non-empty array");
    return item;
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
    game.deck = shuffleDeck(generateDeck());
    
    game.state = "player-turn";
    game.balance -= bet;

    const playerHand: Hand = { cards: [popCard(game.deck)], status: "playing", bet }; // handing the player his first card
    const dealerHand: DealerHand = { cards: [popCard(game.deck)], isHoleCardHidden: true, status: "playing" }; // handing the dealer his first card
    playerHand.cards.push(popCard(game.deck)); // handing the player his second card
    dealerHand.cards.push(popCard(game.deck)); // handing the dealer his second card

    if (handValue(playerHand.cards) === 21) playerHand.status = "blackjack"; // checks if the player got a blackjack
    if (handValue(dealerHand.cards) === 21) dealerHand.status = "blackjack"; // checks if the dealer got a blackjack

    game.player = [playerHand];
    game.dealer = dealerHand;

    return game;
}

// initiliaze the game object with the shuffled deck, player's hand and the dealers hand
export function initializeGame(bet: number): Game {
    let game: Game = {
        deck: [],
        player: [],
        dealer: { cards: [], isHoleCardHidden: true, status: "playing" }, // placeholder, replaced by initializeRound below
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

// determines a hand's status after a card is dealt during the player's turn
export function resolveHandStatus(cards: Card[]): "playing" | "stood" | "busted" {
    const value = handValue(cards);
    if (value > 21) return "busted";
    if (value === 21) return "stood";
    return "playing";
}

// returns the hand currently awaiting player action, if any
export function getActiveHand(game: Game): Hand | undefined {
    return game.player.find(hand => hand.status === "playing");
}

// dealer play startegy - hits on anything below 17
export function dealerPlay(game: Game) {
    game.dealer.isHoleCardHidden = false;
    while (handValue(game.dealer.cards) < 17) {
        game.dealer.cards.push(popCard(game.deck));
    }

    if (game.dealer.status !== "blackjack") {
        game.dealer.status = handValue(game.dealer.cards) > 21 ? "busted" : "stood";
    }
}

// settles the bet according to the game result
function resolveBets(game: Game): void {
    const dealer = game.dealer;

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
        (game.dealer.status === "blackjack" || game.player.every(hand => hand.status !== "playing"))) {
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