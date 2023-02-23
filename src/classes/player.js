import client from "../client.js";
import colorSortOrder from "../../colorSortOrder.json" assert { type: "json" };
import valueSortOrder from "../../valueSortOrder.json" assert { type: "json" };

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

class Player {
	constructor(user) {
		this.id = user.id;

		this.toString = user.toString;
		this.username = user.username;

		this.game = user.game;
		this.cards = [];

		this.challenger = false;
		this.challengeTimeout = null;

		this.uno = false;

		this.noneOptions = new StringSelectMenuOptionBuilder().setLabel("None").setValue("none");

		this.gamePanelEmbed = new EmbedBuilder();
		this.gamePanelComponents = [
			new ActionRowBuilder().setComponents([
				new ButtonBuilder().setCustomId("draw").setStyle(ButtonStyle.Primary).setLabel("Draw").setDisabled(true),
				new ButtonBuilder().setCustomId("challenge").setStyle(ButtonStyle.Danger).setLabel("Challenge").setDisabled(true),
				new ButtonBuilder().setCustomId("uno").setStyle(ButtonStyle.Danger).setLabel("Uno!").setDisabled(true),
			]),
			new ActionRowBuilder().setComponents([new StringSelectMenuBuilder().setCustomId("play").setDisabled(true)]),
		];
		this.gamePanel = null;
		this.data = { embeds: [this.gamePanelEmbed], components: this.gamePanelComponents, ephemeral: true };

		this.giveCards(7);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                GENERAL FUNCTIONS                               //
	////////////////////////////////////////////////////////////////////////////////////

	isTurn() {
		// is this player's turn?
		if (this.game.turn == this.game.players.indexOf(this)) return true;
		return false;
	}
	challenge(interaction, challengerPlayer) {
		// challenges the player if he used a wild draw four card
		clearTimeout(challengerPlayer.challengeTimeout);
		challengerPlayer.challenger = false;
		challengerPlayer.disableChallenge();

		if (this.cards.find((c) => c.color == this.game.playedCards[1].color)) {
			this.giveCards(4);
			return this.game.changeTurn(
				interaction,
				0,
				false,
				`${this.username} plays a **${this.game.playedCards[0].name}**.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}\n\n${
					challengerPlayer.username
				} challenges ${this.username} and wins.\n\n${this.username} draws 4 cards.`
			);
		}
		challengerPlayer.giveCards(6);
		return this.game.changeTurn(
			interaction,
			1,
			false,
			`${this.username} plays a **${this.game.playedCards[0].name}**.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}\n\n${
				challengerPlayer.username
			} challenges ${this.username} and loses.\n\n${challengerPlayer.username} draws 6 cards.`
		);
	}
	callUno(interaction) {
		// makes the player call uno
		const firstMustCallUno = this.game.mustCallUno[0];

		if (firstMustCallUno.class.id == this.id) {
			this.uno = true;
			if (firstMustCallUno.turnsPassed == 0) {
				this.greenUno();
				this.disableUno();
				return this.updateGamePanel(interaction, false, false, false, false, null);
			}

			this.game.enableUno = false;
			this.game.disableUnoAll(false);
			this.game.gameEmbed.setDescription(this.game.gameEmbed.data.description + `\n\n${interaction.user.username} calls **UNO!**`);
			this.game.updateGamePanelAll(interaction);
			return this.game.updateMessage(false);
		}

		if (firstMustCallUno.class.uno) return true;

		if (this.game.mustCallUno.length == 1) {
			this.game.enableUno = false;
			this.game.disableUnoAll(false);
		} else {
			this.game.enableUno = false;
			this.game.disableUnoAll([this]);
		}

		this.game.gameEmbed.setDescription(
			this.game.gameEmbed.data.description +
				`\n\n${interaction.user.username} calls **UNO!** before ${firstMustCallUno.class.username}.\n\n${firstMustCallUno.class.username} draws 2 cards.`
		);
		firstMustCallUno.class.giveCards(2);
		this.game.mustCallUno.splice(this.game.mustCallUno.indexOf(firstMustCallUno), 1);
		this.game.updateGamePanelAll(interaction);
		return this.game.updateMessage(false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                PANEL FUNCTIONS                                 //
	////////////////////////////////////////////////////////////////////////////////////

	enableGamePanel() {
		// enables the game panel
		this.gamePanelComponents[0].components[0].setDisabled(false);

		if (this.cards.filter((c) => c.isPlayable()).length > 0) return this.gamePanelComponents[1].components[0].setDisabled(false);
		return this.gamePanelComponents[1].components[0].setDisabled(true);
	}
	disableGamePanel() {
		// disables the game panel
		this.gamePanelComponents[0].components[0].setDisabled(true);

		return this.gamePanelComponents[1].components[0].setDisabled(true);
	}
	enableChallenge() {
		// enables the challenge button
		return this.gamePanelComponents[0].components[1].setDisabled(false);
	}
	disableChallenge() {
		// disables the challenge button
		return this.gamePanelComponents[0].components[1].setDisabled(true);
	}
	enableUno() {
		// enables the uno button
		return this.getUno().setDisabled(false);
	}
	disableUno() {
		// disables the uno button
		return this.getUno().setDisabled(true);
	}
	greenUno() {
		// turns the uno button green
		return this.getUno().setStyle(ButtonStyle.Success);
	}
	redUno() {
		// turns the uno button red
		return this.getUno().setStyle(ButtonStyle.Danger);
	}
	getUno() {
		// returns the uno button
		return this.gamePanelComponents[0].components.find((c) => c.data.custom_id == "uno");
	}
	drawPlayablePanel(card) {
		// changes the panel for draw playable
		this.data.components = [
			new ActionRowBuilder().setComponents([
				new ButtonBuilder()
					.setCustomId(`playDrawed_${card.name.replace(/ /g, "-")}`)
					.setStyle(ButtonStyle.Primary)
					.setEmoji("✅")
					.setLabel("Play"),
				new ButtonBuilder()
					.setCustomId(`keepDrawed_${card.name.replace(/ /g, "-")}`)
					.setStyle(ButtonStyle.Primary)
					.setEmoji("❌")
					.setLabel("Keep"),
			]),
		];

		if (this.cards.length == 2) {
			this.game.mustCallUno.push({ class: this, turnsPassed: 0 });
			this.data.components[0].addComponents(new ButtonBuilder().setCustomId("uno").setStyle(ButtonStyle.Danger).setLabel("Uno!"));
		}

		this.data.files = [client.cards.get(card.name)];

		this.gamePanelEmbed
			.setColor(card.color || this.game.gameEmbed.data.color)
			.setAuthor({ name: "You drew a playable card. Play it or keep it?" })
			.setImage(`attachment://${card.toAttachment()}.png`);
	}
	wildCardGamePanel(card) {
		// changes the panel for wild card
		let cardType;

		if (card.type() == "wild draw four") cardType = "wildDrawFour";
		else cardType = "wild";

		this.data.components = [
			new ActionRowBuilder().setComponents([
				new ButtonBuilder().setCustomId(`${cardType}_Blue`).setStyle(ButtonStyle.Primary).setEmoji("🟦").setLabel("Blue"),
				new ButtonBuilder().setCustomId(`${cardType}_Green`).setStyle(ButtonStyle.Primary).setEmoji("🟩").setLabel("Green"),
				new ButtonBuilder().setCustomId(`${cardType}_Red`).setStyle(ButtonStyle.Primary).setEmoji("🟥").setLabel("Red"),
				new ButtonBuilder().setCustomId(`${cardType}_Yellow`).setStyle(ButtonStyle.Primary).setEmoji("🟨").setLabel("Yellow"),
			]),
		];

		this.data.files = [client.cards.get(card.name)];

		this.gamePanelEmbed.setAuthor({ name: "Choose a color" }).setImage(`attachment://${card.toAttachment()}.png`);
	}
	turnGamePanel() {
		// changes the panel for the turn player
		const playableCards = this.cards.filter((c) => c.isPlayable());

		if (playableCards.length > 0) {
			const options = [];

			for (const card of playableCards) {
				if (options.find((o) => o.data.label == card.name)) continue;
				options.push(new StringSelectMenuOptionBuilder().setLabel(card.name).setValue(card.name));
			}

			this.gamePanelComponents[1].components[0].setPlaceholder("Select a card").setOptions(options);
		} else {
			this.gamePanelComponents[1].components[0].options = [this.noneOptions];

			this.gamePanelComponents[1].components[0].setPlaceholder("You do not have cards to play").setOptions(this.noneOptions);
		}

		return this.enableGamePanel();
	}
	noTurnGamePanel() {
		// changes the panel for non turn players
		this.gamePanelComponents[1].components[0].options = [];

		this.gamePanelComponents[1].components[0].setPlaceholder("It's not your turn").setOptions(this.noneOptions);

		return this.disableGamePanel();
	}
	challengerGamePanel() {
		// changes the panel for challenger
		if (this.game.mustCallUno.length > 0) return this.enableUno();
		return this.enableChallenge();
	}
	updateGamePanel(interaction, request, wild, drawPlayable, stop, card) {
		// updates the game panel
		if (request) {
			if (this.gamePanel?.interaction)
				this.gamePanel.interaction
					.editReply({ embeds: [new EmbedBuilder().setColor(client.clr).setDescription("You requested another game panel.")], components: [] })
					.catch((err) => client.err(err));

			return interaction
				.reply(this.data)
				.then((message) => (this.gamePanel = message))
				.catch((err) => client.err(err));
		}

		if (this.gamePanel?.interaction) return this.gamePanel.interaction.editReply(this.data).catch((err) => client.err(err));
		if (this.gamePanel)
			return this.gamePanel
				.edit(this.data)
				.then((message) => (this.gamePanel = message))
				.catch((err) => client.err(err));

		return true;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                CARDS FUNCTIONS                                 //
	////////////////////////////////////////////////////////////////////////////////////

	playCard(interaction, card) {
		// plays a card
		this.game.playedCards.unshift(card);
		this.removeCard(card);

		switch (card.type()) {
			case "normal":
				this.game.changeTurn(interaction, 0, false, `${this.username} plays a **${card.name}** card.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}`);
				break;
			case "skip":
				this.game.changeTurn(
					interaction,
					1,
					false,
					`${this.username} plays a **${card.name}** card and skips {skippedPlayer}'s turn.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}`
				);
				break;
			case "draw two":
				this.game.changeTurn(
					interaction,
					1,
					true,
					`${this.username} plays a **${card.name}** card.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}\n\n{skippedPlayer} draws 2 cards.`
				);
				break;
			case "reverse":
				if (this.game.players.length == 2) {
					if (this.game.reversed) this.game.reversed = false;

					this.game.changeTurn(
						interaction,
						1,
						false,
						`${this.username} plays a **${card.name}** card and skips {skippedPlayer}'s turn.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}`
					);
				} else {
					this.game.reversed = !this.game.reversed;

					this.game.changeTurn(interaction, 0, false, `${this.username} plays a **${card.name}** card.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}`);
				}
				break;
			case "wild":
				this.game.changeTurn(interaction, 0, false, `${this.username} plays a **${card.name}** card.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}`);
				break;
			case "wild draw four":
				let challengerPlayer = this.game.reversed
					? this.game.players[this.game.turn - 1] || this.game.players[this.game.players.length - 1]
					: this.game.players[this.game.turn + 1] || this.game.players[0];

				this.game.gameEmbed.setDescription(
					`${this.username} plays a **${card.name}**.${this.uno ? `\n\n${this.username} calls **UNO!**` : ""}\n\n Waiting for a challenge from ${
						challengerPlayer.username
					} (changing turn <t:${Math.floor((Date.now() + 6000) / 1000)}:R>)`
				);
				this.game.updateMessage(false);

				this.game.turn = -1;
				challengerPlayer.challenger = true;

				this.updateGamePanel(interaction, false, false, false, false, null);
				challengerPlayer.updateGamePanel(interaction, false, false, false, false, null);

				this.game.turn = this.game.players.indexOf(this);

				challengerPlayer.challengeTimeout = setTimeout(() => {
					challengerPlayer.challenger = false;
					challengerPlayer.disableChallenge();

					this.game.changeTurn(interaction, 1, true, `{skippedPlayer} did not challenge ${this.username} and draws 4 cards.`);
				}, 5000);
				break;
		}

		return true;
	}
	drawCard(interaction, forceDraw) {
		// draws a card
		const mustCallUnoPlayer = this.game.mustCallUno.find((p) => p.class.id == this.id);

		if (!forceDraw) {
			const card = this.game.cards[Math.floor(Math.random() * this.game.cards.length)];

			this.cards.push(card);
			this.game.removeCard(card);

			if (card.isPlayable()) {
				this.drawPlayablePanel(card);
				return this.updateGamePanel(interaction, false, false, true, false, card);
			}
		} else if (mustCallUnoPlayer) {
			this.redUno();
			this.disableUno();
			this.game.mustCallUno.splice(this.game.mustCallUno.indexOf(mustCallUnoPlayer), 1);
		}

		this.sortCards();

		return this.game.changeTurn(interaction, 0, false, `${this.username} draws a card. The last played card was a **${this.game.playedCards[0].name}**`);
	}
	giveCards(cards) {
		// gives the player cards
		for (let i = 0; i < cards; i++) {
			const card = this.game.cards[Math.floor(Math.random() * this.game.cards.length)];

			this.cards.push(card);
			this.game.removeCard(card);

			if (this.game.cards.length == 0) {
				this.game.refillDeck();
			}
		}

		return this.sortCards();
	}
	getCard(cardName) {
		// returns a card form the player's hand
		return this.cards.find((c) => c.name == cardName);
	}
	removeCard(card) {
		// removes a card from the hand
		this.cards.splice(this.cards.indexOf(card), 1);
		return this.sortCards();
	}
	sortCards() {
		// sorts the cards
		this.cards.sort((c1, c2) => {
			return valueSortOrder[c1.value] - valueSortOrder[c2.value];
		});

		return this.cards.sort((c1, c2) => {
			return colorSortOrder[c1.color] - colorSortOrder[c2.color];
		});
	}
	cardsToString() {
		// returns a string with all the cards
		let string = "";

		if (this.isTurn()) {
			for (const card of this.cards) {
				if (card.isPlayable()) string += `**‧ ${card.name}**\n`;
				else string += `‧ ${card.name}\n`;
			}
		} else for (const card of this.cards) string += `‧ ${card.name}\n`;

		return string;
	}
}

export default Player;
