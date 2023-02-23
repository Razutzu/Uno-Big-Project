import client from "../../client.js";
import defaultEmbeds from "../../classes/defaultData.js";

export default function join(interaction) {
	const embed = defaultEmbeds.game;

	return interaction.reply({ embeds: [embed] }).catch((err) => client.err(err));
}
