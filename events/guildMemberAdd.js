export const name = 'guildMemberAdd';
export function execute(member) {
	console.log(`${member.id} joined ${member.guild.id}`);
}
