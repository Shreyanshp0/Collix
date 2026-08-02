function getId(value) {
	return value?.id || value?._id?.toString?.() || value?._id || value?.toString?.();
}

export function toUserDto(user) {
	if (!user) return null;
	const id = getId(user);
	if (!user.name && !user.username) return id ? { id } : null;
	return {
		id,
		name: user.name || user.username,
		username: user.username,
		avatar: user.avatar || undefined,
		bio: user.bio || undefined,
		status: user.status || 'offline',
		lastSeen: user.lastSeen || null,
		isVerified: Boolean(user.isVerified),
	};
}

export function toRealtimeUserDto(user) {
	const dto = toUserDto(user);
	if (!dto) return null;
	return { id: dto.id, name: dto.name, avatar: dto.avatar, status: dto.status };
}
