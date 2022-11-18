import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, Events, PermissionFlagsBits, EmbedBuilder } from 'discord.js';


export const data = new SlashCommandBuilder()
	.setName('createbutton')
	.setDescription('Creates a verification button interaction.')
	.addBooleanOption(option => option
		.setName('ispublic')
		.setDescription('Set response to be ephemeral')
	)
	.setDMPermission(false);


export async function execute(interaction) {
	const row = new ActionRowBuilder()
	.addComponents(
		new ButtonBuilder()
			.setCustomId('verify-button')
			.setLabel('Verify')
			.setStyle(ButtonStyle.Primary),
	);

	await interaction.reply({ content: 'I think you should,', components: [row] });
}
