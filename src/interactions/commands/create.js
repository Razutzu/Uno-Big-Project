import Game from "../../classes/game.js";
import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function create(interaction) {
	if (client.games.get(interaction.channel.id)) return interaction.reply({ embeds: [defaultData.alreadyGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	return new Game(interaction);
}
