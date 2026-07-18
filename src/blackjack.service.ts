import type { BetValidationError, Card, DealerHand, Game, Hand } from "./types.js";
import { GameState, HandOutcome, HandStatus, Rank, Suit } from "./types.js";
import { BLACKJACK_PAYOUT_MULTIPLIER, BLACKJACK_VALUE, DEALER_STAND_THRESHOLD, STARTING_BALANCE, WIN_PAYOUT_MULTIPLIER } from "./constants.js";

// returns the card value as a number
function cardValue(rank: Rank): number {
    if (!isNaN(Number(rank)) && isFinite(Number(rank))) return Number(rank);
    if (rank === Rank.Ace) return 11;
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
    const ranks = Object.values(Rank);
    const suits = Object.values(Suit);

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
    
    game.state = GameState.PlayerTurn;
    game.balance -= bet;

    // handing the player a card, then the dealer a card, then again to the player, then again to the dealer
    const playerHand: Hand = { cards: [popCard(game.deck)], status: HandStatus.Playing, bet };
    const dealerHand: DealerHand = { cards: [popCard(game.deck)], isHoleCardHidden: true, status: HandStatus.Playing };
    playerHand.cards.push(popCard(game.deck));
    dealerHand.cards.push(popCard(game.deck));

    // check if the player or the dealer got a black jack and update the hand status
    if (handValue(playerHand.cards) === BLACKJACK_VALUE) playerHand.status = HandStatus.Blackjack;
    if (handValue(dealerHand.cards) === BLACKJACK_VALUE) dealerHand.status = HandStatus.Blackjack;

    game.player = [playerHand];
    game.dealer = dealerHand;

    return game;
}

// initiliaze the game object with the shuffled deck, player's hand and the dealers hand
export function initializeGame(bet: number): Game {
    let game: Game = {
        deck: [],
        player: [],
        dealer: { cards: [], isHoleCardHidden: true, status: HandStatus.Playing }, // placeholder, replaced by initializeRound below
        state: GameState.PlayerTurn,
        balance: STARTING_BALANCE
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
        if (card.rank === Rank.Ace) aceCount++;
        value += card.value;
    });

    // downgrading aces' values if the total value goes over 21
    for (let i = 0; i < aceCount; i++) {
        if (value > BLACKJACK_VALUE) value -= 10;
    }

    return value;
}

// determines a hand's status after a card is dealt during the player's turn
export function resolveHandStatus(cards: Card[]): typeof HandStatus.Playing | typeof HandStatus.Stood | typeof HandStatus.Busted {
    const value = handValue(cards);
    if (value > BLACKJACK_VALUE) return HandStatus.Busted;
    if (value === BLACKJACK_VALUE) return HandStatus.Stood;
    return HandStatus.Playing;
}

// dealer play startegy - hits on anything below 17
export function dealerPlay(game: Game) {
    game.dealer.isHoleCardHidden = false;
    while (handValue(game.dealer.cards) < DEALER_STAND_THRESHOLD) {
        game.dealer.cards.push(popCard(game.deck));
    }

    if (game.dealer.status !== HandStatus.Blackjack) {
        game.dealer.status = handValue(game.dealer.cards) > BLACKJACK_VALUE ? HandStatus.Busted : HandStatus.Stood;
    }
}

// settles the bet according to the game result
function resolveBets(game: Game): void {
    const dealer = game.dealer;

    for (const hand of game.player) {
        if (dealer.status === HandStatus.Blackjack) {
            if (hand.status === HandStatus.Blackjack) {
                hand.outcome = HandOutcome.Push;
                game.balance += hand.bet;
            } else {
                hand.outcome = HandOutcome.Loss;
            }
            continue;
        }

        if (hand.status === HandStatus.Busted) {
            hand.outcome = HandOutcome.Loss;
        } else if (hand.status === HandStatus.Blackjack) {
            hand.outcome = HandOutcome.Win;
            game.balance += hand.bet * BLACKJACK_PAYOUT_MULTIPLIER;
        } else if (dealer.status === HandStatus.Busted || handValue(hand.cards) > handValue(dealer.cards)) {
            hand.outcome = HandOutcome.Win;
            game.balance += hand.bet * WIN_PAYOUT_MULTIPLIER;
        } else if (handValue(hand.cards) === handValue(dealer.cards)) {
            hand.outcome = HandOutcome.Push;
            game.balance += hand.bet;
        } else {
            hand.outcome = HandOutcome.Loss;
        }
    }
}

// advances the game state if it should be advanced
export function advanceGameState(game: Game) {
    if (game.state === GameState.PlayerTurn &&
        (game.dealer.status === HandStatus.Blackjack || game.player.every(hand => hand.status !== HandStatus.Playing))) {
        game.state = GameState.DealerTurn;
        dealerPlay(game);
        resolveBets(game);
        game.state = GameState.RoundOver;        
    }
}

// returns an error describing why the bet is invalid, otherwise undefined
export function getBetValidationError(balance: number, bet: number): BetValidationError | undefined {
    if (!Number.isFinite(bet) || bet <= 0) return { status: 400, message: "Bet must be a positive number" };
    if (bet > balance) return { status: 409, message: "Insufficient balance for this bet" };
    return undefined;
}