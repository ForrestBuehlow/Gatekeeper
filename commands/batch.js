import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('batch')
	.setDescription('batch jobs for user identities')
	.addSubcommand(subcommand => subcommand
		.setName('upload')
		.setDescription('batch upload new users')
		.addAttachmentOption(input => input
			.setName('filename')
			.setDescription('file name containing usernames and/or role ids')
			.setRequired(true)
		)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false);

export async function execute(interaction) {
	console.log(interaction.options.getAttachment('filename'))

}
