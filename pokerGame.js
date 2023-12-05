class Card {
  constructor(suit, rank) {
    this.card = `${rank}_of_${suit}`;
  }
}

class Deck {
  constructor() {
    this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    this.ranks = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'jack',
      'queen',
      'king',
      'ace',
    ];
    this.cards = this.initializeDeck();
    this.shuffleDeck();
  }

  initializeDeck() {
    const deck = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push(new Card(suit, rank));
      }
    }
    return deck;
  }

  shuffleDeck() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealCards(numberOfPlayers, cardsPerHand) {
    const players = new Array(numberOfPlayers).fill([]).map(() => []);
    for (let i = 0; i < cardsPerHand; i++) {
      for (let j = 0; j < numberOfPlayers; j++) {
        const card = this.cards.pop();
        if (card) {
          players[j].push(card);
        }
      }
    }
    return players;
  }
}

export class PokerGame {
  constructor(players, socket, io, room) {
    this.deck = new Deck();
    this.players = players;
    this.cardsPerHand = 2;
    this.communityCards = [];
    this.playerHands = [];
    this.currentRound = 0;
    this.currentBet = 0;
    this.playerBets = new Array(this.players.length).fill(0);
    this.socket = socket;
    this.io = io;
    this.room = room;
  }

  startRound() {
    console.log(`Round ${this.currentRound + 1} started.`);
    this.playerHands = this.deck.dealCards(
      this.players.length,
      this.cardsPerHand
    );

    this.playerHands.forEach((cards, index) => {
      this.io.to(this.players[index]).emit('dealingResult', cards);
    });

    this.currentRound++;
  }

  startBettingRound() {
    console.log('Betting Round started.');
    this.playerBets = new Array(this.players.length).fill(10);
  }

  dealFlop() {
    console.log('Dealing Flop.');
    this.communityCards = this.communityCards.concat(
      this.deck.dealCards(this.players.length, 3)[0]
    );

    this.io.to(this.room).emit('flop', this.communityCards);
  }

  dealTurn() {
    console.log('Dealing Turn.');
    this.communityCards = this.communityCards.concat(
      this.deck.dealCards(this.players.length, 1)[0]
    );

    this.io.to(this.room).emit('turn', this.communityCards);
  }

  dealRiver() {
    console.log('Dealing River.');
    this.communityCards = this.communityCards.concat(
      this.deck.dealCards(this.players.length, 1)[0]
    );

    this.io.to(this.room).emit('river', this.communityCards);
  }

  startFinalBettingRound() {
    console.log('Final Betting Round started.');
    this.playerBets = new Array(this.players.length).fill(10);
  }

  showdown() {
    console.log('Showdown!');
    const winnerIndex = this.playerBets.indexOf(Math.max(...this.playerBets));
    console.log(`Player ${winnerIndex + 1} wins the game!`);
  }

  playGame() {
    this.startRound();
    this.startBettingRound();
    this.dealFlop();
    this.startBettingRound();
    this.dealTurn();
    this.startBettingRound();
    this.dealRiver();
    this.startFinalBettingRound();
    this.showdown();
  }
}
