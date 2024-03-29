# Moonflower

> This section is work-in-progress.

Moonflower is a TypeScript-first [Koa Router](https://www.npmjs.com/package/koa-router) extension that allows for automatic [OpenAPI](https://www.openapis.org/what-is-openapi) spec generation directly from backend code, without any extra work. Combined with an ORM like [Prisma.js](https://www.npmjs.com/package/prisma) and an API client generator on frontend, it allows for creation of end-to-end type safe REST API.

Moonflower provides type safe 'hooks' that handle runtime validation and return clean types with minimal boilerplate.

## Feature Overview

- React hooks inspired Node.js backend REST API
- Fully type safe definitions for path, query and header params, request body and response
- Minimal boilerplate code
- Out-of-the-box OpenAPI 3.1.0 spec generation

## Usage example

For a more detailed example, see the [Moonflower Example App](https://github.com/Tenebrie/moonflower-example). 

Every variable and parameter in this example is fully typed.

```ts
const router = new Router()

router.post('/auth', (ctx) => {
    useApiEndpoint({
        name: 'createAccount',
        summary: 'Registration endpoint',
        description: 'Creates a new user account with provided credentials',
    })

    const body = useRequestBody(ctx, {
        email: EmailValidator,
        username: NonEmptyStringValidator,
        password: NonEmptyStringValidator,
    })

    const user = UserService.register(body.email, body.username, body.password)
    const token = TokenService.generateJwtToken(user)

    return {
        accessToken: token,
    }
})
```

Outputs the following spec (parts omitted for brevity):

```json
"/auth": {
    "post": {
        "operationId": "createAccount",
        "summary": "Registration endpoint",
        "description": "Creates a new user account with provided credentials",
        "parameters": [],
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "email": {
                                "type": "string"
                            },
                            "username": {
                                "type": "string"
                            },
                            "password": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "email",
                            "username",
                            "password"
                        ]
                    }
                },
            }
        },
        "responses": {
            "200": {
                "content": {
                    "application/json": {
                        "schema": {
                            "oneOf": [{
                                "type": "object",
                                "properties": {
                                    "accessToken": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "accessToken"
                                ]
                            }]
                        }
                    }
                }
            }
        }
    }
}
```

## Getting Started

> This package requires a TypeScript based project. OpenAPI spec is created through parsing the TypeScript AST and can't be done in plain JS projects.

Install dependencies:

```bash
yarn add moonflower koa @koa/router koa-bodyparser
```

Create a Koa instance with required middleware

```ts
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { HttpErrorHandler, initOpenApiEngine, Router } from 'moonflower'

const app = new Koa()
const myRouter = new Router()

myRouter.get('/api/hello', (ctx) => {
    /* Unlike in Koa, all endpoints must do a plain return.
     * However, Koa context is still available for edge cases.
     */
    return {
        greeting: 'hello world',
    }
})

app
    // Returns standard HTTP errors for common requests
    .use(HttpErrorHandler)
    .use(
        // Required for requests with body
        bodyParser({
            enableTypes: ['text', 'json', 'form'],
        })
    )
    // Register the router in Koa
    .use(myRouter.routes())
    .use(myRouter.allowedMethods())
    .use(
        // Enables collection of OpenAPI spec from code
        initOpenApiEngine({
            tsconfigPath: './tsconfig.json',
        })
    )
```

### Planned features

- Support for list query params
- Support for thrown errors in OpenApi engine
- Support for binary data responses
- Support for multipart form data

### Known issues

- Exported models are referenced by name only, leading to potential name collisions

# Hooks
> This section is work-in-progress.

```ts
// Dangling hooks
useApiHeader({...})

// Endpoint hooks
const params = usePathParams(ctx, {...})
const query = useQueryParams(ctx, {...})
const body = useRequestBody(ctx, {...})
const rawBody = useRequestRawBody(ctx, {...})
```

# Validators

Validators are a primary way to define and validate user input. A validator is run for every parameter received from the client, checking it for validity and transforming it from a plain string to a value of a correct type. Failed validation or an error thrown during validation will return 400 Bad Request to the user.

**Example:**

```ts
const query = useQueryParams(ctx, {
    name: RequiredParam(StringValidator),
    fooBar: OptionalParam<{ foo: string; bar: string }>({
        parse: (v) => JSON.parse(v),
        validate: (v) => !!v.foo && !!v.bar
    }),
})

query.name   // type is 'string'
query.fooBar // type is '{ foo: string; bar: string } | undefined'
```

## Built-in validators

The most common validators are available out-of-the-box.

```ts
const query = useQueryParams(ctx, {
    myNumber: NumberValidator,
    myString: StringValidator,
    myBoolean: BooleanValidator,
})

query.myNumber  // type is 'number'
query.myString  // type is 'string'
query.myBoolean // type is 'boolean'
```

The following validators are available:

- `BooleanValidator`
- `NumberValidator`
- `StringValidator`
- `EmailValidator`
- `NonEmptyStringValidator`
- `BigIntValidator`
- `NullableBooleanValidator`
- `NullableNumberValidator`
- `NullableStringValidator`
- `NullableBigIntValidator`

## Required and optional parameters
```ts
const query = useQueryParams(ctx, {
    predefinedBool: BooleanValidator,
    optionalBool: OptionalParam(BooleanValidator),
    customBool: RequiredParam({
        parse: (v) => v === '1',
    }),
    customOptionalBool: OptionalParam({
        parse: (v) => v === '1',
    }),
})

query.predefinedBool     // type is 'boolean'
query.optionalBool       // type is 'boolean | undefined'
query.customBool         // type is 'boolean'
query.customOptionalBool // type is 'boolean | undefined'
```

## Custom validators

Custom validators are simple objects that can be defined either inline, or elsewhere for reusability.

### Inline

```ts
const query = useQueryParams(ctx, {
    numberInRange: RequiredParam({
        parse: (v) => Number(v),
        validate: (v) => !isNaN(v) && v >= 0 && v <= 100,
    }),
    optionalBoolean: OptionalParam({
        parse: (v) => v === '1',
    }),
})

query.numberInRange   // type is 'number'
query.optionalBoolean // type is 'boolean | undefined'
```

### Using Zod

Zod schemas are compatible with validators, allowing you to directly use them to define runtime validation.

```ts
const body = useRequestBody(ctx, {
    email: RequiredParam(z.string().email()),
    password: RequiredParam(z.string()),
})

const { email, password } = body
```

## Anatomy of a validator

A validator contains a number of functions that are useful to check and transform incoming data.

### Parse

> `parse: (v: string) => T extends any`

The only required function of a validator. It takes the raw input param and transforms it into correct data type. The return type of `parse` will match the one specified in the `RequiredParam` or `OptionalParam` generics, or will be used to infer the type.

Make sure that it returns a correctly typed object.

An error thrown during parsing will be caught by HttpErrorHandler middleware and return `400 Bad Request` to the user.

### Validate

> `validate: (v: T) => boolean`

This function is called on incoming data after it is parsed. 

Returning `false` or any falsy value will cause the validation to fail, and `400 Bad Request` to be sent back to the client.

### Prevalidate

> `prevalidate: (v: string) => boolean`

This function is called on incoming data before it is parsed. Useful in cases where rehydration function is slow (i.e. includes a DB read), and some premature validation is desired. In most cases, however, `validate` is preferred.

The behaviour is identical to `validate`, aside from the call order.

### Type inference

In many cases, type of the parameter can be inferred from the return value of `parse` function. For more complex objects, it is possible to specify the type with `as ...` clause:


```ts
useQueryParams(ctx, {
    fooBar: RequiredParam({
        parse: (v) => JSON.parse(v) as { foo: string; bar: string },
        validate: (v) => !!v.foo && !!v.bar
    }),
})
```

Alternatively, the expected type can be mentioned in `RequiredParam`, `OptionalParam` or `PathParam` generics:

```ts
useQueryParams(ctx, {
    fooBar: RequiredParam<{ foo: string; bar: string }>({
        parse: (v) => JSON.parse(v),
        validate: (v) => !!v.foo && !!v.bar
    }),
})
```

### :warning: Avoid :warning:

While the following is valid code, the type of the parameter can't be inferred as TS will not parse this as a Validator type. The type of `validate` will be `(v: any) => boolean`, which is unsafe.

```ts
useQueryParams(ctx, {
    myParam: {
        parse: (v) => Number(v),
        validate: (v) => v > 0,
        optional: false,
    },
})
```

# Path params

Path params have extra binding to the endpoint path. Only the properties mentioned in the path can be used.

```ts
router.get('/user/:userId', (ctx) => {
    const params = usePathParams(ctx, {
        userId: StringValidator,   // valid
        username: StringValidator, // 'username' is not a path param
    })

    params.userId  // type is 'string'
}
```

## Optional path params

Following standard Koa way of defining an optional param, a param marked by a question mark is considered optional.

An optional param may exist in the request or be omitted entirely, but it must still pass the validation.

```ts
router.get('/user/:userId?', (ctx) => {
    const params = usePathParams(ctx, {
        userId: StringValidator,
    })

    params.userId  // type is 'string | undefined'
}
```

## Custom path parameters

As parameter optionaliy is defined in a path, `RequiredParam` and `OptionalParam` will be treated the same. To reduce confusion, `PathParam` is available as an alias.

```ts
router.get('/user/:numberId', (ctx) => {
    usePathParams(ctx, {
        numberId: PathParam({
            parse: (v) => Number(v),
            validate: (v) => !isNaN(v) && v >= 0 && v <= 100,
        })
    })
}
```

## Escape hatch

All Koa and Koa Router APIs are still available in case some functionality is unavailable through Moonflower. Endpoints provide a `ctx` prop, and the router exposes `koaRouter` which is raw underlying router implementation.

However, avoiding Moonflower's API will degrade the quality of the generated spec.
