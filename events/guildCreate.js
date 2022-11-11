import { guildCreate } from "../database/wrapper.js";

export const name = 'guildCreate';
export function execute(guild) {
	console.log(`Invited to guild ${guild.id}`);

	guildCreate(guild.id);
}
