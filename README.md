# Business Cards REST API

**English** | [עברית](README.he.md)

A REST API server for a business cards application, written with **Node.js**,
**TypeScript** and **MongoDB**.

Regular users can browse cards and like them, business users can publish their own cards
and manage them, and an admin can see every user in the system and hand a card a new
business number.

---

## Table of contents

- [Getting started](#getting-started)
- [Environments](#environments)
- [Project structure](#project-structure)
- [How a request flows through the server](#how-a-request-flows-through-the-server)
- [Authentication and authorization](#authentication-and-authorization)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Validation](#validation)
- [Initial data](#initial-data)
- [Bonuses](#bonuses)
- [Error responses](#error-responses)
- [Logging](#logging)

---

## Getting started

### Requirements

- Node.js 24 or newer (the server runs the TypeScript files directly, without a build step)
- MongoDB - either a local server on `mongodb://localhost:27017` or an Atlas cluster
- pnpm (the project is locked with `pnpm@10.28.2`)

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev     # development - local MongoDB, port 3000, reloads on change (nodemon)
pnpm test    # test        - local MongoDB, port 8081
pnpm prod    # production  - MongoDB Atlas, port 80
```

`pnpm dev` and `pnpm prod` pipe the output through `pino-pretty`. The server prints its
address on start:

```
Server runs on: http://localhost:3000
```

Every route is served under the `/api/v1` prefix, for example
`http://localhost:3000/api/v1/cards`.

### Trying it out

The `rest/` folder holds ready made requests for the
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension of VS Code:

1. Open `rest/users.rest` (or `rest/cards.rest`)
2. Set `@host` to the port of the environment you run - the files point at port `80`
   (`pnpm prod`), for `pnpm dev` use `http://localhost:3000/api/v1`
3. Send the login request of one of the [initial users](#initial-data)
4. Copy the token from the answer into the `@token` variable at the top of the file

Every other request in the file is then ready to be sent.

---

## Environments

The environment files live in `src/config` and are loaded by
[dotenvx](https://dotenvx.com) through the scripts of `package.json`.
Each script loads its own file **first** and the shared `.env` file after it. dotenvx
keeps the first value it sees, so `.env` holds the defaults and the environment file
overrides only what changes:

| File | Environment | What it sets |
| --- | --- | --- |
| `.env` | shared defaults | port `80`, `CLIENT_URL`, `APP_NAME`, `JWT_SECRET` |
| `.env.development` | `pnpm dev` | local `biz_cards_dev` database, port `3000`, `debug` logs |
| `.env.test` | `pnpm test` | local database, port `8081` |
| `.env.production` | `pnpm prod` | MongoDB Atlas, the GitHub Pages client, `error` logs only |

| Variable | Meaning |
| --- | --- |
| `DB_CONNECTION_STRING` | MongoDB connection string |
| `PORT` | The port the server listens on |
| `CLIENT_URL` | The address of the client application - it is added to the CORS allow list |
| `NODE_ENV` | `development` / `test` / `production` |
| `LOG_LEVEL` | `fatal` / `error` / `info` / `debug` |
| `APP_NAME` | The name of the application |
| `JWT_SECRET` | The secret the tokens are signed with |

`src/config/index.ts` validates all of them with a Zod schema **before** the server starts.
A missing or a broken variable stops the process with a clear message instead of letting
the server run half configured.

> The environment files are committed so the project can be checked easily. In a real
> application they hold secrets and belong in `.gitignore`.

---

## Project structure

```
rest/                    Ready made requests for the REST Client extension
logs/                    The daily files of the file logger (created on the first failure)
src/
├── @types/              Type declarations that extend express (req.user) and jose (the payload)
├── config/              The .env files and their validation
├── database/
│   ├── connect.ts       Opens the connection and initializes the data
│   ├── init-db.ts       Creates the initial users and cards
│   ├── initial-users.ts Three users - regular, business and admin
│   ├── initial-cards.ts Three business cards
│   ├── models.ts        The mongoose models and their custom methods
│   └── schemas/         The mongoose schemas (user, card, name, address, image)
├── error/               HttpError and NotFoundError
├── middleware/          Everything that runs before and after the routes, the logger included
├── routes/              The endpoints themselves
├── services/            The logic - auth, users and cards; the only place that talks to the database
├── validations/         The Zod schemas of everything the client sends
└── index.ts             Builds the express application
```

The idea behind the split is that **every layer has one job**:

- a **route** reads the request and answers it, nothing else
- a **middleware** guards the route - a token, a role, the shape of the body
- a **service** holds the logic and is the only layer that touches the models
- a **validation** describes what a legal object from the client looks like
- a **schema** describes what a legal document in the database looks like

---

## How a request flows through the server

`src/index.ts` registers the middlewares in the order they run:

1. **CORS** (`middleware/cors.ts`) - only `CLIENT_URL` and `http://localhost:5173` (Vite)
   may call the API from a browser. Requests without an `Origin` header (REST Client,
   Postman, curl) pass
2. **Request logger** (`morgan`) - writes one line per request into the application logger
3. **`fileLogger`** - watches the answer and writes it to a file when it fails
4. **`express.json()`** - parses a JSON body into `req.body`
5. **The routers** - `/api/v1/users` and `/api/v1/cards`
6. **`notFound`** - answers `404` for an address that no route matched
7. **`fileErrorLogger`** - keeps the error on the response so the file logger can read it
8. **`errorHandler`** - turns every thrown error into a JSON answer

Inside a route the order is always the same:

```ts
router.put("/:id", ...isCardOwner, validateCard, async (req, res) => { ... });
//                 │               │
//                 │               └── is the body legal?
//                 └── is there a valid token, and is this user allowed?
```

The authorization runs **before** the validation on purpose - a user that is not allowed
to touch the resource should not learn anything about its shape.

---

## Authentication and authorization

### The token

`POST /users/login` answers with a **JWT** (signed with `jose`, HS256) with `JWT_SECRET`
that expires after two hours. Its payload holds exactly what the authorization checks need:

```json
{ "_id": "6aad...", "isBusiness": true, "isAdmin": false }
```

Every protected request sends it back in the header:

```
Authorization: bearer <token>
```

### The guards

`validateToken` reads the header, verifies the signature, loads the user from the database
and puts it on `req.user`. Every other guard is built on top of it and is exported as an
array, so a route spreads it into its handlers:

| Guard | File | Passes when |
| --- | --- | --- |
| `validateToken` | `validate-token.ts` | the token is valid and the user still exists |
| `isAdmin` | `is-admin.ts` | `isAdmin` is true |
| `isBusiness` | `is-business.ts` | `isBusiness` or `isAdmin` is true |
| `isOwnerOrAdmin` | `is-owner-or-admin.ts` | the id in the address is the id of the user, or the user is an admin |
| `isCardOwner` | `is-card-owner.ts` | the card in the address was created by the user |
| `isCardOwnerOrAdmin` | `is-card-owner.ts` | the card was created by the user, or the user is an admin |

A missing or malformed header answers `400`, a token of a deleted user answers `401`, and
a guard that refuses answers `403`.

---

## API reference

All the addresses start with `/api/v1`.

### Users

| # | Method | Address | Who may call it | What it does |
| --- | --- | --- | --- | --- |
| 1 | POST | `/users` | everyone | Registers a new user, the email must be free |
| 2 | POST | `/users/login` | everyone | Returns a token |
| 3 | GET | `/users` | admin | Returns all the users |
| 4 | GET | `/users/:id` | the user itself or an admin | Returns one user |
| 5 | PUT | `/users/:id` | the user itself or an admin | Edits the user (everything except the password) |
| 6 | PATCH | `/users/:id` | the user itself or an admin | Flips the `isBusiness` status |
| 7 | DELETE | `/users/:id` | the user itself or an admin | Deletes the user |

The password is never part of an answer - it is excluded by the schema itself
(`select: false`), so it cannot leak by mistake from a query that forgot to exclude it.

`isAdmin` is not part of the registration object. A client cannot make itself an admin;
the only admin is the one created by the [initial data](#initial-data).

### Cards

| # | Method | Address | Who may call it | What it does |
| --- | --- | --- | --- | --- |
| 1 | GET | `/cards` | everyone | Returns all the cards |
| 2 | GET | `/cards/my-cards` | a registered user | Returns the cards of the user |
| 3 | GET | `/cards/:id` | everyone | Returns one card |
| 4 | POST | `/cards` | a business user or an admin | Creates a card |
| 5 | PUT | `/cards/:id` | the creator of the card | Edits the card |
| 6 | PATCH | `/cards/:id` | a registered user | Likes the card, a second call removes the like |
| 7 | DELETE | `/cards/:id` | the creator or an admin | Deletes the card |
| * | PATCH | `/cards/:id/biz-number` | admin | Gives the card a new business number ([bonus](#1-changing-a-business-number)) |

`/cards/my-cards` is registered **before** `/cards/:id`, otherwise express would read
`my-cards` as an id.

### Answers

Every answer is a JSON object that wraps the data in a named key:

| Request | Answer |
| --- | --- |
| `POST /users` | `{ "message": "User Saved!", "user": { ... } }` (`201`) |
| `POST /users/login` | `{ "message": "Logged in!", "token": "eyJhbGciOiJ..." }` |
| `GET /users` | `{ "users": [ ... ] }` |
| any other user route | `{ "user": { ... } }` |
| `GET /cards` | `{ "cards": [ ... ] }` |
| `GET /cards/my-cards` | `{ "myCards": [ ... ] }` |
| any other card route | `{ "card": { ... } }` (`201` on create) |

---

## Data models

### User

```jsonc
{
  "name":    { "first": "test", "middle": "", "last": "test" },
  "address": { "state": "", "country": "country", "city": "city",
               "street": "street", "houseNumber": 1, "zip": "11111" },
  "image":   { "url": "https://...", "alt": "user-profile" },
  "phone":       "0501111111",
  "email":       "user@user.com",   // unique
  "password":    "<bcrypt hash>",   // never returned
  "isAdmin":     false,             // set by the server only
  "isBusiness":  false,
  "createdAt":   "2026-09-18T00:00:00.000Z"
  // failedLoginAttempts, blockedUntil - hidden, see the blocking bonus
}
```

### Card

```jsonc
{
  "title":       "card",
  "subtitle":    "subtitle",
  "description": "description",
  "phone":       "0501111111",
  "email":       "card@card.com",
  "web":         "https://card.com",
  "image":     { "url": "https://...", "alt": "card" },
  "address":   { "state": "", "country": "country", "city": "city",
                 "street": "street", "houseNumber": 1, "zip": "11111" },
  "bizNumber":  1234567,   // unique, 7 digits, created by the server
  "likes":      [],        // the ids of the users that liked the card
  "userId":     "6aad...", // the id of the user that created the card
  "createdAt":  "2026-09-18T00:00:00.000Z"
}
```

`name`, `address` and `image` are their own mongoose schemas (`database/schemas/`), so the
user and the card share the very same definitions instead of repeating them.

`models.ts` adds two custom methods to the user model:

- `user.setPassword(password)` - a document method that hashes the password with bcrypt and saves the user
- `UserModel.findByEmail(email)` - a static method on the collection

---

## Validation

Every object that arrives from a client is parsed by a **Zod** schema before any route
handler sees it. The schemas live in `src/validations` and mirror the models - `address`,
`name` and `image` are small schemas that the user and the card schemas build on, and the
shared regular expressions live in `patterns.ts`.

`middleware/validate.ts` holds one generic factory:

```ts
export function validateSchema<T>(schema: ZodType<T>): RequestHandler<any, any, T> {
  return async (req, res, next) => {
    req.body = await schema.parseAsync(req.body);
    next();
  };
}
```

It parses the body, replaces it with the **parsed** value (so the route works with data
that is already clean and typed), and lets the error handler answer on a failure.
Every concrete validator is then one line:

| Validator | Schema | Used by |
| --- | --- | --- |
| `validateUser` | `userSchema` | `POST /users` |
| `validateLogin` | `loginSchema` - `email` and `password` picked from `userSchema` | `POST /users/login` |
| `validateUserUpdate` | `userUpdateSchema` - `userSchema` without the password | `PUT /users/:id` |
| `validateCard` | `cardSchema` | `POST /cards`, `PUT /cards/:id` |
| `validateBizNumber` | `bizNumberSchema` | `PATCH /cards/:id/biz-number` |

The rules themselves:

| Field | Rule |
| --- | --- |
| `email` | a valid email address |
| `password` | 6-30 characters, an upper case letter, a lower case letter, a digit and one of `!@#$%^&*` |
| `phone` | an israeli number, for example `0501111111` or `+972501111111` |
| `web`, `image.url` | a valid URL |
| `houseNumber` | a whole number between 1 and 9999 |
| `bizNumber` | a whole number of 7 digits |

The user and the business number schemas are `z.strictObject`s, so a body that carries a
key which is not part of the schema is rejected instead of being silently ignored.

The mongoose schemas repeat the essential rules - required fields, lengths and unique
keys. That is on purpose: Zod guards the border of the application, and mongoose guards
the database itself, for example against data written by the initial data or by a future
script.

---

## Initial data

On every start in a non production environment `database/init-db.ts` fills an empty
database with three users and three cards. Nothing is created when the collection already
holds documents, so restarting the server never duplicates the data.

| Email | Password | Role |
| --- | --- | --- |
| `user1@user1.com` | `Aa123456!` | a regular user |
| `user2@user2.com` | `Aa123456!` | a business user |
| `user3@user3.com` | `Aa123456!` | an admin (and a business user) |

The three cards belong to the business user, so `GET /cards/my-cards` has something to
answer with right after the first start.

---

## Bonuses

### 1. Changing a business number

`PATCH /cards/:id/biz-number` lets an **admin** give a card any business number that no
other card holds:

```http
PATCH /api/v1/cards/<id>/biz-number
Authorization: bearer <admin token>
Content-Type: application/json

{ "bizNumber": 7654321 }
```

`cardService.changeBizNumber` looks for a card with that number first and answers
`400 The business number is aleardy taken` when it finds one. The same uniqueness is kept
by `generateBizNumber`, which draws a random 7 digits number and draws again as long as
the number is taken, and by the `unique` index on the field.

### 2. A file logger

Every answer with a status code of **400 and above** is written into a file inside
`logs/` (at the root of the project), named after the date of that day. A day with no
failed request creates no file, and a file that already exists is appended to and never
replaced:

```
logs/log-2026-09-19.log

2026-09-19T14:27:18.851Z | 400 | "exp" claim timestamp check failed
2026-09-19T14:27:30.024Z | 400 | Login Failed - cannot find user email
2026-09-19T14:28:54.921Z | 403 | Must be admin or owner
```

Each line holds the three things the exercise asks for - the **date of the request**, the
**status code** and the **error message**. `middleware/file-logger.ts` is built from two
parts, because the error and the status code are known at two different moments:

| Part | Where it runs | What it does |
| --- | --- | --- |
| `fileLogger` | before the routes | Listens to the `finish` event of the answer, and writes the line when the status is 400 or above |
| `fileErrorLogger` | right before the error handler | Puts the error on `res.locals` so the listener can read its message |

A failure without an error object - an address that no route matched, for example - falls
back to the name of the status code (`Not Found`), and a validation error is written as
the list of the fields it failed on instead of its whole report. Messages are cut at 300
characters, so one failure always takes one line.

### 3. Blocking a user

A user that sends a **wrong password three times in a row** cannot login for the next
**24 hours**, even with the correct password:

```json
{ "message": "Login Failed - the user is blocked until 2026-09-19T19:40:17.813Z" }
```

The answer's status is `403`. Two fields on the user schema hold the state, both hidden
from every regular query with `select: false` so they never reach a client:

| Field | Meaning |
| --- | --- |
| `failedLoginAttempts` | How many wrong passwords arrived in a row |
| `blockedUntil` | The moment the block ends, `null` when the user is free |

A **successful** login resets both, so two wrong passwords followed by the right one leave
the user with a clean slate.

---

## Error responses

Nothing in the routes or the services answers an error by itself. They throw, and
`middleware/error-handler.ts` is the single place that turns an error into an answer
(every error is also written to the application logger):

| The error | Status | The answer |
| --- | --- | --- |
| A `jose` error (`JWTExpired`, `JWSSignatureVerificationFailed`, ...) | 400 | `{ "name": "<the error name>" }` |
| `SyntaxError` | 400 | `Invalid JSON Format` with the parser message |
| `ZodError` | 400 | `Validation Error` with the list of issues |
| `mongoose.Error.CastError` | 400 | An id in the address that is not a mongo id |
| `mongoose.Error.ValidationError` | 400 | `Validation Error` with the messages of the schema |
| `MongoServerError` | 400 | A database error, for example a duplicated unique key (the stack only on `debug`) |
| `HttpError`, `NotFoundError` | its own `statusCode` | `{ "message": "..." }` |
| anything else | 500 | `{ "message": "internal server error" }` |

An address that no route matched is answered by `middleware/not-found.ts`:
`404 { "error": "Page Not Found" }`.

`error/custom-error.ts` holds the two errors the application throws itself:

```ts
throw new HttpError("The email is aleardy taken", 400);
throw new NotFoundError("No such card found");
```

Because express 5 forwards a rejected promise to the error handler on its own, an `async`
route needs no `try / catch` at all.

---

## Logging

The application logs with [pino](https://getpino.io):

- `middleware/logger.ts` exports the logger. Every service writes what it did with it,
  prefixed by the name of the function -
  `[login]: Login succesfully - Return valid token for user`
- `morgan` writes one line per request **through** the same logger, so both kinds of
  output share one format - `[GET]: /api/v1/cards , 200 - 3.608 ms`
- The level comes from `LOG_LEVEL`. It is read straight from `process.env` and not from
  the validated config, because the config reports its own errors with this logger
- Production prints only errors while development prints everything
- `pnpm dev` and `pnpm prod` pipe the output through `pino-pretty --singleLine`, which
  turns the JSON lines into readable colored text

Failed answers are written to a file as well - see
[the file logger bonus](#2-a-file-logger).
