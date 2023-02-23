import client from "../client.js";

class User {
	constructor(interaction) {
		this.id = interaction.user.id;

		this.toString = interaction.user.toString();
		this.username = interaction.user.username;

		this.isReady = false;

		this.game = client.games.get(interaction.channel.id);

		this.join();
	}
	isHost() {
		// is the user host?
		if (this.id == this.game.hostId) return true;
		return false;
	}
	join() {
		// makes the user joins the game
		this.game.users.push(this);

		this.game.gameEmbed.setFields(this.game.usersToField());

		if (this.game.users.length == 2) {
			this.game.gameComponents[0].components[0].setDisabled(false);
			this.game.updateButtons(false);
		}
		this.game.updateMenu(this.game.controlPanelComponents[1].components[0].data.custom_id);
		this.game.updateControlPanel(null, false, false, false);

		if (this.isHost()) return true;

		this.game.setEvent(`${this.username} joined.`);

		return this.game.updateMessage(false);
	}
	leave() {
		// makes the user leave the game
		this.game.removeUser(this.id);

		if (this.game.users.length == 0) return this.game.end();
		if (this.game.users.length == 1) {
			if (this.game.locked) {
				this.game.locked = false;
				this.game.controlPanelComponents[0].components[3].setLabel("Lock");
			}
			this.game.gameComponents[0].components[0].setDisabled(true);
			this.game.updateButtons(true);
		}
		if (this.isHost()) {
			this.game.users[0].makeHost("You left the game.");
			this.game.setEvent(`${this.username} left. Now the host is ${this.game.users[0].username}`);
		} else {
			this.game.updateMenu(this.game.controlPanelComponents[1].components[0].data.custom_id);
			this.game.updateControlPanel(null, false, false, false);
			this.game.setEvent(`${this.username} left.`);
		}
		this.game.gameEmbed.setFields(this.game.usersToField());

		return this.game.updateMessage(false);
	}
	ready() {
		// makes the user readu
		this.isReady = !this.isReady;

		if (this.game.loading) return;

		if (!this.game.users.find((u) => !u.isReady)) return this.game.start();

		this.game.gameEmbed.setFields(this.game.usersToField());
		return this.game.updateMessage(false);
	}
	kick() {
		// kicks the users
		this.game.removeUser(this.id);

		this.game.setEvent(`${this.username} has been kicked!`);
		this.game.gameEmbed.setFields(this.game.usersToField());

		if (this.game.users.length == 1) {
			if (this.game.locked) {
				this.game.locked = false;
				this.game.controlPanelComponents[0].components[3].setLabel("Lock");
			}
			this.game.gameComponents[0].components[0].setDisabled(true);
			this.game.updateButtons(true);
		}
		this.game.updateMenu("skick");
		this.game.updateControlPanel(null, false, false, false);

		return this.game.updateMessage(false);
	}
	ban() {
		// bans the user
		this.game.removeUser(this.id);
		this.game.banned.push(this);

		this.game.setEvent(`${this.username} has been banned!`);
		this.game.gameEmbed.setFields(this.game.usersToField());

		if (this.game.banned.length == 1) this.game.controlPanelComponents[0].components[2].setDisabled(false);
		if (this.game.users.length == 1) {
			if (this.game.locked) {
				this.game.locked = false;
				this.game.controlPanelComponents[0].components[3].setLabel("Lock");
			}
			this.game.gameComponents[0].components[0].setDisabled(true);
			this.game.updateButtons(true);
		}
		this.game.updateMenu("sban");
		this.game.updateControlPanel(null, false, false, false);

		return this.game.updateMessage(false);
	}
	unban() {
		// unbans the user
		this.game.removeBan(this.id);

		this.game.setEvent(`${this.username} has been unbanned!`);

		if (this.game.banned.length == 0) this.game.controlPanelComponents[0].components[2].setDisabled(true);

		this.game.updateMenu("sunban");
		this.game.updateControlPanel(null, false, false, false);

		return this.game.updateMessage(false);
	}
	makeHost(message) {
		// makes the user host
		this.game.hostId = this.id;

		this.game.users.splice(this.game.users.indexOf(this), 1);
		this.game.users.unshift(this);

		this.game.setEvent(`${this.username} is now the host.`);
		this.game.gameEmbed.setFields(this.game.usersToField());

		this.game.controlPanelComponents[1].components[0].setOptions(this.game.noneOption).setDisabled(true);
		this.game.updateControlPanel(null, false, true, message);

		return this.game.updateMessage(false);
	}
}

export default User;
