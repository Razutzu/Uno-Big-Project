import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function play(interaction) {
	const game = client.games.get(interaction.channel.id);
	if (!game) return interaction.reply({ embeds: [defaultData.noGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	const player = game.getPlayer(interaction.user.id);
	if (!player) return interaction.reply({ embeds: [defaultData.noPlayerEmbed], ephemeral: true }).catch((err) => client.err(err));

	if (player.cards.length == 1) game.stop(`${interaction.user.toString()} won the game!`);
	else {
		const card = player.getCard(interaction.values[0]);

		if (card.type().includes("wild")) {
			player.wildCardGamePanel(card);
			player.updateGamePanel(interaction, false, true, false, false, card);
		} else player.playCard(interaction, card);
	}

	return interaction.deferUpdate();
}
