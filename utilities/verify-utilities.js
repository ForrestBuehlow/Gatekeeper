import { EmbedBuilder } from 'discord.js';
import { getRoleIds, getServerPreferences, getUserData, removeRoles, verify } from '../database/wrapper.js';


export async function verifyFromModal(interaction) {

	const userIdentity = interaction.fields.getTextInputValue('verify-modal-input');

	await verifyFromInteraction(interaction, userIdentity);

}

export async function verifyFromSlashCommand(interaction) {

	const userIdentity = interaction.options.getString('secretkey');

	await verifyFromInteraction(interaction, userIdentity);
	
}

async function verifyFromInteraction(interaction, userIdentity) {
	
	const secretkeyArgument = userIdentity;
	const guild = interaction.guild;
	const serverid = interaction.guild.id;
	const member = interaction.member;
	const memberid = interaction.member.user.id;
	const memberTag = interaction.member.user.tag;
	const isManageable = interaction.member.manageable;
	const oldNickname = interaction.member.nickname;

	// Retrieve server preferences
	const serverPreferences = await getServerPreferences(serverid);

	const ephemeral = serverPreferences === undefined ? true : serverPreferences['ephemeral'] === 1;

	await interaction.deferReply({ ephemeral: ephemeral });

	// Retrieve the userData tied to the given secret key { discordid, username, defaultRole }
	const userData = await getUserData(secretkeyArgument, serverid);

	// If no user data for the given secret key, or if the secret key is bound to another user, send an error message
	if (!userData || (userData['discordid'] && userData['discordid'] !== memberid)) {
		console.log(`Serverid: [${serverid}] Key in use, or no user data found for key "${secretkeyArgument}" from user "${memberTag}" [${memberid}]`);
		await interaction.editReply({ embeds: [embedMessage(interaction.member, false)] });
		return;
	}

	const discordidData = userData['discordid'];
	const usernameData = userData['username'];
	const defaultRoleData = userData['defaultRole'];

	if (!discordidData) {
		await verify(serverid, secretkeyArgument, memberid);
	}

	// Retrieve user-specific roles
	const roleidQueries = await getRoleIds(secretkeyArgument, serverid);

	// Add default roles and user roles together
	const allRoles = [];
	if (defaultRoleData) {
		allRoles.push(defaultRoleData);
	}
	for (const { role } of roleidQueries) {
		if (role) {
			allRoles.push(role);
		}
	}

	// Set assigned role(s), tracking missing roles (assumed through manual deletion) and failed role assignments (missing permissions)
	const missingRoles = [];
	const missingPermissions = [];
	const setRoles = [];
	for (const roleid of allRoles) {

		setRoles.push(roleid);

		const role = await guild.roles.fetch(roleid).catch(console.error);

		await member.roles.add(role, 'verify user, add assigned user role(s)').catch(error => {
			// Missing permissions
			if (error['code'] === 50013) {
				console.log('MISSING PERMISSIONS: ');
				missingPermissions.push({ reason: 'missing_permissions', roleid: roleid });
			}
			// Missing role
			else if (error['code'] === 'INVALID_TYPE') {
				console.log('ERROR: CANNOT FIND ROLEID');
				missingRoles.push({ reason: 'invalid_type', roleid: roleid });
			} else {
				console.log('UNMANAGED ERROR');
				console.log(error);
			}
			setRoles.pop();
		});
	}

	// Cleanup missing roles
	for (const { roleid } of missingRoles) {
		await removeRoles(interaction.guild.id, roleid);
	}

	// Assign nickname
	if (isManageable && usernameData) {
		await interaction.member.setNickname(usernameData)
			.then(() => {
				console.log(`Set server nickname for user "${memberTag}" [${memberid}] of guild "${interaction.guild}" [${serverid}] to "${usernameData}" from "${oldNickname}"`);
			}).catch(console.error);
	} else if (!isManageable && usernameData) {
		console.log(`[FAILURE]: Cannot set server nickname for user "${memberTag}" [${memberid}] of guild "${interaction.guild}" [${serverid}]: This user is not manageable`);
	}

	await interaction.editReply({
		embeds: [embedMessage(
			interaction.member,
			true,
			{
				isManageable: isManageable,
				nickname: usernameData,
				assignedRoles: setRoles,
				allRoles: allRoles,
				missingRoles: missingRoles,
				missingPermissions: missingPermissions
			})]
	});
}

function embedMessage(member, success, options = null) {

	const color = success ? '#1A85FF' : '#D41159';
	// const title = ('Verification ' + success ? 'Successful  :white_check_mark:' : 'Failed  :no_entry_sign:');
	const title = (success ? 'Verification Successful  :white_check_mark:' : 'Verification Failed  :no_entry_sign:');
	const descriptionTitle = member.user.tag;
	const descriptionURL = member.user.avatarURL();
	const description = success ?
		`Below are the changes made to your server membership.` :
		`Sorry, that key does not exist or it has already been used by another member.`;
	const footer = success ?
		`Something wrong with your assigned server nickname and/or role(s)? Contact the server administrator(s) of ${member.guild.name}.` :
		`Contact the server administrator(s) of ${member.guild.name} if you believe this is an error.`;

	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setAuthor({ name: descriptionTitle, url: descriptionURL })
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: footer })

	if (success) {
		if (options['nickname']) {
			const manageable = options['isManageable'];
			const nickname = options['nickname'];
			if (manageable) {
				embed.addFields({ name: 'Assigned Nickname:', value: nickname });
			} else {
				embed.addFields({ name: 'Nickname:  :warning:', value: 'Unable to set nickname: user is not manageable.' });
				embed.setTitle('Verification Issue:  :warning:');
				embed.setColor('#F0E442');
			}
		}
		if (options['assignedRoles']) {
			const assignedRoles = options['assignedRoles'];

			let outputString = '';

			for (const roleid of assignedRoles) {
				outputString += `<@&${roleid}> `;
			}
			if (outputString.length > 0) {
				embed.addFields({ name: 'Assigned Role(s):', value: outputString });
			}
		}
		if (options['missingPermissions']) {
			const missingPermissions = options['missingPermissions'];

			let outputString = '';

			for (const { roleid } of missingPermissions) {
				outputString += `<@&${roleid}> `;
			}
			if (outputString.length > 0) {
				outputString += '\nUnable to assign the role(s): Bot lacks permissions, or bot is not high enough in the hierarchy list. Please alert your server administrator.'
				embed.addFields({ name: 'Unable to Assign Role(s):  :warning:', value: outputString });
				embed.setTitle('Verification Issue:  :warning:');
				embed.setColor('#F0E442');
			}
		}
		if (options['missingRoles']) {
			const missingRoles = options['missingRoles'];

			let outputString = '';

			for (const { roleid } of missingRoles) {
				outputString += `${roleid} `;
			}
			if (outputString.length > 0) {
				embed.addFields({ name: 'Missing/Deleted Role(s), removed from database:  :warning:', value: outputString });
				embed.setTitle('Verification Issue:  :warning:');
				embed.setColor('#F0E442');
			}
		}
		// embed.addFields({ name: '\u200b', '\u200b', value: true });
	}

	return embed;
}
