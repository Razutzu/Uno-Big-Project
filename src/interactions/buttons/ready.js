import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function ready(interaction) {
	const game = client.games.get(interaction.channel.id);
	if (!game) return interaction.reply({ embeds: [defaultData.noGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	const user = game.getUser(interaction.user.id);
	if (!user) return interaction.reply({ embeds: [defaultData.noPlayerEmbed], ephemeral: true }).catch((err) => client.err(err));

	user.ready();

	return interaction.deferUpdate();
}
