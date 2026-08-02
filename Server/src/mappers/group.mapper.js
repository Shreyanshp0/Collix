function getId(value) {
	return value?.id || value?._id?.toString?.() || value?._id || value?.toString?.();
}

export function toGroupDto(group, { memberCount, documentCount } = {}) {
	if (!group) return null;
	return {
		id: getId(group),
		name: group.name,
		description: group.description || undefined,
		image: group.image || undefined,
		visibility: group.visibility,
		ownerId: getId(group.owner),
		createdAt: group.createdAt,
		archived: Boolean(group.archived),
		...(memberCount !== undefined ? { memberCount } : {}),
		...(documentCount !== undefined ? { documentCount } : {}),
	};
}

export function toGroupSummaryDto(summary) {
	return toGroupDto(summary.group, summary);
}
