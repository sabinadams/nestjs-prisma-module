import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClassLike, GetConstructorArgs } from './types';
import { ConnectionString } from 'connection-string';

@Injectable()
export default class PrismaService<T extends ClassLike>
  implements OnModuleDestroy
{
  connections = {};
  constructor(
    public PrismaClient: T,
    public datasource: string,
    public config: GetConstructorArgs<T>[0],
    public name: string,
  ) {}

  getTenantDBUrl(name: string) {
    const string = new ConnectionString(this.datasource);
    if (!string.protocol) {
      console.info(
        `<${this.name}> | ⚠️ SQLite does not support multiple DBs. All tenants will use the same connection. <${this.name}>`,
      );
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
    return new this.PrismaClient({
      ...this.config,
      datasources: {
        db: {
          url: this.getTenantDBUrl(name),
        },
      },
    });
  }

  getConnection(tenant: string) {
    if (!this.connections[tenant]) {
      console.info(`<${this.name}> | ✅ Creating new ${tenant} DB client`);
      this.connections[tenant] = this.generateClient(tenant);
      this.connections[tenant].$connect();
      this.connections[tenant].$on('beforeExit', async () => {
        console.log(`<${this.name}> | 🗑 Exiting ${tenant} db connections`);
        await this.connections[tenant].$disconnect();
      });
    } else {
      console.info(`<${this.name}> | ♻️ Using existing ${tenant} DB client`);
    }

    return this.connections[tenant];
  }

  async onModuleDestroy() {
    console.log(`<${this.name}> | 💣 Disconnecting prisma pools`);
    Object.keys(this.connections).forEach(async (tenant) => {
      console.log(`<${this.name}> | Disconnecting ${tenant}`);
      await this.connections[tenant].$disconnect();
    });
  }
}
