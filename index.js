import { readdirSync } from 'fs';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
const token = process.env.GATEKEEPER_BOT_DEV_TOKEN;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();

const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
const buttonFiles = readdirSync('./buttons').filter(file => file.endsWith('.js'));
const modalFiles = readdirSync('./modals').filter(file => file.endsWith('.js'));
const eventFiles = readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = await import(`./commands/${file}`);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

for (const file of buttonFiles) {
	const button = await import(`./buttons/${file}`);
	client.buttons.set(button.data.name, button);
}

for (const file of modalFiles) {
	const modal = await import(`./modals/${file}`);
	client.modals.set(modal.data.name, modal);
}

for (const file of eventFiles) {
	const event = await import(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Login to Discord with your client's token
client.login(token);
