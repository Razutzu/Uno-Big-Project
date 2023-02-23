import client from "../client.js";
import ms from "ms";

import { cardsHandler } from "../handlers/cards.js";
import { commandsHandler } from "../handlers/commands.js";
import { ActivityType } from "discord.js";

export default {
	name: "ready",
	once: true,
	run: () => {
		cardsHandler();
		commandsHandler();

		if (!client.timer) client.warn("Set the 25m timer!");

		setInterval(() => {
			client.user.setActivity({ type: ActivityType.Watching, name: `${client.games.size} games` });
		}, ms("30s"));

		return client.success(`Logged in as ${client.user.tag} is ready!`);
	},
};
