import client from "../client.js";
import chalk from "chalk";

export default {
	name: "interactionCreate",
	once: false,
	run: async (interaction) => {
		let path = "../interactions/";

		if (interaction.isChatInputCommand()) path += `commands/${interaction.commandName}.js`;
		else if (interaction.isButton()) {
			if (interaction.customId.startsWith("wildDrawFour")) path += `buttons/wildDrawFour.js`;
			else if (interaction.customId.startsWith("wild")) path += `buttons/wild.js`;
			else if (interaction.customId.startsWith("playDrawed")) path += `buttons/playDrawed.js`;
			else if (interaction.customId.startsWith("keepDrawed")) path += `buttons/keepDrawed.js`;
			else path += `buttons/${interaction.customId}.js`;
		} else if (interaction.isStringSelectMenu()) path += `menues/${interaction.customId}.js`;

		try {
			const command = await import(path);
			command.default(interaction);
		} catch (err) {
			client.err(err);
		}

		return client.info(`${chalk.yellow(path)} was executed by ${interaction.user.tag}.`);
	},
};
