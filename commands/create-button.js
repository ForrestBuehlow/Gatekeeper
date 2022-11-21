import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, Events, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const BUTTON_CHARACTER_LIMIT = 80;
const MESSAGE_CHARACTER_LIMIT = 2000;

export const data = new SlashCommandBuilder()
	.setName('createbutton')
	.setDescription('Creates a verification button interaction.')
	.addStringOption(option => option
		.setName('custommessage')
		.setDescription('Set a custom message')
	)
	.addStringOption(option => option
		.setName('customlabel')
		.setDescription('Set a custom button label')
	)
	.setDMPermission(false);


export async function execute(interaction) {

	const message = interaction.options.getString('custommessage') ?? 'Click the button below to begin';
	const label = interaction.options.getString('customlabel') ?? 'Verify';

	if (label.length > BUTTON_CHARACTER_LIMIT) {
		const error = `:x:  Error: Button length must be <= ${BUTTON_CHARACTER_LIMIT} characters long.`
		await interaction.reply({ content: error});
		return;
	}
	else if (label.length > MESSAGE_CHARACTER_LIMIT) {
		const error = `:x:  Error: Message length must be <= ${MESSAGE_CHARACTER_LIMIT} characters long.`;
		await interaction.reply({ content: error});
		return;
	}

	const row = new ActionRowBuilder()
	.addComponents(
		new ButtonBuilder()
			.setCustomId('verify-button')
			.setLabel(label)
			.setStyle(ButtonStyle.Primary),
	);

	await interaction.reply({ content: message, components: [row] });
}
