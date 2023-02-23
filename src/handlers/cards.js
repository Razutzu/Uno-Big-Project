import client from "../client.js";
import cards from "../../cards.json" assert { type: "json" };

import { AttachmentBuilder } from "discord.js";

export function cardsHandler() {
	for (const card of cards) {
		const cardFileName = card.replace(/ /g, "");

		const attachment = new AttachmentBuilder().setName(`${cardFileName}.png`).setFile(`cards/${cardFileName}.png`);

		client.cards.set(card, attachment);
	}
}
