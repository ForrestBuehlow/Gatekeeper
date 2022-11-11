import { SlashCommandBuilder } from '@discordjs/builders';
import { clearDefaultServerRole, hasPermissions, setDefaultServerRole, setFeedbackPreferences } from "../database/wrapper.js";

export const data = new SlashCommandBuilder()
	.setName('preferences')
	.setDescription('Set the Gatekeeper preferences for this server')
	.addSubcommand(subcommand => subcommand
		.setName('feedback')
		.setDescription('Hide or unhide feedback from public commands')
		.addStringOption(option => option
			.setName('option')
			.setDescription('Set public feedback public or private')
			.addChoices(
				{ name: 'Public (observable to other channel members)', value: 'public' },
				{ name: 'Private (observable only to user)', value: 'private' }
			)
			.setRequired(true)))
	.addSubcommandGroup((group) => group
		.setName('default_role')
		.setDescription('Manage the default role when a user uses the command /verify')
		.addSubcommand((subcommand) => subcommand
			.setName('set')
			.setDescription('Set the default server role. Use /manageableroles for roles that are assignable')
			.addRoleOption(option => option
				.setName('role')
				.setDescription('Use /manageableroles for roles that are assignable')
				.setRequired(true)))
		.addSubcommand((subcommand) => subcommand.setName('clear')
			.setDescription('Clear the default server role')));

export async function execute(interaction) {

	await interaction.deferReply({ ephemeral: true });

	// Check 'permissions' for user if the user is not the guild owner
	if (interaction.user.id !== interaction.guild.ownerId &&
		!await hasPermissions(interaction.guild.id, interaction.user.id, Array.from(interaction.member.roles.cache.keys()))) {

		await interaction.editReply(`Sorry, you do not have the required permissions to use this command.`);

		return;
	}

	if (interaction.options.getSubcommand() === 'clear') {
		console.log('clear initiated');

		await clearDefaultServerRole(interaction.guild.id);

		await interaction.editReply('Default server role cleared.');

	} else if (interaction.options.getSubcommand() === 'set') {
		console.log('set initiated');
		const roleOption = interaction.options.getRole('role');

		if (roleOption.managed) {
			await interaction.editReply(`Error: role \`${roleOption.name}\` is managed, and cannot be assigned. Use \`/manageableroles\` for a list of assignable roles`);
		} else if (!roleOption.editable) {
			await interaction.editReply(`Error: role \`${roleOption.name}\` cannot currently be assigned, potentially due to the bots position in the role hierarchy.Use \`/manageableroles\` for more info`);
		} else if (roleOption.editable) {

			await setDefaultServerRole(interaction.guild.id, roleOption.id);
			await interaction.editReply(`Default role for users who use \`/verify\` set to \`${roleOption.name}\``);

		} else {
			await interaction.editReply('Error: Something went wrong. Aborting...');
		}
	} else if (interaction.options.getSubcommand() === 'feedback') {
		console.log('feedback initiated');
		const feedbackOption = interaction.options.getString('option') === 'public' ? 0 : 1;

		await setFeedbackPreferences(interaction.guild.id, feedbackOption);

		await interaction.editReply('Public command feedback updated');
	} else {
		await interaction.editReply('Error: Something went wrong.');
	}
}
