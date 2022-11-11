import { SlashCommandBuilder } from '@discordjs/builders';
import { hasPermissions } from "../database/wrapper.js";

export const data = new SlashCommandBuilder()
	.setName('manageableroles')
	.setDescription('Lists the manageable role(s) into assignable and unassignable role(s).');


export async function execute(interaction) {

	await interaction.deferReply({ ephemeral: true });

	interaction.editReply("Command Temporarily disabled. Please ensure that the Gatekeeper role is higher than the roles you want the bot to manage.");

}
