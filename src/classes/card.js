class Card {
	constructor(card, game) {
		const cardArray = card.split(" ");

		this.game = game;

		this.name = card;

		this.color = null;
		this.value = cardArray[cardArray.length - 1];

		this.drawPlayable = false;

		if (!this.type().includes("wild")) this.color = cardArray[0];
	}
	isPlayable() {
		// is the card playable?
		if (this.type().includes("wild")) return true;
		if (this.color == this.game.playedCards[0].color) return true;
		if (this.value == this.game.playedCards[0].value) return true;
		return false;
	}
	type() {
		// returns the type of the card
		if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(this.value)) return "normal";
		if (this.value == "Skip") return "skip";
		if (this.value == "Reverse") return "reverse";
		if (this.value == "Two") return "draw two";
		if (this.value == "Wild") return "wild";
		if (this.value == "Four") return "wild draw four";
	}
	setColor(color) {
		// sets the card color
		this.color = color;
		return (this.name = `${color} ${this.name}`);
	}
	toAttachment() {
		// returns the card to attachment name (replaces the spaces with an empty string)
		return this.name.replace(/ /g, "");
	}
}

export default Card;
