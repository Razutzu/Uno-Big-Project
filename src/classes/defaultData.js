import client from "../client.js";

import { EmbedBuilder } from "discord.js";

const defaultData = {
	gameInfo:
		"> If you are the host of the game, press on `Request Control Panel`, so you can manage the game.\n> If you are not familiar with UNO, use the command /rules\n> And that's it! Press on `Ready` when you are ready and start playing!",
	gameEmbed: new EmbedBuilder()
		.setColor(client.clr)
		.setDescription(
			"Hi, let's play Uno!\n\n> If you are the host of the game, press on `Request Control Panel`, so you can manage the game.\n> If you are not familiar with UNO, you can press on `Show Rules`, or use the command /rules\n> And that's it! Press on `Ready` when you are ready and start playing!"
		),
	noGameEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | There is no game on this channel."),
	noPlayerEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | You did not join this game."),
	noHostEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | You are not the host."),
	alreadyJoinedEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | You already joined this game."),
	alreadyGameEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | There is a game created on this channel."),
	gameStartedEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | The game already started."),
	bannedEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | You are banned from this game."),
	lockedEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | This game is locked."),
	fullEmbed: new EmbedBuilder().setColor(client.clr).setDescription("\\❌ | This game is full."),
};
export default defaultData;
