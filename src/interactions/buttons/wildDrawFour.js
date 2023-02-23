import client from "../../client.js";
import defaultData from "../../classes/defaultData.js";

export default function wildDrawFour(interaction) {
	const game = client.games.get(interaction.channel.id);
	if (!game) return interaction.reply({ embeds: [defaultData.noGameEmbed], ephemeral: true }).catch((err) => client.err(err));

	const player = game.getPlayer(interaction.user.id);
	if (!player) return interaction.reply({ embeds: [defaultData.noPlayerEmbed], ephemeral: true }).catch((err) => client.err(err));

	const card = player.getCard("Wild Draw Four");

	const customIdArray = interaction.customId.split("_");

	card.setColor(customIdArray[customIdArray.length - 1]);

	player.playCard(interaction, card);

	return interaction.deferUpdate();
}
