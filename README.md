## NestJS Prisma Module

![Header](https://res.cloudinary.com/sabinthedev/image/upload/v1661752534/NestJSPrismaModule_sa8xvh.png)

<div align=center>

[![Tests](https://github.com/sabinadams/nestjs-prisma-module/actions/workflows/tests.yml/badge.svg)](https://github.com/sabinadams/nestjs-prisma-module/actions/workflows/tests.yml)
[![Linting](https://github.com/sabinadams/nestjs-prisma-module/actions/workflows/lint.yml/badge.svg)](https://github.com/sabinadams/nestjs-prisma-module/actions/workflows/lint.yml)
[![npm version](https://badge.fury.io/js/@sabinthedev%2Fnestjs-prisma.svg)](https://badge.fury.io/js/@sabinthedev%2Fnestjs-prisma)

[![NPM](https://nodei.co/npm/@sabinthedev/nestjs-prisma.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/@sabinthedev/nestjs-prisma)

</div>

## Installation

To use this package, first install it:

```sh
npm i @sabinthedev/nestjs-prisma
```

Or

```sh
pnpm add @sabinthedev/nestjs-prisma
```

## Basic Usage

In order to use this package, you will need one or more [Prisma Clients](https://www.prisma.io/) set up in your project.

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';

@Module({
  imports: [
    PrismaModule.register({
      client: PrismaClient,
      name: 'PRISMA',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

There are also various options you may pass to the `register` function to customize how Prisma Client is instantiated and how to handle connections and requests.

## Multitenancy

This plugin allows you to handle multi-tenant applications by abstracting a service layer above Prisma Client to cache Prisma Client instances in-memory and select the appropriate tenant connection on each request.

Below is an example of how to configure `PrismaModule` to handle multiple tenants:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';

@Module({
  imports: [
    PrismaModule.register({
      client: PrismaClient,
      name: 'PRISMA',
      multitenancy: true,
      datasource: 'postgresql://johndoe:randompassword@localhost:5432/mydb',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

When configuring multi-tenancy, the `datasource` key is required as it is used as the base URL on which the tenant database is added.

To access a specific tenant database, add a header to your HTTP request named `x-tenant-id` whose value is the name of the tenant DB you wish to access.
`PrismaModule` will generate a new instance of Prisma Client using the base URL you provided along with the specification for the tenant database.

### Example Request

In the scenario below, your server is at `localhost:3000` and has an endpoint `/users`. The client accessing the resource requesting data from a tenant database named `tenant-name`.

```bash
curl -XGET -H 'x-tenant-id: tenant-name' 'localhost:3000/users'
```

### Supported Database Providers

> **Note**: SQLite _(or any database servers that do not support multiple databases)_ is not supported.

The list of supported database providers for this feature are as follows:

- PostgreSQL
- MySQL
- SQL Server
- MongoDB

_More to be added soon..._

## API

### `register(options)`

The register function registers `PrismaModule` and allows you to pass in options that change the behavior of the module and the generated Prisma Client instances.
This function takes in a single parameter, `options`. This is an object with the following available keys:

| Parameter    | Type                                                       |            | Description                                                                                                                                                                                                |
| ------------ | ---------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name         | string                                                     | Required   | The dependency injection token to use with `@Inject`. See [the docs](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens) for more info.                                 |
| logging      | boolean                                                    | Optional   | Enables logging within the module that gives insights how your connections are being handled.                                                                                                              |
| client       | `PrismaClient` class _or_ [`ClientConfig`](#client-config) | Required   | The `PrismaClient` class to be instantiated, or an object containing a reference to a `PrismaClient` class and a callback function that allows you to modify the instantiated class on a per-tenant basis. |
| options      | `PrismaClient` constructor args                            | Optional   | See the [Prisma Client API reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#prismaclient)                                                                             |
| multitenancy | boolean                                                    | Optional\* | A flag that turns on the multi-tenancy capabilities of this module.                                                                                                                                        |
| datasource   | string                                                     | Optional\* | A datasource URL that is used to manually override Prisma Client's datasource. This is used as the base URL when dynamically selecting tenant databases.                                                   |

> **Note**: If `multitenancy` OR `datasources` are present, both are required. The built-in type-safety will make this apparent.

#### ClientConfig

An object of the `ClientConfig` type is able to be provided instead of a `PrismaClient` class to the `client` option key. This object should contain:

| Parameter   | Type                        |          | Description                                                      |
| ----------- | --------------------------- | -------- | ---------------------------------------------------------------- |
| client      | PrismaClient                | Required | A `PrismaClient` class                                           |
| initializer | [Initializer](#initializer) | Required | A function that is called when a `PrismaClient` is instantiated. |

#### `initializer(client: PrismaClient, tenant: string) => PrismaClient`

This function gives you access to the generated client and the associated tenant name (if any) so you can customize the client instance with functions such as `$on`, `$use` and more. The available client methods can be found [here](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#client-methods).

Within this function, you can provide any function you would like to run when a Prisma Client is instantiated.

The return of this function must be the Prisma Client.

## Advanced Usage

In the scenario below, the module is configured to:

- Use multi-tenancy
- Log info on the connection handling
- Initialize PrismaClient with logging enabled at the `info` level _(see Prisma's docs on [logging](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging))_
- Hook into the `$on('info')` logging event to customize the message so it is more appropriate for a multi-tenant system

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';

@Module({
  imports: [
    PrismaModule.register({
      client: {
        class: PrismaMock,
        initializer: (client, tenant) => {
          client.$on('info', (e) => {
            console.log(`${tenant} INFO | ${e.message}`);
          });
          return client;
        },
      },
      logging: true,
      multitenancy: true,
      datasource: 'file:./dev.db',
      name: 'PRISMA',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Multiple Prisma Modules

You may register this module multiple times within your application to provide access to different databases.

Configure a new Prisma schema. _Make sure to specify a custom `output` in the `client` generator if your first client used the default location. This ensures the newly generated client does not override the one at `node_modules/@prisma/client`_.

You can then register a second client in a way similar to the following:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';

// Import your clients
import { PrismaClient as AuthClient } from '../prisma-clients/auth';
import { PrismaClient as UsersClient } from '../prisma-clients/users';

@Module({
  imports: [
    // Register the module once for each client
    PrismaModule.register({
      client: AuthClient,
      name: 'AUTH',
    }),
    PrismaModule.register({
      client: UsersClient,
      name: 'USERS',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

In the above scenario, you may be working in a microservice architecture who's Authentication service uses a separate database than the Users service.
The configuration above registers both clients as separate providers.

You, of course, have all of the granular control and options as before when registering multiple modules.

## Author

I'm Sabin Adams!

<p align="left"> <a href="https://twitter.com/sabinthedev" target="blank"><img src="https://img.shields.io/twitter/follow/sabinthedev?logo=twitter&style=for-the-badge" alt="sabinthedev" /></a> </p>

## Contributors

None yet! But contributions are welcome!

## License

Licensed under [MIT](./LICENSE).
