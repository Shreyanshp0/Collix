import { toUserDto } from './user.mapper.js';

function getId(value) {
	return value?.id || value?._id?.toString?.() || value?._id || value?.toString?.();
}

function toReceiptDto(receipt) {
	return { user: toUserDto(receipt.user) || { id: getId(receipt.user) }, readAt: receipt.readAt };
}

export function toMessageDto(message, { author } = {}) {
	if (!message) return null;
	const metadata = {
		type: message.type,
		attachments: message.attachments || [],
		replyTo: getId(message.replyTo) || null,
		mentions: (message.mentions || []).map((mention) => ({ user: getId(mention.user), createdAt: mention.createdAt })),
		reactions: (message.reactions || []).map((reaction) => ({ user: getId(reaction.user), emoji: reaction.emoji, createdAt: reaction.createdAt })),
		readBy: (message.readBy || []).map(toReceiptDto),
		edited: Boolean(message.edited),
		deleted: Boolean(message.deleted),
	};
	if (message.aiMetadata?.sources) metadata.sources = message.aiMetadata.sources;
	if (message.aiMetadata?.citations) metadata.citations = message.aiMetadata.citations;
	if (message.aiMetadata?.confidence) metadata.confidence = message.aiMetadata.confidence;
	if (message.aiMetadata?.promptVersion) metadata.promptVersion = message.aiMetadata.promptVersion;
	if (message.aiMetadata?.ai) metadata.ai = true;

	let authorDto;
	if (message.type === 'ai') {
		authorDto = {
			id: 'ai',
			name: message.aiMetadata?.displayName || author?.name || 'Nexus AI',
			type: 'ai',
			provider: message.aiMetadata?.provider || 'groq',
			model: message.aiMetadata?.model || 'llama-3.1-8b-instant',
		};
	} else {
		authorDto = toUserDto(author || message.sender) || { id: getId(message.sender), name: 'System' };
	}

	return {
		id: getId(message),
		author: authorDto,
		message: message.message,
		ts: message.createdAt,
		meta: metadata,
	};
}
