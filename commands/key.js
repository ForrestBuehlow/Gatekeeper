import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from "discord.js";
import { hasPermissions, getKeys, insertKey, insertName, insertRole } from '../database/wrapper.js';

export const data = new SlashCommandBuilder()
	.setName('key')
	.setDescription('Secret key settings for /verify')
	.addSubcommand(subcommand => subcommand
		.setName('add')
		.setDescription('Add a secret key for a new user')
		.addStringOption(option => option
			.setName('secretkey')
			.setDescription('Set the secret key for a new user')
			.setRequired(true))
		.addStringOption(option => option
			.setName('nickname')
			.setDescription('[optional] assigned nickname')
			.setRequired(false))
		.addRoleOption(option => option
			.setName('role')
			.setDescription('[optional] assigned role. Leave blank if not different from server default role, see /preferences')
			.setRequired(false)));

export async function execute(interaction) {

	await interaction.deferReply({ ephemeral: true });

	// Check 'permissions' for user if the user is not the guild owner
	if (interaction.user.id !== interaction.guild.ownerId &&
		!await hasPermissions(interaction.guild.id, interaction.user.id, Array.from(interaction.member.roles.cache.keys()))) {

		const embed = new MessageEmbed()
			.setColor('#D41159')
			.setTitle('Key  :no_entry_sign:')
			.setAuthor(interaction.user.tag, interaction.user.avatarURL())
			.setDescription('Sorry, you do not have the required permissions to use this command.')
			.setFooter('Contact your server administrator if you believe this is an error.')
			.setTimestamp();
		await interaction.editReply({ embeds: [embed] });

		return;
	}

	if (interaction.options.getSubcommand() === 'add') {
		console.log('adding new key');

		const secretkey = interaction.options.getString('secretkey');
		const nickname = interaction.options.getString('nickname');
		const roleOption = interaction.options.getRole('role');

		// Check if role is assignable before querying the database
		if (roleOption) {
			if (roleOption.managed) {
				await interaction.editReply(`Error: role \`${roleOption.name}\` is managed, and cannot be assigned. Use \`/manageableroles\` for a list of assignable roles`);
				return;
			} else if (!roleOption.editable) {
				await interaction.editReply(`Error: role \`${roleOption.name}\` cannot currently be assigned, potentially due to the bots position in the role hierarchy.Use \`/manageableroles\` for more info`);
				return;
			}
		}

		const existingKeys = await getKeys(interaction.guild.id, secretkey);

		if (existingKeys.length > 0) {
			await interaction.editReply(`Error: Given secret key is already in use. Please try again with a new key.`);
			return;
		}

		await insertKey(interaction.guild.id, secretkey);

		if (nickname && nickname.length > 0) {
			await insertName(interaction.guild.id, secretkey, nickname);
		}
		if (roleOption) {
			await insertRole(interaction.guild.id, secretkey, roleOption.id);
		}

		await interaction.editReply(`Success: Added new secret key \`${secretkey}\` with given options.`);

	} else {
		console.log('Error: Something went wrong');
	}
}
