function sendErrorResponse(res, statusCode, message) {
	return res.status(statusCode).json({
		success: false,
		message,
	});
}
export default sendErrorResponse;