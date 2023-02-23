import client from "../client.js";

import { SlashCommandBuilder } from "discord.js";

export function commandsHandler() {
	if (!client.updateCommands) return client.info("updateCommands is false.");
	const commands = [
		new SlashCommandBuilder()
			.setName("create")
			.setDescription("Host a game.")
			.addIntegerOption((option) => option.setName("players").setDescription("The maximum number of players that can join.")),
		new SlashCommandBuilder().setName("join").setDescription("Join a game."),
		new SlashCommandBuilder().setName("leave").setDescription("Leave a game."),
		new SlashCommandBuilder().setName("start").setDescription("Start a game."),
	];

	return client.application.commands
		.set(commands)
		.then(() => client.success("The commands have been successfully updated!"))
		.catch((err) => client.err(err));
}
