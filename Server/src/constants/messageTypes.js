export const MESSAGE_TYPES = Object.freeze({
	TEXT: 'text',
	IMAGE: 'image',
	DOCUMENT: 'document',
	AUDIO: 'audio',
	VIDEO: 'video',
	SYSTEM: 'system',
	AI: 'ai',
});

export const MESSAGE_TYPE_VALUES = Object.freeze(Object.values(MESSAGE_TYPES));
export const TEXT_REQUIRED_MESSAGE_TYPES = Object.freeze([
	MESSAGE_TYPES.TEXT,
	MESSAGE_TYPES.SYSTEM,
	MESSAGE_TYPES.AI,
]);
export const MAX_MESSAGE_LENGTH = 10_000;
