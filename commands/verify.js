import { SlashCommandBuilder } from '@discordjs/builders';
import { verifyFromSlashCommand } from '../utilities/verify-utilities.js'

export const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Verifies your account, then sets your server username and/or role(s).')
	.addStringOption(option =>
		option.setName('secretkey')
			.setDescription('Your assigned secret key for verification.')
			.setRequired(true));

export async function execute(interaction) {

	await verifyFromSlashCommand(interaction);

}
