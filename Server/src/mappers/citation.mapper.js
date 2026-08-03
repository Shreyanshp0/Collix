export function toCitationDto(result) {
	if (!result) return null;

	const metadata = result.metadata || {};
	const similarityScore = typeof result.similarityScore === 'number'
		? Math.round(result.similarityScore * 1000) / 1000
		: null;

	if (metadata.sourceType === 'document' || metadata.filename) {
		const rawText = (result.text || metadata.text || '').trim();
		const snippet = rawText.length > 280 ? `${rawText.slice(0, 280)}...` : rawText;
		return {
			sourceType: 'document',
			documentId: metadata.documentId || metadata.sourceId || null,
			name: metadata.filename || 'Document',
			filename: metadata.filename || 'Document',
			page: metadata.page ?? null,
			chunk: metadata.chunkIndex ?? null,
			snippet,
			similarityScore,
		};
	}

	if (metadata.sourceType === 'message' || metadata.messageId) {
		const rawText = (result.text || metadata.text || '').trim();
		const snippet = rawText.length > 280 ? `${rawText.slice(0, 280)}...` : rawText;
		return {
			sourceType: 'message',
			senderName: metadata.senderName || 'Group Member',
			timestamp: metadata.createdAt || metadata.timestamp || null,
			snippet,
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
