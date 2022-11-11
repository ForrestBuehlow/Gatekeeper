export const name = 'interactionCreate';
export function execute(interaction) {

	if (!interaction.guild) {
		interaction.reply({ content: 'Please use slash commands inside a mutual Discord server.' });
		console.log(`${interaction.user.tag} triggered an interaction outside of a guild.`);
		return;
	}

	console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction`);

	if (!interaction.isCommand())
		return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command)
		return;

	try {
		command.execute(interaction);
	} catch (error) {
		console.error(error);
		interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
}
