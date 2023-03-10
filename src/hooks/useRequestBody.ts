import { ParameterizedContext } from 'koa'

import { ValidationError } from '../errors/UserFacingErrors'
import { keysOf } from '../utils/object'
import { getMissingParamMessage, getValidationResultMessage } from '../utils/validationMessages'
import { Validator } from '../validators/types'

type CheckIfOptional<T, B extends boolean | undefined> = B extends false ? T : T | undefined

type ValidatedData<T extends Record<string, Validator<any>>> = {
	[K in keyof T]: CheckIfOptional<ReturnType<T[K]['rehydrate']>, T[K]['optional']>
}

/**
 * Hook to access request body data in JSON or form formats.
 *
 * Supported content types:
 * - `application/json`
 * - `application/x-www-form-urlencoded`
 *
 * @param ctx Koa context
 * @param validators Validator definitions
 * @returns Validated parameters
 */
export const useRequestBody = <ValidatorsT extends Record<string, Validator<any>>>(
	ctx: ParameterizedContext,
	validators: ValidatorsT
): ValidatedData<ValidatorsT> => {
	const providedParams = (ctx.request.body || {}) as Record<string, string | number | boolean | object>
	const params = keysOf(validators).map((name) => ({
		name,
		validator: validators[name],
	}))

	const missingParams = params.filter(
		(param) => !providedParams[param.name] && !validators[param.name].optional
	)

	if (missingParams.length > 0) {
		throw new ValidationError(
			`Missing body params: ${missingParams.map((param) => getMissingParamMessage(param)).join(', ')}`
		)
	}

	const validationResults = params.map((param) => {
		const paramValue = providedParams[param.name]

		// Param is optional and is not provided - skip validation
		if (paramValue === undefined) {
			return { param, validated: true }
		}

		try {
			const convertedValue = typeof paramValue === 'object' ? JSON.stringify(paramValue) : String(paramValue)
			const validatorObject = param.validator
			const prevalidatorSuccess = !validatorObject.prevalidate || validatorObject.prevalidate(convertedValue)
			const rehydratedValue = validatorObject.rehydrate(convertedValue)
			const validatorSuccess = !validatorObject.validate || validatorObject.validate(rehydratedValue)
			return {
				param,
				validated: prevalidatorSuccess && validatorSuccess,
				rehydratedValue,
			}
		} catch (error) {
			return { param, validated: false }
		}
	})

	const failedValidations = validationResults.filter((result) => !result.validated)

	if (failedValidations.length > 0) {
		throw new ValidationError(
			`Failed body param validation: ${failedValidations
				.map((result) => getValidationResultMessage(result.param))
				.join(', ')}`
		)
	}

	const successfulValidations = validationResults.filter((result) => result.validated)

	const returnValue: Record<string, unknown> = {}
	successfulValidations.forEach((result) => {
		returnValue[result.param.name] = result.rehydratedValue
	})

	return returnValue as ValidatedData<ValidatorsT>
}
