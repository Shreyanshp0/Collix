function send(res, statusCode, message, data) {
	return res.status(statusCode).json({ success: true, message, data });
}

export function success(res, { message = 'Request completed successfully', data = {} } = {}) {
	return send(res, 200, message, data);
}

export function created(res, { message = 'Resource created successfully', data = {} } = {}) {
	return send(res, 201, message, data);
}

export function accepted(res, { message = 'Request accepted', data = {} } = {}) {
	return send(res, 202, message, data);
}

export function noContent(res) {
	return res.status(204).send();
}

export function fail(res, { message = 'Request failed', errors = [], statusCode = 400 } = {}) {
	return res.status(statusCode).json({ success: false, message, errors });
}

export function paginated(
	res,
	{ message = 'Resources fetched successfully', items = [], page, limit, total, totalPages, hasNextPage, key = 'items', data = {} } = {}
) {
	const payload = {
		items,
		page,
		limit,
		total,
		totalPages,
		hasNextPage,
		...data,
	};

	if (key && key !== 'items') {
		payload[key] = items;
	}

	return success(res, { message, data: payload });
}
