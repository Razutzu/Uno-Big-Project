import User from "../../classes/user.js";
import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function join(interaction) {
	const game = client.games.get(interaction.channel.id);
	if (!game) return interaction.reply({ embeds: [defaultData.noGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (game.getUser(interaction.user.id)) return interaction.reply({ embeds: [defaultData.alreadyJoinedEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (game.getBan(interaction.user.id)) return interaction.reply({ embeds: [defaultData.bannedEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (game.locked) return interaction.reply({ embeds: [defaultData.lockedEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (game.isFull()) return interaction.reply({ embeds: [defaultData.fullEmbed], ephemeral: true }).catch((err) => client.err(err));

	new User(interaction);

	return interaction.deferUpdate();
}
