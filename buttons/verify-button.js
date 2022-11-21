import { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export const data = { name: "verify-button" }

export async function execute(interaction) {

	// Construct Modal
	const modal = new ModalBuilder()
		.setCustomId('verify-modal')
		.setTitle('User Identification')

	// Construct componenets
	const userIdentifierInput = new TextInputBuilder()
		.setCustomId('verify-modal-input')
		.setLabel('Enter your user identification key below:')
		.setPlaceholder('Paste your key here!')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	// Add components to row
	const firstActionRow = new ActionRowBuilder().addComponents(userIdentifierInput);

	// Add all to modal
	modal.addComponents(firstActionRow);

	await interaction.showModal(modal);

}
