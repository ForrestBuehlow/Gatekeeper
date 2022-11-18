export const name = 'interactionCreate';
export function execute(interaction) {

	if (!interaction.guild) {
		interaction.reply({ content: 'Please use slash commands inside a mutual Discord server.' });
		console.log(`${interaction.user.tag} triggered an interaction outside of a guild.`);
		return;
	}

	console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction`);

	if (interaction.isButton()) {

		const button = interaction.client.buttons.get(interaction.customId);
		executeInteraction(button, interaction);
	}
	else if (interaction.isModalSubmit()) {
		const modal = interaction.client.modals.get(interaction.customId);
		executeInteraction(modal, interaction);
	}
	else if (interaction.isCommand()) {

		const command = interaction.client.commands.get(interaction.commandName);
		executeInteraction(command, interaction);
	}
}

function executeInteraction(interactionType, interaction) {
	if (!interactionType) {
		return;
	}

	try {
		interactionType.execute(interaction);
	} catch (error) {
		console.error(error);
		interaction.reply({ content: 'There was na error while executing this command!', ephemeral: true });
	}
}
