import chalk from "chalk";

import { config } from "dotenv";
import { Client, Colors, GatewayIntentBits } from "discord.js";

config();

class ExtendedClient extends Client {
	constructor(options) {
		super(options);
		this.clr = Colors.Red;

		this.timer = true;

		this.ready = false;
		this.updateCommands = false;

		this.cards = new Map();
		this.games = new Map();
		this.menues = new Map();
	}
	log(color, tag, msg) {
		const time = new Date();
		return console.log(`${chalk.yellow(`[ ${time.toLocaleTimeString()} ]`)} ${chalk[color](`[${tag}]`)} ${msg}`);
	}
	err(err) {
		return this.log("red", "  Error  ", err.stack);
	}
	warn(warn) {
		return this.log("red", " Warning ", warn);
	}
	success(msg) {
		return this.log("green", " Success ", msg);
	}
	info(info) {
		return this.log("blue", "  Info.  ", info);
	}
}

const client = new ExtendedClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

export default client;

client.login(process.env.TOKEN);

import { eventsHandler } from "./handlers/events.js";
eventsHandler();

process.on("uncaughtException", (err) => client.log("red", "Uncaught Error", err.stack));
