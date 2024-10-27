# astro-master

[Next master](https://github.com/ethanniser/NextFaster) clone built with [Astro](https://astro.build).

Origin [twitter thread] (https://x.com/ethanniser/status/1848442738204643330)

Project uses same Next master [data](https://github.com/ethanniser/NextFaster/tree/main/data) provided in their repo including all the images.

## Installation

Install Dependencies.

```bash
  pnpm install
```

## Run Locally

Start the dev server.

```bash
  pnpm dev
```

## Build

```bash
  pnpm build
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file
Since this project uses Turso Sqlite you will need `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

| Name               | Description              |
| ------------------ | ------------------------ |
| TURSO_DATABASE_URL | The database URL.        |
| TURSO_AUTH_TOKEN   | The database Auth token. |

## Setup Database

To Setup the database first you have to run all the migrations.

```bash
  pnpm db:migrate
```

To generate sql from drizzle schema you can run below command.

```bash
  pnpm db:generate
```

## Drizzle Studio

To see all of your database data locally, you can run the drizzle studio command, which will show you all of your data.

```bash
pnpm studio
```
