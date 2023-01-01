import * as path from 'path'
import { Project, SourceFile } from 'ts-morph'
import { analyzeSourceFile } from '../analyzerModule'

describe('OpenApi Analyzer', () => {
	let dataFile: SourceFile

	beforeAll(() => {
		const project = new Project({
			tsConfigFilePath: path.resolve('./tsconfig.json'),
		})

		const sourceFile = project.getSourceFile('openApiAnalyzer.spec.data.ts')
		if (!sourceFile) {
			throw new Error('Where file?')
		}

		dataFile = sourceFile
	})

	describe('when analyzing a test data file', () => {
		let analysisResult: ReturnType<typeof analyzeSourceFile>

		const analyzeEndpointById = (id: string) => {
			analysisResult = analyzeSourceFile(dataFile, [`/test/${id}`])
			const endpoint = analysisResult.find((endpoint) => endpoint.path.startsWith(`/test/${id}`))
			if (!endpoint) {
				throw new Error(`No endpoint with id ${id} found!`)
			}
			return endpoint
		}

		describe('useApiEndpoint', () => {
			it('parses useApiEndpoint values correctly', () => {
				const endpoint = analyzeEndpointById('908c3e74-cf67-4ec7-a281-66a79f95d44d')

				expect(endpoint.name).toEqual('Test endpoint name')
				expect(endpoint.summary).toEqual('Test endpoint summary')
				expect(endpoint.description).toEqual('Test endpoint description')
			})
		})

		describe('usePathParams', () => {
			it('parses inline usePathParams validators correctly', () => {
				const endpoint = analyzeEndpointById('bf6147f2-a1dc-4cc2-8327-e6f041f828bf')

				expect(endpoint.params[0].identifier).toEqual('firstParam')
				expect(endpoint.params[0].signature).toEqual('string')
				expect(endpoint.params[0].optional).toEqual(false)
				expect(endpoint.params[1].identifier).toEqual('secondParam')
				expect(endpoint.params[1].signature).toEqual('boolean')
				expect(endpoint.params[1].optional).toEqual(false)
				expect(endpoint.params[2].identifier).toEqual('optionalParam')
				expect(endpoint.params[2].signature).toEqual('number')
				expect(endpoint.params[2].optional).toEqual(true)
			})

			it('parses built-in usePathParams validators correctly', () => {
				const endpoint = analyzeEndpointById('ef25ef5e-0f8f-4732-bf59-8825f94a5287')

				expect(endpoint.params[0].identifier).toEqual('firstParam')
				expect(endpoint.params[0].signature).toEqual('string')
				expect(endpoint.params[0].optional).toEqual(false)
				expect(endpoint.params[1].identifier).toEqual('secondParam')
				expect(endpoint.params[1].signature).toEqual('boolean')
				expect(endpoint.params[1].optional).toEqual(false)
				expect(endpoint.params[2].identifier).toEqual('optionalParam')
				expect(endpoint.params[2].signature).toEqual('number')
				expect(endpoint.params[2].optional).toEqual(true)
			})

			it('parses complex usePathParams validator correctly', () => {
				const endpoint = analyzeEndpointById('5ab5dd0d-b241-4378-bea1-a2dd696d699a')

				expect(endpoint.params[0].identifier).toEqual('firstParam')
				expect(endpoint.params[0].signature).toEqual([
					{
						role: 'property',
						identifier: 'foo',
						shape: 'string',
						optional: false,
					},
					{
						role: 'property',
						identifier: 'bar',
						shape: 'string',
						optional: false,
					},
				])
				expect(endpoint.params[0].optional).toEqual(false)
				expect(endpoint.params[1].identifier).toEqual('secondParam')
				expect(endpoint.params[1].signature).toEqual([
					{
						role: 'property',
						identifier: 'foo',
						shape: 'string',
						optional: false,
					},
					{
						role: 'property',
						identifier: 'bar',
						shape: 'string',
						optional: false,
					},
				])
				expect(endpoint.params[1].optional).toEqual(false)
			})

			it('parses usePathParams validator with optional types correctly', () => {
				const endpoint = analyzeEndpointById('209df2a1-55f9-4859-bc31-3277547c7d88')

				expect(endpoint.params[0].identifier).toEqual('firstParam')
				expect(endpoint.params[0].signature).toEqual([
					{
						identifier: 'foo',
						optional: true,
						role: 'property',
						shape: 'string',
					},
				])
				expect(endpoint.params[0].optional).toEqual(false)
				expect(endpoint.params[1].identifier).toEqual('secondParam')
				expect(endpoint.params[1].signature).toEqual([
					{
						identifier: 'foo',
						optional: true,
						role: 'property',
						shape: 'string',
					},
				])
				expect(endpoint.params[1].optional).toEqual(false)
			})

			it('parses usePathParams validator with union types correctly', () => {
				const endpoint = analyzeEndpointById('89d961f1-7d36-4271-8bd3-665ee0992590')

				expect(endpoint.params[0].identifier).toEqual('firstParam')
				expect(endpoint.params[0].signature).toEqual([
					{
						identifier: 'foo',
						optional: false,
						role: 'property',
						shape: [
							{
								role: 'union',
								optional: false,
								shape: [
									{
										role: 'union_entry',
										shape: 'string',
										optional: false,
									},
									{
										role: 'union_entry',
										shape: 'number',
										optional: false,
									},
								],
							},
						],
					},
				])
				expect(endpoint.params[0].optional).toEqual(false)
				expect(endpoint.params[1].identifier).toEqual('secondParam')
				expect(endpoint.params[1].signature).toEqual([
					{
						identifier: 'foo',
						optional: false,
						role: 'property',
						shape: [
							{
								role: 'union',
								optional: false,
								shape: [
									{
										role: 'union_entry',
										shape: 'string',
										optional: false,
									},
									{
										role: 'union_entry',
										shape: 'number',
										optional: false,
									},
								],
							},
						],
					},
				])
				expect(endpoint.params[1].optional).toEqual(false)
			})

			it('parses params with destructuring correctly', () => {
				const endpoint = analyzeEndpointById('39669151-c529-4bcd-86a5-a10de7834104')

				expect(endpoint.params).toEqual([{ identifier: 'foo', optional: false, signature: 'string' }])
			})
		})

		describe('useQueryParams', () => {
			it('parses inline useQueryParams validators correctly', () => {
				const endpoint = analyzeEndpointById('f89310d9-25ac-4005-93e4-614179d3bbd4')

				expect(endpoint.query[0].identifier).toEqual('firstParam')
				expect(endpoint.query[0].signature).toEqual('string')
				expect(endpoint.query[0].optional).toEqual(false)
				expect(endpoint.query[1].identifier).toEqual('secondParam')
				expect(endpoint.query[1].signature).toEqual('boolean')
				expect(endpoint.query[1].optional).toEqual(true)
				expect(endpoint.query[2].identifier).toEqual('thirdParam')
				expect(endpoint.query[2].signature).toEqual('number')
				expect(endpoint.query[2].optional).toEqual(true)
			})

			it('parses enum union query type correctly', () => {
				const endpoint = analyzeEndpointById('7c51de80-1ff1-4511-b0d3-8a75c296c507')

				expect(endpoint.query[0].signature).toEqual([
					{
						role: 'union',
						shape: [
							{
								role: 'union_entry',
								shape: [{ role: 'literal_string', shape: 'dec', optional: false }],
								optional: false,
							},
							{
								role: 'union_entry',
								shape: [{ role: 'literal_string', shape: 'hex', optional: false }],
								optional: false,
							},
							{
								role: 'union_entry',
								shape: [{ role: 'literal_string', shape: 'bin', optional: false }],
								optional: false,
							},
						],
						optional: false,
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses enum query type correctly', () => {
				const endpoint = analyzeEndpointById('724a56ef-32f9-4c59-b22c-60bd33e45242')

				expect(endpoint.query[0].signature).toEqual([
					{ role: 'literal_string', shape: 'hello world', optional: false },
				])
				expect(endpoint.responses.length).toEqual(1)
			})
		})

		describe('useRequestRawBody', () => {
			it('parses inline useRequestRawBody validator correctly', () => {
				const endpoint = analyzeEndpointById('6040cd01-a0c6-4b70-9901-b647f19b19a7')

				const body = endpoint.rawBody
				if (!body) {
					throw new Error('No body definition found')
				}
				expect(body.signature).toEqual([
					{
						identifier: 'foo',
						role: 'property',
						shape: 'string',
						optional: false,
					},
					{
						identifier: 'bar',
						role: 'property',
						shape: 'number',
						optional: true,
					},
				])
				expect(body.optional).toEqual(false)
			})

			it('parses inline useRequestRawBody validator correctly with alternative typing', () => {
				const endpoint = analyzeEndpointById('f3754325-6d9c-42b6-becf-4a9e72bd2c4e')

				const body = endpoint.rawBody
				if (!body) {
					throw new Error('No body definition found')
				}
				expect(body.signature).toEqual([
					{
						identifier: 'foo',
						role: 'property',
						shape: 'string',
						optional: false,
					},
					{
						identifier: 'bar',
						role: 'property',
						shape: 'number',
						optional: true,
					},
				])
				expect(body.optional).toEqual(false)
			})

			it('parses optional useRequestRawBody validator correctly', () => {
				const endpoint = analyzeEndpointById('1ab973ff-9937-4e2d-b432-ff43a9df42cb')

				const body = endpoint.rawBody
				if (!body) {
					throw new Error('No body definition found')
				}
				expect(body.signature).toEqual([
					{
						identifier: 'foo',
						role: 'property',
						shape: 'string',
						optional: false,
					},
					{
						identifier: 'bar',
						role: 'property',
						shape: 'number',
						optional: true,
					},
				])
				expect(body.optional).toEqual(true)
			})

			it('parses optional built-in useRequestRawBody validator correctly', () => {
				const endpoint = analyzeEndpointById('f74f6003-2aba-4f8c-855e-c0149f4217b7')

				const body = endpoint.rawBody
				if (!body) {
					throw new Error('No body definition found')
				}
				expect(body.signature).toEqual('boolean')
				expect(body.optional).toEqual(true)
			})
		})

		describe('useRequestBody', () => {
			it('parses inline useRequestBody validators correctly', () => {
				const endpoint = analyzeEndpointById('e8e5496b-11a0-41e3-a68d-f03d524e413c')

				expect(endpoint.objectBody[0].identifier).toEqual('firstParam')
				expect(endpoint.objectBody[0].signature).toEqual('string')
				expect(endpoint.objectBody[0].optional).toEqual(false)
				expect(endpoint.objectBody[1].identifier).toEqual('secondParam')
				expect(endpoint.objectBody[1].signature).toEqual('boolean')
				expect(endpoint.objectBody[1].optional).toEqual(true)
				expect(endpoint.objectBody[2].identifier).toEqual('thirdParam')
				expect(endpoint.objectBody[2].signature).toEqual('number')
				expect(endpoint.objectBody[2].optional).toEqual(true)
			})
		})

		describe('endpoint return value', () => {
			it('parses simple return value correctly', () => {
				const endpoint = analyzeEndpointById('e1bedf55-6d3a-4c01-9c66-6ec74cc66c3b')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual('string')
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses multiple return values correctly', () => {
				const endpoint = analyzeEndpointById('78ad5fba-f4e2-4924-b28a-23e39dd146f7')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual('string')
				expect(endpoint.responses[1].status).toEqual(200)
				expect(endpoint.responses[1].signature).toEqual('number')
				expect(endpoint.responses[2].status).toEqual(200)
				expect(endpoint.responses[2].signature).toEqual('boolean')
				expect(endpoint.responses.length).toEqual(3)
			})

			it('parses type inferred return value object correctly', () => {
				const endpoint = analyzeEndpointById('c542cb10-538c-44eb-8d13-5111e273ead0')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						role: 'property',
						identifier: 'foo',
						shape: 'string',
						optional: false,
					},
					{
						role: 'property',
						identifier: 'bar',
						shape: 'number',
						optional: false,
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses return value object with optional values correctly', () => {
				const endpoint = analyzeEndpointById('03888127-6b97-42df-b429-87a6588ab2a4')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						role: 'property',
						identifier: 'foo',
						shape: 'string',
						optional: true,
					},
					{
						role: 'property',
						identifier: 'bar',
						shape: 'number',
						optional: true,
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses return value object with union values correctly', () => {
				const endpoint = analyzeEndpointById('b73347dc-c16f-4272-95b4-bf1716bf9c14')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						identifier: 'foo',
						optional: false,
						role: 'property',
						shape: [
							{
								optional: false,
								role: 'union',
								shape: [
									{ optional: false, role: 'union_entry', shape: 'string' },
									{ optional: false, role: 'union_entry', shape: 'number' },
									{ optional: false, role: 'union_entry', shape: 'boolean' },
								],
							},
						],
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses return value object with union values in async function correctly', () => {
				const endpoint = analyzeEndpointById('666b9ed1-62db-447a-80a7-8f35ec50ab02')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						identifier: 'foo',
						optional: false,
						role: 'property',
						shape: 'number',
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses return of query params correctly', () => {
				const endpoint = analyzeEndpointById('97bb5db8-1871-4c1d-998e-a724c04c5741')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						identifier: 'foo',
						optional: false,
						role: 'property',
						shape: 'string',
					},
					{
						identifier: 'bar',
						optional: true,
						role: 'property',
						shape: 'boolean',
					},
					{
						identifier: 'baz',
						optional: true,
						role: 'property',
						shape: 'number',
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses return of union type query params correctly', () => {
				const endpoint = analyzeEndpointById('4188ebf2-eae6-4994-8732-c7f43d4da861')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						identifier: 'test',
						optional: false,
						role: 'property',
						shape: 'string',
					},
				])
				expect(endpoint.responses[1].status).toEqual(200)
				expect(endpoint.responses[1].signature).toEqual([
					{
						identifier: 'foo',
						optional: false,
						role: 'property',
						shape: 'string',
					},
					{
						identifier: 'bar',
						optional: true,
						role: 'property',
						shape: 'boolean',
					},
					{
						identifier: 'baz',
						optional: true,
						role: 'property',
						shape: 'number',
					},
				])
				expect(endpoint.responses.length).toEqual(2)
			})

			it('parses return record type correctly', () => {
				const endpoint = analyzeEndpointById('32f18a25-2408-46cf-9519-f9a8d855bf84')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						role: 'record',
						shape: [
							{
								identifier: 'foo',
								optional: false,
								role: 'property',
								shape: 'string',
							},
							{
								identifier: 'bar',
								optional: false,
								role: 'property',
								shape: 'string',
							},
						],
						optional: false,
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses no-return endpoint correctly', () => {
				const endpoint = analyzeEndpointById('196f2937-e369-435f-b239-62eaacaa6fbd')

				expect(endpoint.responses[0].status).toEqual(204)
				expect(endpoint.responses[0].signature).toEqual('void')
				expect(endpoint.responses.length).toEqual(1)
			})

			it('parses circular dependency correctly', () => {
				const endpoint = analyzeEndpointById('33a0f888-396e-4c4d-b1d9-4cf6600ab88d')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual('string')
				expect(endpoint.responses[1].status).toEqual(200)
				expect(endpoint.responses[1].signature).toEqual([
					{ role: 'array', shape: 'circular', optional: false },
				])
				expect(endpoint.responses.length).toEqual(2)
			})

			it('parses array return type correctly', () => {
				const endpoint = analyzeEndpointById('e3659429-1a05-4590-a5a6-dc80a30878e6')

				expect(endpoint.responses[0].status).toEqual(200)
				expect(endpoint.responses[0].signature).toEqual([
					{
						role: 'array',
						shape: 'string',
						optional: false,
					},
				])
				expect(endpoint.responses.length).toEqual(1)
			})
		})
	})
})