import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getKeys, insertKey, insertName, insertRole } from '../database/wrapper.js';
import { v4 as uuidv4 } from 'uuid';


/**
 * Maximum nickname length on Discord.
 */
const MAX_NICKNAME_LENGTH = 32;


/*
 * Administrator slash command to generate a new user identifier. Currently only 
 * supports UUID4.
 * 
 * Command Options:
 * 	username - name to assign the user who redeems this generated key
 * 	role     - server role to assign the user who redeems this generated key
 */
export const data = new SlashCommandBuilder()
	.setName('generate')
	.setDescription('Generate a new user identifier')
	.addSubcommand(subcommand => subcommand
		.setName('uuid4')
		.setDescription('Generate a new UUID4')
		.addStringOption(option => option
			.setName('username')
			.setDescription('Server username to assign to user who redeems this identifier')
		)
		.addRoleOption(option => option
			.setName('role')
			.setDescription('Server role to assign to user who redeems this identifier, seperate from default server role')
		)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false);


/**
 * Slash command to generate a new user identifier.
 * 
 * @param {*} interaction the slash command invoked by a user
 */
export async function execute(interaction) {

	await interaction.deferReply({ ephemeral: true });

	// Data given in command
	const username = interaction.options.getString('username');
	const role = interaction.options.getRole('role');
	const identifierMethod = interaction.options.getSubcommand();
	const guild = interaction.guild;

	// Error checking input
	if (isValidParameters(interaction, username, role)) {

		let userIdentifier;

		// Ensure key is not a duplicate
		do {
			userIdentifier = generateUserIdentifier(identifierMethod);
			const existingKeys = await getKeys(guild.id, userIdentifier);

			if (existingKeys.length > 0) {
				userIdentifier = null;
			}
		} while (!userIdentifier);

		// Construct feedback message
		const fields = getEmbedFields(identifierMethod, userIdentifier, username, role);
		const embedResponse = new EmbedBuilder()
		.setTitle('User Identity Created  :white_check_mark:')
		.setDescription('Please share the identifier below with the designated user.')
		.setColor('Green')
		.addFields(fields)
		.setTimestamp();
	
		// Insert data in database
		await insertKey(guild.id, userIdentifier);

		if (username) {
			await insertName(guild.id, userIdentifier, username);
		}
		if (role) {
			await insertRole(guild.id, userIdentifier, role.id);
		}

		console.log(
			`[generate/${guild}{${guild.id}}] [${userIdentifier}]: Username: [${username}], Role: [${role?.name}/${role?.id}]`
		);
	
		// Update reply
		interaction.editReply({ embeds: [embedResponse] });
	}
}


/**
 * Generates an array of fields to be used for a valid identifier generation interaction
 * 
 * @param {*} identifierMethod how the key was generated
 * @param {*} userIdentifier the generated identifier
 * @param {*} username the username to set
 * @param {*} role the role to set
 * @returns an array of embed fields
 */
function getEmbedFields(identifierMethod, userIdentifier, username, role) {
	const fields = [];
	fields.push({ name: `Identifier (${identifierMethod})`, value: userIdentifier });

	// Only add Username or Role fields if user provided them
	if (username) {
		fields.push({ name: 'Username', value: username });
	}
	if (role) {
		fields.push({ name: 'Role', value: `${role}` });
	}

	return fields;
}


/**
 * Checks if the given interaction parameters are valid.
 * 
 * @param {*} interaction the interaction that contains the reply message
 * @param {*} username the username to set, if given
 * @param {*} role the role to set, if given
 * @returns true if all parameters are valid
 */
function isValidParameters(interaction, username, role) {

	let isValid = true;
	const guild = interaction.guild;

	if (username?.length > MAX_NICKNAME_LENGTH) {
		console.log(`[generate/${guild}{${guild.id}}] given username exceeds length limit`);

		isValid = false;
		interaction.editReply({ embeds: [embedErrorFactory('username_length', { length: username.length })]});
	}
	else if (role?.managed) {
		console.log(`[generate/${guild}{${guild.id}}] ${role.name} [${role.id}] managed by another service`);

		isValid = false;
		interaction.editReply({embeds: [embedErrorFactory('managed_role', { role: role })]});
	}
	else if (role && !role?.editable) {
		console.log(`[generate/${guild}{${guild.id}}] ${role.name} [${role.id}] is not editable`);

		isValid = false;
		interaction.editReply({embeds: [embedErrorFactory('not_editable', { role: role, client: interaction.client.user })]});
	}

	return isValid;
}


/**
 * Generator for user identifiers.
 * 
 * @param {*} method the desired way to generate a user identifier
 * @returns a user identifier
 */
function generateUserIdentifier(method) {
	switch (method) {
		case 'uuid4':
			return uuidv4();
	}
}


/**
 * Factory for embed error messages
 * 
 * @param {*} string the desired embed type
 * @param {*} parameters object containing relevent parameters for string
 * @returns a constructed embed message
 */
function embedErrorFactory(string, parameters) {

	switch(string) {
		case 'username_length':
			return usernameLengthLimitReachedEmbed(parameters.length);
		case 'managed_role':
			return roleIsManagedEmbed(parameters.role);
		case 'not_editable':
			return roleIsNotEditable(parameters.role, parameters.client);
	}
}


/**
 * Generates a error embed message for username length
 * @param {*} length the length of the given username
 * @returns embed message
 */
function usernameLengthLimitReachedEmbed(length) {
	const embedResponse = new EmbedBuilder()
		.setTitle('Username length exceeds limit  :no_entry_sign:')
		.setDescription(
			`Maximum length for Discord usernames are ${MAX_NICKNAME_LENGTH}. \
			Given username length: ${length}. \
			Please provide a shorter username.`
		)
		.setColor('Red')
		.setTimestamp()

	return embedResponse;
}


/**
 * Generates a error embed message for managed role
 * @param {*} role the managed role
 * @returns embed message
 */
function roleIsManagedEmbed(role) {
	const embedResponse = new EmbedBuilder()
		.setTitle('Role is not assignable  :no_entry_sign:')
		.setDescription(
			`${role} is managed by an external service, and is not assignable. \
			Please choose a editable role.`
		)
		.setColor('Red')
		.setTimestamp()

	return embedResponse;
}


/**
 * Generates a error embed message for non-editable role
 * 
 * @param {*} role the non-editable role
 * @param {*} client the bot client
 * @returns embed message
 */
function roleIsNotEditable(role, client) {
	const embedResponse = new EmbedBuilder()
		.setTitle('Role is not assignable  :no_entry_sign:')
		.setDescription(
			`${client} cannot assign ${role} due to insufficient permissions.

			Please ensure ${client} appears above ${role} in the servers role hierarchy, and that \
			${client} has the 'Manage Roles' permission.`
		)
		.setColor('Red')
		.setTimestamp()

	return embedResponse;
}
