import { init } from "../database/wrapper.js";

export const name = 'ready';
export const once = true;
export function execute(client) {
	console.log(`Logged in as ${client.user.tag}`);

	init();

	console.log(`Ready!`);
}
