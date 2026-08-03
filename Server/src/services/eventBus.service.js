import { EventEmitter } from 'node:events';
import defaultLogger from '../utils/logger.js';

class AppEventBus extends EventEmitter {
	constructor() {
		super();
		this.setMaxListeners(50);
	}

	publish(eventName, payload) {
		defaultLogger.info(`[EventBus] Published event: ${eventName}`, {
			type: payload?.type,
			groupId: payload?.groupId || payload?.group,
		});
		this.emit(eventName, payload);
	}
}

export const eventBus = new AppEventBus();
export default eventBus;
