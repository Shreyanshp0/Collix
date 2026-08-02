import { ValidationError } from '../utils/AppError.js';

function runValidator(validator, value, req, key) {
	if (typeof validator === 'function') {
		return validator(value, req, key);
	}

	if (validator && typeof validator.safeParse === 'function') {
		const result = validator.safeParse(value);

		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	if (validator && typeof validator.validate === 'function') {
		return validator.validate(value, req, key);
	}

	throw new ValidationError(`Invalid validator configuration for ${key}`);
}

export function validate(validations = {}) {
	return (req, res, next) => {
		try {
			const targets = [
				{ key: 'body', value: req.body },
				{ key: 'params', value: req.params },
				{ key: 'query', value: req.query },
			];

			for (const { key, value } of targets) {
				const validator = validations[key];

				if (!validator) {
					continue;
				}

				const result = runValidator(validator, value, req, key);

				if (result !== undefined) {
					req[key] = result;
				}
			}

			next();
		} catch (error) {
			next(error);
		}
	};
}

export default validate;
