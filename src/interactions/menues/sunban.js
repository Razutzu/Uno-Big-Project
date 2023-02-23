import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function unban(interaction) {
	const game = client.games.get(interaction.channel.id);
	if (!game) return interaction.reply({ embeds: [defaultData.noGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	const user = game.getUser(interaction.user.id);
	if (!user) return interaction.reply({ embeds: [defaultData.noPlayerEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (!user.isHost()) return interaction.reply({ embeds: [defaultData.noHostEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (game.started) return game.updateControlPanel(null, false, true, "The game has started.");

	game.getBan(interaction.values[0]).unban();

	return interaction.deferUpdate();
}
