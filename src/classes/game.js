import User from "./user.js";
import Card from "./card.js";
import Player from "./player.js";
import client from "../client.js";
import defaultData from "./defaultData.js";
import pack from "../../pack.json" assert { type: "json" };

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, time } from "discord.js";

class Game {
	constructor(interaction) {
		this.id = interaction.channel.id;

		this.channel = interaction.channel;

		this.maxPlayers = interaction.options.getInteger("players") || 10;
		this.hostId = interaction.user.id;

		this.locked = false;
		this.started = false;
		this.loading = false;

		this.users = [];
		this.players = [];
		this.banned = [];

		this.mustCallUno = [];
		this.enableUno = false;

		this.reversed = false;
		this.turn = 0;

		this.cards = [];
		this.playedCards = [];

		this.noneOption = new StringSelectMenuOptionBuilder().setLabel("None").setValue("none");

		this.gameEmbed = EmbedBuilder.from(defaultData.gameEmbed);
		this.gameComponents = [
			new ActionRowBuilder().setComponents([
				new ButtonBuilder().setCustomId("ready").setLabel("Ready").setStyle(ButtonStyle.Success).setDisabled(true),
				new ButtonBuilder().setCustomId("join").setLabel("Join").setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId("leave").setLabel("Leave").setStyle(ButtonStyle.Primary),
			]),
			new ActionRowBuilder().setComponents([new ButtonBuilder().setCustomId("controlPanel").setLabel("Request Control Panel").setStyle(ButtonStyle.Danger)]),
		];
		this.currentMessage = null;
		this.gameData = { embeds: [this.gameEmbed], components: this.gameComponents, files: [] };

		this.controlPanelEmbed = new EmbedBuilder().setColor(client.clr).setDescription(`Here you have everything you need to manage the game.`);
		this.controlPanelComponents = [
			new ActionRowBuilder().setComponents(
				new ButtonBuilder().setCustomId("kick").setLabel("Kick").setStyle(ButtonStyle.Danger).setDisabled(true), // ❌
				new ButtonBuilder().setCustomId("ban").setLabel("Ban").setStyle(ButtonStyle.Danger).setDisabled(true), // ⛔️
				new ButtonBuilder().setCustomId("unban").setLabel("Unban").setStyle(ButtonStyle.Danger).setDisabled(true), //✅
				new ButtonBuilder().setCustomId("lock").setLabel("Lock").setStyle(ButtonStyle.Danger).setDisabled(true), // 🔒
				new ButtonBuilder().setCustomId("change").setLabel("Change Host").setStyle(ButtonStyle.Danger).setDisabled(true) // 🔄
			),
			new ActionRowBuilder().setComponents(new StringSelectMenuBuilder().setCustomId("none").setOptions(this.noneOption).setDisabled(true)),
		];
		this.controlPanel = null;
		this.controlPanelData = { embeds: [this.controlPanelEmbed], components: this.controlPanelComponents, ephemeral: true };

		client.games.set(this.id, this);
		new User(interaction);

		interaction.reply({ content: "game created!", ephemeral: true }).catch((err) => client.err(err));
		setTimeout(() => interaction.deleteReply(), 2500);

		this.updateMessage(true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                GENERAL FUNCTIONS                               //
	////////////////////////////////////////////////////////////////////////////////////

	updateMessage(newMessage) {
		// updates the game message
		if (newMessage)
			return this.channel
				.send(this.gameData)
				.then((message) => (this.currentMessage = message))
				.catch((err) => client.err(err));

		if (this.currentMessage)
			return this.currentMessage
				.edit(this.gameData)
				.then((message) => (this.currentMessage = message))
				.catch((err) => client.err(err));

		return this.channel
			.send(this.gameData)
			.then((message) => (this.currentMessage = message))
			.catch((err) => client.err(err));
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                 LOBBY FUNCTIONS                                //
	////////////////////////////////////////////////////////////////////////////////////

	updateControlPanel(interaction, request, disable, disableMessage) {
		// updates the control panel
		if (disable) {
			if (this.controlPanel?.interaction)
				return this.controlPanel.interaction
					.editReply({
						embeds: [new EmbedBuilder().setColor(client.clr).setDescription(disableMessage)],
						components: [],
					})
					.catch((err) => client.err(err));
			return true;
		}

		if (request) {
			if (this.controlPanel?.interaction)
				this.controlPanel.interaction
					.editReply({
						embeds: [new EmbedBuilder().setColor(client.clr).setDescription("You requested another control panel.")],
						components: [],
					})
					.catch((err) => client.err(err));
			return interaction
				.reply(this.controlPanelData)
				.then((message) => (this.controlPanel = message))
				.catch((err) => client.err(err));
		}

		if (this.controlPanel?.interaction) return this.controlPanel.interaction.editReply(this.controlPanelData).catch((err) => client.err(err));
		if (this.gamePanel)
			return this.gamePanel
				.edit(this.controlPanelData)
				.then((message) => (this.gamePanel = message))
				.catch((err) => client.err(err));
	}
	updateButtons(bool) {
		// updates the control panel buttons
		this.controlPanelComponents[0].components[0].setDisabled(bool);
		this.controlPanelComponents[0].components[1].setDisabled(bool);
		this.controlPanelComponents[0].components[3].setDisabled(bool);
		this.controlPanelComponents[0].components[4].setDisabled(bool);

		return true;
	}
	updateMenu(type) {
		// updates the control panel menu
		const menu = this.controlPanelComponents[1].components[0];

		switch (type) {
			case "skick":
				menu
					.setCustomId("skick")
					.setPlaceholder(`${this.users.length == 1 ? "No users to kick" : "Select a user to kick"}`)
					.setOptions(this.usersToOptions(0));
				break;
			case "sban":
				menu
					.setCustomId("sban")
					.setPlaceholder(`${this.users.length == 1 ? "No users to ban" : "Select a user to ban"}`)
					.setOptions(this.usersToOptions(0));
				break;
			case "schange":
				menu
					.setCustomId("schange")
					.setPlaceholder(`${this.users.length == 1 ? "No users to make host" : "Select a user to make host"}`)
					.setOptions(this.usersToOptions(0));
				break;
			case "sunban":
				menu
					.setCustomId("sunban")
					.setPlaceholder(`${this.banned.length == 0 ? "No users to unban" : "Select a user to unban"}`)
					.setOptions(this.usersToOptions(1));
				break;
		}

		return menu;
	}
	lock() {
		// locks or unlocks the game
		if (this.locked) {
			this.locked = false;
			this.controlPanelComponents[0].components[3].setLabel("Lock");
			this.setEvent(`The game has been unlocked.`);
		} else {
			this.locked = true;
			this.controlPanelComponents[0].components[3].setLabel("Unlock");
			this.setEvent(`The game has been locked.`);
		}

		this.gameEmbed.setFields(this.usersToField());

		this.updateControlPanel(null, false, false, false);
		return this.updateMessage(false);
	}
	setEvent(event) {
		// sets an event
		return this.gameEmbed.setDescription(`${event}\n\n${defaultData.gameInfo}`);
	}
	removeEvent() {
		// removes the event
		return this.gameEmbed.setDescription(defaultData.gameInfo);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                 GAME FUNCTIONS                                 //
	////////////////////////////////////////////////////////////////////////////////////

	load() {
		// loads the game when everyone's ready
		this.loading = true;

		this.gameEmbed.setDescription(`All the players are ready. The games starts in <t:${Math.floor((Date.now() + 6000) / 1000)}:R>`).setFields(this.usersToField());
		this.updateMessage(false);

		let timePast = 0;
		let lastPlayers = this.users.length;

		let int = setInterval(() => {
			if (this.users.length != lastPlayers) {
				this.loading = false;

				this.setEvent(`The game stopped because someone joined/left`);

				for (const user of this.users) user.isReady = false;
				this.gameEmbed.setFields(this.usersToField());

				this.updateMessage(false);
				return clearInterval(int);
			}
			if (this.users.find((u) => !u.isReady)) {
				this.loading = false;

				this.setEvent(`The game stopped because someone is not ready anymore.`);
				this.gameEmbed.setFields(this.usersToField());
				this.updateMessage(false);
				return clearInterval(int);
			}
			if (timePast == 4) {
				this.loading = false;

				for (const user of this.users) user.isReady = false;

				this.start();
				return clearInterval(int);
			}
			timePast++;
		}, 1000);
	}
	start() {
		// starts the game
		this.started = true;

		this.refillDeck();

		const normalCards = this.cards.filter((c) => c.type() == "normal");

		this.playedCards.unshift(normalCards[Math.floor(Math.random() * normalCards.length)]);
		this.removeCard(this.playedCards[0]);

		this.updateControlPanel(null, false, true, "The game has started.");

		for (const user of this.users) this.players.push(new Player(user));

		this.gameData.files = [client.cards.get(this.playedCards[0].name)];
		this.gameEmbed
			.setColor(Colors[this.playedCards[0].color])
			.setDescription(`All the players received 7 cards. The top card of the deck was flipped over: **${this.playedCards[0].name}**.`)
			.setThumbnail(`attachment://${this.playedCards[0].toAttachment()}.png`)
			.setFields(this.playersToField());
		this.gameComponents[0].setComponents([new ButtonBuilder().setCustomId("gamePanel").setLabel("Request Game Panel").setStyle(ButtonStyle.Danger)]);
		this.gameComponents.pop();

		this.updateMessage(false);
		return this.loadGamePanelAll();
	}
	changeTurn(interaction, skip, giveCards, message) {
		// changes the turn
		let skippedPlayer;

		if (this.reversed) {
			if (this.turn - skip == 0) this.turn = this.players.length - 1;
			else if (this.turn - skip == -1) this.turn = this.players.length - 2;
			else this.turn -= 1 - skip;

			skippedPlayer = this.players[this.turn + 1] || this.players[0];
		} else {
			if (this.turn + skip == this.players.length - 1) this.turn = 0;
			else if (this.turn + skip == this.players.length) this.turn = 1;
			else this.turn += 1 + skip;

			skippedPlayer = this.players[this.turn - 1] || this.players[this.players.length - 1];
		}

		if (this.mustCallUno.length > 0) {
			for (const player of this.mustCallUno) {
				if (player.class.cards.length > 2 || player.turnsPassed == 1) {
					if (this.enableUno && this.mustCallUno.length == 1) {
						this.enableUno = false;
						this.disableUnoAll(false);
					}
					this.mustCallUno.splice(this.mustCallUno.indexOf(player), 1);
				} else {
					if (player.class.uno) {
						player.class.uno = false;
						player.class.redUno();
						if (this.mustCallUno.length == 1 && this.enableUno) {
							this.enableUno = false;
							this.disableUnoAll(false);
						}
						this.mustCallUno.splice(this.mustCallUno.indexOf(player), 1);
					} else {
						player.turnsPassed++;
						if (!this.enableUno) {
							this.enableUno = true;
							this.enableUnoAll(false);
						}
					}
				}
			}
		} else {
			if (this.enableUno) {
				this.enableUno = false;
				this.disableUnoAll();
			}
		}

		if (this.players[this.turn].cards.length == 2 && this.players[this.turn].cards.find((c) => c.isPlayable())) {
			this.players[this.turn].enableUno();
			this.mustCallUno.push({ class: this.players[this.turn], turnsPassed: 0 });
		}

		if (giveCards) {
			if (this.playedCards[0].type() == "draw two") skippedPlayer.giveCards(2);
			else if (this.playedCards[0].type() == "wild draw four") skippedPlayer.giveCards(4);
		}

		message = message.replace(/{skippedPlayer}/g, skippedPlayer.username);
		this.gameData.files = [client.cards.get(this.playedCards[0].name)];

		this.gameEmbed
			.setColor(Colors[this.playedCards[0].color])
			.setDescription(message)
			.setFields(this.playersToField())
			.setThumbnail(`attachment://${this.playedCards[0].toAttachment()}.png`);

		this.updateMessage(false);
		return this.updateGamePanelAll(interaction);
	}
	stop(message) {
		// stops the game
		this.gameEmbed.setColor(Colors.Red);

		this.started = false;

		for (const player of this.players) player.updateGamePanel(null, false, false, false, true, null);
		this.players = [];

		this.mustCallUno = [];
		this.enableUno = false;

		this.reversed = false;
		this.turn = 0;

		this.cards = [];
		this.playedCards = [];

		this.gameEmbed.data = defaultData.gameEmbed.data;
		this.gameEmbed.setFields(this.usersToField());
		this.setEvent(message);
		this.gameComponents = [
			new ActionRowBuilder().setComponents([
				new ButtonBuilder().setCustomId("ready").setLabel("Ready").setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId("join").setLabel("Join").setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId("leave").setLabel("Leave").setStyle(ButtonStyle.Primary),
			]),
			new ActionRowBuilder().setComponents([new ButtonBuilder().setCustomId("controlPanel").setLabel("Request Control Panel").setStyle(ButtonStyle.Danger)]),
		];
		this.gameData = { embeds: [this.gameEmbed], components: this.gameComponents, files: [] };

		this.updateMessage(false);
	}
	end() {
		this.gameData = { embeds: [new EmbedBuilder().setColor(client.clr).setDescription("The game has ended because everyone left.")], components: [], files: [] };

		client.games.delete(this.id);

		this.updateControlPanel(null, false, true, "You left the game.");
		return this.updateMessage(false);
	}
	getCard(cardName) {
		// returns a card form the player's hand
		return this.cards.find((c) => c.name == cardName);
	}
	removeCard(card) {
		// removes a card from the pack
		return this.cards.splice(this.cards.indexOf(card), 1);
	}
	refillDeck() {
		// refills the deck
		for (const card of pack) this.cards.push(new Card(card, this));
		return true;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                 USER FUNCTIONS                                 //
	////////////////////////////////////////////////////////////////////////////////////

	isFull() {
		// is the game full?
		if (this.users.length == this.maxPlayers) return true;
		return false;
	}
	getUser(userId) {
		// returns a user by id from the variable this.users
		return this.users.find((u) => u.id == userId);
	}
	getBan(userId) {
		// returns a banned user by id
		return this.banned.find((u) => u.id == userId);
	}
	removeUser(userId) {
		// removes a users from the variable this.users
		return this.users.splice(this.users.indexOf(this.users.find((u) => u.id == userId)), 1);
	}
	removeBan(userId) {
		// unbans a user
		return this.banned.splice(this.banned.indexOf(this.banned.find((u) => u.id == userId)), 1);
	}
	usersToOptions(type) {
		// returns a menu with the users
		let options = [];

		if (type == 0) {
			if (this.users.length == 1) {
				this.controlPanelComponents[1].components[0].setDisabled(true);
				options.push(this.noneOption);
			} else {
				this.controlPanelComponents[1].components[0].setDisabled(false);
				for (const user of this.users.filter((u) => !u.isHost())) options.push(new StringSelectMenuOptionBuilder().setLabel(user.username).setValue(user.id));
			}
		} else if (type == 1) {
			if (this.banned.length == 0) {
				this.controlPanelComponents[1].components[0].setDisabled(true);
				options.push(this.noneOption);
			} else {
				this.controlPanelComponents[1].components[0].setDisabled(false);
				for (const user of this.banned) options.push(new StringSelectMenuOptionBuilder().setLabel(user.username).setValue(user.id));
			}
		}

		return options;
	}
	usersToField() {
		// returns a field with all the users joined
		let data = { name: `Users (${this.users.length}/${this.maxPlayers})${this.locked ? " 🔒" : ""}`, value: "" };

		for (const user of this.users) {
			if (user.isHost()) data.value += `> 👑 ${user.username} - ${user.isReady ? "✅" : "❌"}\n`;
			else data.value += `> 👤 ${user.username} - ${user.isReady ? "✅" : "❌"}\n`;
		}

		return data;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//                                PLAYER FUNCTIONS                                //
	////////////////////////////////////////////////////////////////////////////////////

	getPlayer(userId) {
		// returns a user by id from the variable this.players
		return this.players.find((p) => p.id == userId);
	}
	enableUnoAll() {
		// enables all uno buttons
		for (const player of this.players) player.enableUno();
		return true;
	}
	disableUnoAll(skip) {
		// disables all uno buttons
		if (skip) for (const player of this.players.filter((p) => !skip.find((p1) => p1.id == p.id))) player.disableUno();
		else for (const player of this.players) player.disableUno();

		return true;
	}
	loadGamePanelAll() {
		// loads all game panels
		for (const player of this.players) {
			player.gamePanelEmbed.setColor(this.gameEmbed.data.color);
			if (player.isTurn()) player.turnGamePanel();
			else player.noTurnGamePanel();

			player.gamePanelEmbed.setDescription(player.cardsToString());
		}
		return true;
	}
	updateGamePanelAll(interaction) {
		// updates all game panels
		for (const player of this.players) {
			player.gamePanelEmbed.setColor(this.gameEmbed.data.color);

			if (player.isTurn()) player.turnGamePanel();
			else if (player.challenger) player.challengerPanel();
			else player.noTurnGamePanel();

			player.gamePanelEmbed.setDescription(player.cardsToString());

			player.updateGamePanel(interaction, false, false, false, false, null);
		}
		return true;
	}
	playersToField() {
		// returns a field with all the players
		let data = { name: `Players ${this.reversed ? "⬆" : "⬇"}`, value: "" };

		for (const player of this.players) {
			if (player.isTurn()) data.value += `> **${player.username} - ${player.cards.length} cards**\n`;
			else data.value += `> ${player.username} - ${player.cards.length} cards\n`;
		}

		return data;
	}
}
export default Game;
