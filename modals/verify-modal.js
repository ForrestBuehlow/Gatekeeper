import { verifyFromModal } from '../utilities/verify-utilities.js';

export const data = { name: "verify-modal" }

export async function execute(interaction) {

	await verifyFromModal(interaction);
	
}
