

export const data = { name: "verify-modal" }

export async function execute(interaction) {

	await interaction.reply({ content: 'Your submission was received successfully!', ephemeral: true });
	
}
