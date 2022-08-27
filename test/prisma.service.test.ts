import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import PrismaService from '../src/prisma.service';
import { createSandbox, assert } from 'sinon';

afterAll(() => {
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
});

class MockClass {
  constructor(public options: any) {}
  getOptions() {
    return this.options;
  }

  $connect = vi.fn();
  $disconnect = vi.fn();
  $on = vi.fn();
}

const options = { foo: 'bar' };
let service, sandbox, exitStub;

beforeEach(() => {
  service = new PrismaService(MockClass, 'file:./dev.db', options, 'PROVIDER');
  sandbox = createSandbox({ useFakeTimers: true });
  exitStub = sandbox.stub(process, 'exit');
});

afterEach(() => {
  sandbox.restore();
});

describe('prisma.service.ts', () => {
  describe('getTenantDBUrl', () => {
    it('Should return valid URLs for MySQL URLs', () => {
      service.datasource = 'mysql://USER:PASSWORD@HOST:999';
      const url = service.getTenantDBUrl('test-db');
      expect(url).toBe('mysql://USER:PASSWORD@HOST:999/test-db');
    });
    it('Should return valid URLs for PostgresQL URLs', () => {
      service.datasource = 'postgresql://USER:PASSWORD@HOST:999';
      const url = service.getTenantDBUrl('test-db');
      expect(url).toBe('postgresql://USER:PASSWORD@HOST:999/test-db');
    });
    it('Should return valid URLs for MongoDB URLs', () => {
      service.datasource = 'mongodb://USER:PASSWORD@HOST:999';
      const url = service.getTenantDBUrl('test-db');
      expect(url).toBe('mongodb://USER:PASSWORD@HOST:999/test-db');
    });
    it('Should return valid URLs for SqlServer URLs', () => {
      service.datasource = 'sqlserver://USER:PASSWORD@HOST:999';
      const url = service.getTenantDBUrl('test-db');
      expect(url).toBe('sqlserver://USER:PASSWORD@HOST:999?database=test-db');
    });
    it('Should return the original datasource URL if SQLite', () => {
      service.datasource = 'file:./dev.db';
      const url = service.getTenantDBUrl('test-db');
      expect(url).toBe('file:./dev.db');
    });
    it('Should throw an error if an invalid protocol is used', () => {
      service.datasource = 'invalid://USER:PASSWORD@HOST:999';
      expect(() => service.getTenantDBUrl('test-db')).toThrowError(
        '<PROVIDER> | ‼️ This database provider is not supported!',
      );
    });
  });
  describe('generateClient', () => {
    it('Should generate the provided client with the configured options', () => {
      const client = service.generateClient('TEST');
      const options = client.getOptions();
      expect(client).toBeInstanceOf(MockClass);
      expect(options).toHaveProperty('foo');
      expect(options.foo).toBe('bar');
      expect(options).toHaveProperty('datasources');
      expect(options.datasources).toStrictEqual({
        db: {
          url: 'file:./dev.db',
        },
      });
    });
  });
  describe('getConnection', () => {
    it('Should store a connection in the cache if the connection did not exist and return it', () => {
      service.getConnection('test-tenant');
      expect(service.connections).toHaveProperty('test-tenant');
      expect(service.connections['test-tenant']).toBeInstanceOf(MockClass);
    });
    it('Should re-use an existing conncetion', () => {
      service.getConnection('test-tenant');
      service.getConnection('test-tenant');
      expect(service.connections['test-tenant'].$on).toBeCalledTimes(1);
    });
    it('Should store different connections for each tenant', () => {
      service.getConnection('test-tenant');
      service.getConnection('test-tenant-2');
      const keys = Object.keys(service.connections);
      expect(keys.length).toBe(2);
      expect(keys).toContain('test-tenant');
      expect(keys).toContain('test-tenant-2');
    });
    it('Should store different connections for each tenant', () => {
      service.getConnection('test-tenant');
      service.getConnection('test-tenant-2');
      const keys = Object.keys(service.connections);
      expect(keys.length).toBe(2);
      expect(keys).toContain('test-tenant');
      expect(keys).toContain('test-tenant-2');
    });
    it('Should $connect the generated client', () => {
      service.getConnection('test-tenant');
      expect(service.connections['test-tenant'].$connect).toBeCalledTimes(1);
    });
    it("Should $on('beforeExit') the generated client", () => {
      service.getConnection('test-tenant');
      expect(service.connections['test-tenant'].$on).toBeCalledTimes(1);
    });
  });
  describe('onModuleDestroy', () => {
    it('Should clear out the connections', async () => {
      service.getConnection('test-tenant');
      service.getConnection('test-tenant-2');
      await service.onModuleDestroy();
      expect(service.connections['test-tenant'].$disconnect).toHaveBeenCalled();
      expect(
        service.connections['test-tenant-2'].$disconnect,
      ).toHaveBeenCalled();
    });
  });
});
