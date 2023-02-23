import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function keepDrawed(interaction) {
	const game = client.games.get(interaction.channel.id);
	if (!game) return interaction.reply({ embeds: [defaultData.noGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	const player = game.getPlayer(interaction.user.id);
	if (!player) return interaction.reply({ embeds: [defaultData.noPlayerEmbed], ephemeral: true }).catch((err) => client.err(err));

	player.drawCard(interaction, true);

	return interaction.deferUpdate();
}
