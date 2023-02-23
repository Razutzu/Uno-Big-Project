import client from "../client.js";

import { readdirSync } from "fs";

export async function eventsHandler() {
	const events = readdirSync("./src/events");

	for (const file of events) {
		const event = await import(`../events/${file}`);
		if (event.default.once) client.once(event.default.name, (...args) => event.default.run(...args));
		else client.on(event.default.name, (...args) => event.default.run(...args));
	}

	return true;
}
