# Framework documentation
> This section is work-in-progress.

This package is NOT FINISHED, use at your own risk.

## Feature Overview

- React hooks inspired backend REST API
- Fully type-safe definitions for path, query and header params, request body and response
- Minimal boilerplate code
- Out-of-the-box OpenAPI 3.0.3 spec generation

## Planned features

- `useCookies` hook to work with cookies
- `useAuthentication` hook for native auth
- Support for list query params
- Proper support for router-level middleware
- Ability to output spec as file
- CLI-level spec generation function
- Support for thrown errors in OpenApi engine
- Support for binary data responses
- Support for multipart form data

## Known issues
- `null` type may appear in spec
- Exported models are referenced by name only, leading to potential name collisions and invalid spec

# Hooks
> This section is work-in-progress.

```ts
const params = usePathParams(ctx, {...})
const query = useQueryParams(ctx, {...})
const body = useRequestBody(ctx, {...})
const rawBody = useRequestRawBody(ctx, {...})
```

# Validators
> This section is work-in-progress.

Validators are run for every parameter received from the client.

**Example:**

```ts
const query = useQueryParams(ctx, {
    name: RequiredParam(StringValidator),
    fooBar: OptionalParam<{ foo: string; bar: string }>({
        rehydrate: (v) => JSON.parse(v),
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

## Required and optional parameters
```ts
const query = useQueryParams(ctx, {
    predefinedBool: BooleanValidator,
    optionalBool: OptionalParam(BooleanValidator),
    customBool: RequiredParam({
        prevalidate: (v) => v === '0' || v === '1',
        rehydrate: (v) => v === '1',
    }),
    customOptionalBool: OptionalParam({
        prevalidate: (v) => v === '0' || v === '1',
        rehydrate: (v) => v === '1',
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
        rehydrate: (v) => Number(v),
        validate: (v) => !isNaN(v) && v >= 0 && v <= 100,
    }),
    optionalBoolean: OptionalParam({
        prevalidate: (v) => v === '0' || v === '1',
        rehydrate: (v) => v === '1',
    }),
})

query.numberInRange   // type is 'number'
query.optionalBoolean // type is 'boolean | undefined'
```

## Anatomy of a validator

A validator contains a number of functions that are useful to check and transform incoming data.

### Rehydrate

> `rehydrate: (v: string) => T extends any`

The only required function of a validator. It takes the raw input param and transforms it into correct data type. The return type of `rehydrate` will match the one specified in the `RequiredParam` or `OptionalParam` generics, or will be used to infer the type.

Make sure that it returns a correctly typed object.

### Validate

> `validate: (v: T) => boolean`

This function is called on incoming data after it is rehydrated. 

Returning `false` or any falsy value will cause the validation to fail, and `400 Bad Request` to be sent back to the client.

### Prevalidate

> `prevalidate: (v: string) => boolean`

This function is called on incoming data before it is rehydrated. Useful in cases where rehydration function is slow (i.e. includes a DB read), and some premature validation is desired. In most cases, however, `validate` is preferred.

The behaviour is identical to `validate`, aside from the call order.

### Type inference

In many cases, type of the parameter can be inferred from the return value of `rehydrate` function. For more complex objects, it is possible to specify the type with `as ...` clause:


```ts
useQueryParams(ctx, {
    fooBar: RequiredParam({
        prevalidate: (v) => v.length > 5,
        rehydrate: (v) => JSON.parse(v) as { foo: string; bar: string },
        validate: (v) => !!v.foo && !!v.bar
    }),
})
```

Alternatively, the expected type can be mentioned in `RequiredParam`, `OptionalParam` or `PathParam` generics:

```ts
useQueryParams(ctx, {
    fooBar: RequiredParam<{ foo: string; bar: string }>({
        prevalidate: (v) => v.length > 5,
        rehydrate: (v) => JSON.parse(v),
        validate: (v) => !!v.foo && !!v.bar
    }),
})
```

### Avoid

While the following is valid code, the type of the parameter can't be inferred as TS will not parse this as Validator type. The type of `validate` will be `(v: any) => boolean`, which is unsafe.

```ts
useQueryParams(ctx, {
    myParam: {
        rehydrate: (v) => Number(v),
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

```ts
router.get('/user/:userId?', (ctx) => {
	const params = usePathParams(ctx, {
		userId: StringValidator,
	})

    params.userId  // type is 'string | undefined'
}
```

## Custom path parameters

As parameter optionaliy is defined in a path, `RequiredParam` and `OptionalParam` will be ignored. To reduce confusion, `PathParam` is available.

```ts
router.get('/user/:numberId', (ctx) => {
	usePathParams(ctx, {
		numberId: PathParam({
            rehydrate: (v) => Number(v),
            validate: (v) => !isNaN(v) && v >= 0 && v <= 100,
        })
	})
}
```
