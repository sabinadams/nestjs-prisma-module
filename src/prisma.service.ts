import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import type {
  ClassLike,
  ClientConfig,
  Initializer,
  PluginConfig,
} from './types';
import { ConnectionString } from 'connection-string';

@Injectable()
export default class PrismaService<T extends ClassLike>
  implements OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  connections = {};
  constructor(
    public PrismaClient: PluginConfig<T>['client'],
    public datasource: PluginConfig<T>['datasource'],
    public name: PluginConfig<T>['name'],
    public multitenancy: PluginConfig<T>['multitenancy'] = false,
    public logging: PluginConfig<T>['logging'] = false,
  ) {}

  getTenantDBUrl(name: string) {
    const string = new ConnectionString(this.datasource);
    if (!string.protocol) {
      if (this.logging) {
        this.logger.log(
          `<${this.name}> | ⚠️ SQLite does not support multiple DBs. All tenants will use the same connection. <${this.name}>`,
        );
      }

      return this.datasource;
    }
    switch (string.protocol) {
      case 'sqlserver':
        string.params = { ...string.params, database: name };
        break;
      case 'mongodb':
      case 'mysql':
      case 'postgresql':
        string.path = [name, ...(string.path || [])];
        break;
      default:
        throw new Error(
          `<${this.name}> | ‼️ This database provider is not supported!`,
        );
    }

    return string.toString();
  }

  generateClient(name: string) {
    // Default the initializer assuming no initializer was passed
    let client: T,
      initializer: Initializer<T> = (client, _) => client,
      config: ClientConfig<T>['options'];

    // If the input was of the type { class: T, initializer: Initializer<T>} update the vars
    if ('class' in this.PrismaClient) {
      client = this.PrismaClient.class;
      if ('initializer' in this.PrismaClient) {
        initializer = this.PrismaClient.initializer;
      }
      if ('options' in this.PrismaClient) {
        config = this.PrismaClient.options;
      }
    } else {
      client = this.PrismaClient;
    }

    // Create an instance of the client
    const instance = new client({
      ...config,
      ...(this.multitenancy
        ? {
            datasources: {
              db: {
                url: this.getTenantDBUrl(name),
              },
            },
          }
        : {}),
    });
    // Run the initializer and return the instance
    return initializer(instance, name);
  }

  getConnection(tenant: string) {
    if (!this.connections[tenant]) {
      if (this.logging) {
        this.logger.log(`<${this.name}> | ✅ Creating new ${tenant} DB client`);
      }
      this.connections[tenant] = this.generateClient(tenant);
      this.connections[tenant].$connect();
    } else {
      if (this.logging) {
        this.logger.log(
          `<${this.name}> | ♻️ Using existing ${tenant} DB client`,
        );
      }
    }

    return this.connections[tenant];
  }

  async onModuleDestroy() {
    if (this.logging) {
      this.logger.log(`<${this.name}> | 💣 Disconnecting prisma pools`);
    }
    Object.keys(this.connections).forEach(async (tenant) => {
      if (this.logging) {
        this.logger.log(`<${this.name}> | Disconnecting ${tenant}`);
      }
      await this.connections[tenant].$disconnect();
    });
  }
}
