export type ClassLike = new (...args: any) => any;
export type GetConstructorArgs<T> = T extends new (...args: infer U) => any
  ? U
  : never;
export interface ConnectionObject<T> {
  [name: string]: T;
}
export type Initializer<T extends ClassLike> = (
  client: InstanceType<T>,
  tenant: string,
) => InstanceType<T>;
export type PluginConfig<T extends ClassLike> = {
  name: string;
  datasource: string;
  client:
    | T
    | {
        class: T;
        initializer: Initializer<T>;
      };
  options?: Omit<GetConstructorArgs<T>[0], 'datasources'>;
};
