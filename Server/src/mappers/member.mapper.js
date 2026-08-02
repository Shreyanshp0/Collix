function getId(value) {
	return value?.id || value?._id?.toString?.() || value?._id || value?.toString?.();
}

export function toMemberDto(member) {
	if (!member) return null;

	return {
		id: getId(member),
		name: member.name || member.username || 'Member',
		role: member.role || 'member',
		status: member.status || 'offline',
	};
}
