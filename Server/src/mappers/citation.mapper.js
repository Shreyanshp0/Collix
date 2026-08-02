export function toCitationDto(result) {
	if (!result) return null;

	const metadata = result.metadata || {};
	const similarityScore = typeof result.similarityScore === 'number'
		? Math.round(result.similarityScore * 1000) / 1000
		: null;

	if (metadata.sourceType === 'document' || metadata.filename) {
		return {
			sourceType: 'document',
			filename: metadata.filename || 'Document',
			page: metadata.page ?? null,
			similarityScore,
		};
	}

	if (metadata.sourceType === 'message' || metadata.messageId) {
		return {
			sourceType: 'message',
			senderName: metadata.senderName || 'Group Member',
			timestamp: metadata.createdAt || metadata.timestamp || null,
			similarityScore,
		};
	}

	return {
		sourceType: metadata.sourceType || 'unknown',
		filename: metadata.filename || null,
		similarityScore,
	};
}

export function toCitationDtoList(results = []) {
	if (!Array.isArray(results)) return [];
	return results
		.map(toCitationDto)
		.filter(Boolean);
}
