import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from "discord.js";
import { hasPermissions } from "../database/wrapper.js";

export const data = new SlashCommandBuilder()
	.setName('manageableroles')
	.setDescription('Lists the manageable role(s) into assignable and unassignable role(s).');


export async function execute(interaction) {

	await interaction.deferReply({ ephemeral: true });

	interaction.editReply("Command Temporarily disabled. Please ensure that the Gatekeeper role is higher than the roles you want the bot to manage.");

	/*
	// Check 'permissions' for user if the user is not the guild owner
	if (interaction.user.id !== interaction.guild.ownerId &&
		 !await hasPermissions(interaction.guild.id, interaction.user.id, Array.from(interaction.member.roles.cache.keys()))) {

		 const embed = new MessageEmbed()
			  .setColor('#D41159')
			  .setTitle('Manageable Roles  :no_entry_sign:')
			  .setAuthor(interaction.user.tag, interaction.user.avatarURL())
			  .setDescription('Sorry, you do not have the required permissions to use this command.')
			  .setFooter('Contact your server administrator if you believe this is an error.')
			  .setTimestamp();
		 await interaction.editReply({embeds: [embed]});

		 return;
	}

	interaction.guild.roles.fetch()
		 .then(roles => {

			  const embed = new MessageEmbed()
					.setColor('#1A85FF')
					.setTitle('Manageable Roles')
					.setAuthor(interaction.user.tag, interaction.user.avatarURL())
					.setDescription('Role(s) this bot can and cannot assign, that are manageable.\n\n' +
						 'To change the role(s) the bot can or cannot assign, adjust the position of the role `The Gatekeeper` in the role hierarchy (`Server Settings > Roles`)')
					.setTimestamp();

			  let assignableRolesString = '';
			  let missingPermissionsString = '';

			  for (const [, role] of roles) {
					if (role.id !== interaction.guild.id && !role.managed) {
						 if (role.editable) {
							  assignableRolesString += `<@&${role.id}>\n`;
						 } else {
							  missingPermissionsString += `<@&${role.id}>\n`;
						 }
					}
			  }

			  // Add fields for assignable and unassignable roles. If there are no roles manageable, add warning field
			  if (assignableRolesString.length > 0) {
					embed.addField('Assignable Role(s)', assignableRolesString, true);
			  }
			  if (missingPermissionsString.length > 0) {
					embed.addField('Unassignable Role(s)', missingPermissionsString, true);
			  }
			  if (assignableRolesString.length === 0 && missingPermissionsString.length === 0) {
					embed.addField('No roles found  :warning:', 'This could either be because the server contains no editable roles, or there was a problem accessing cached roles.');
			  }

			  embed.addField('Role Hierarchy Support', 'See section `Part Two: Role Hierarchies` from [Discord Support](https://support.discord.com/hc/articles/214836687-Role-Management-101)');

			  interaction.editReply({embeds: [embed]});
		 })
		 .catch(console.error);

		 */
}
