import React, { Component } from 'react';
import './Deck.css';
import Card from '../Card/Card';

/**
 * It receive 2 object.
 * trumpCard : {
 *  value: [1..10]
 *  suit: [0-3]
 * }
 * deck: [] <- remainig cards
 */
class Deck extends Component {
  render() {
    return (
      <div className="Deck">
        <div className="Deck-ActualDeck">
          <p className="Deck-ActualDeck__p">Card left {this.props.cardLeft} </p>
        </div>
        <Card 
          value={this.props.trumpCard.value}
          suit={this.props.trumpCard.suit}
        />
        <div className="Deck-ActualDeck">
          <p className="Deck-ActualDeck__p">Discarded cards {this.props.discardedCards}</p>
        </div>
      </div>
    );
  }
}

export default Deck;
