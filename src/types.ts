export type ClassLike = new (...args: unknown[]) => unknown;
export type GetConstructorArgs<T> = T extends new (...args: infer U) => unknown
  ? U
  : never;
export interface ConnectionObject<T> {
  [name: string]: T;
}

export type Initializer<T extends ClassLike> = (
  client: InstanceType<T>,
  tenant: string,
) => InstanceType<T>;

type ClientConfig<T extends ClassLike> = {
  class: T;
  initializer: Initializer<T>;
};

type BasePluginConfig<T extends ClassLike> = {
  name: string;
  logging?: boolean;
  client: T | ClientConfig<T>;
  options?: Omit<GetConstructorArgs<T>[0], 'datasources'>;
};

// If multitenancy or datasource is present, both need to be there
interface PluginConfigMulti<T extends ClassLike> extends BasePluginConfig<T> {
  multitenancy: boolean;
  datasource: string;
}

// If
interface PluginConfigSingle<T extends ClassLike> extends BasePluginConfig<T> {
  multitenancy?: false;
  datasource?: undefined;
}

export type PluginConfig<T extends ClassLike> =
  | PluginConfigMulti<T>
  | PluginConfigSingle<T>;
