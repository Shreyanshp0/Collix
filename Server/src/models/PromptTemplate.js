import mongoose from 'mongoose';

const { Schema } = mongoose;

const promptTemplateSchema = new Schema(
	{
		fingerprint: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		preferences: {
			workspaceDomain: { type: String, required: true },
			persona: { type: String, required: true },
			responseStyle: { type: String, default: 'balanced' },
			defaultMode: { type: String, default: 'hybrid' },
			creativity: { type: String, default: 'medium' },
			additionalInstructions: { type: String, default: '' },
			capabilities: { type: Schema.Types.Mixed, default: {} },
			metadata: { type: Schema.Types.Mixed, default: {} },
		},
		behavior: {
			identity: { type: String, required: true },
			expertise: { type: [String], default: [] },
			tone: { type: String, default: 'Professional' },
			responseStyle: { type: String, default: 'Balanced' },
			rules: { type: [String], default: [] },
			customInstructions: { type: String, default: '' },
		},
		compiledPrompt: {
			type: String,
			required: true,
		},
		generator: {
			provider: { type: String, default: 'groq' },
			model: { type: String, default: 'llama-3.1-8b-instant' },
			version: { type: String, default: '2026-08' },
		},
		promptVersion: {
			type: Number,
			default: 1,
		},
		usageCount: {
			type: Number,
			default: 1,
		},
	},
	{ timestamps: true }
);


const PromptTemplate = mongoose.models.PromptTemplate || mongoose.model('PromptTemplate', promptTemplateSchema);

export default PromptTemplate;
