function getId(value) {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'object') {
		if (value.id && typeof value.id === 'string') return value.id;
		if (value._id) return value._id.toString();
		if (typeof value.toString === 'function') {
			const str = value.toString();
			if (str !== '[object Object]') return str;
		}
	}
	return String(value);
}

export function toUserDto(user) {
	if (!user) return null;
	// If user is an unpopulated ObjectId reference or object lacking name/username, return null defensively
	if (!user.name && !user.username) return null;
	const id = getId(user);
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
