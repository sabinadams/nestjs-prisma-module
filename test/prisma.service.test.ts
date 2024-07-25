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
import { createSandbox } from 'sinon';
import PrismaMock from './helpers/PrismaMock';

afterAll(() => {
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
});

let service, sandbox, exitStub;

beforeEach(() => {
  service = new PrismaService(PrismaMock, undefined, 'PROVIDER');
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
    it('Single Tenant | Should generate the provided client with the configured options', () => {
      vi.spyOn(service, 'getTenantDBUrl');
      const client = service.generateClient('TEST');
      expect(client).toBeInstanceOf(PrismaMock);
      expect(service.multitenancy).toBe(false);
      expect(service.getTenantDBUrl).toBeCalledTimes(0);
    });
    it('Multi Tenant | Should generate the provided client with the configured options', () => {
      service = new PrismaService(
        PrismaMock,
        'file:./dev.db',
        'PROVIDER',
        true,
        false,
      );
      vi.spyOn(service, 'getTenantDBUrl');
      const client = service.generateClient('TEST');
      expect(client).toBeInstanceOf(PrismaMock);
      expect(service.getTenantDBUrl).toBeCalledTimes(1);
    });
    it('Should run an initializer function if provided', () => {
      const initializerMock = vi.fn((client, _) => client);
      service = new PrismaService(
        { class: PrismaMock, initializer: initializerMock },
        'file:./dev.db',
        'PROVIDER',
        true,
        false,
      );
      const client = service.generateClient('TEST');
      expect(client).toBeInstanceOf(PrismaMock);
      expect(initializerMock).toHaveBeenCalled();
    });
    it('Should take prisma client constructor params properly', () => {
      const initializerMock = vi.fn((client, _) => client);
      const SpyClient = vi.fn();
      service = new PrismaService(
        {
          class: SpyClient,
          initializer: initializerMock,
          options: {
            log: ['info'],
          },
        },
        'file:./dev.db',
        'PROVIDER',
        true,
        false,
      );
      service.generateClient('TEST');
      expect(SpyClient).toHaveBeenCalledTimes(1);
      expect(SpyClient).toHaveBeenCalledWith({
        log: ['info'],
        datasources: {
          db: {
            url: 'file:./dev.db',
          },
        },
      });
    });
  });
  describe('getConnection', () => {
    it('Should store a connection in the cache if the connection did not exist and return it', () => {
      service.getConnection('test-tenant');
      expect(service.connections).toHaveProperty('test-tenant');
      expect(service.connections['test-tenant']).toBeInstanceOf(PrismaMock);
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
