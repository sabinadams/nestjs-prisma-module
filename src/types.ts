export type ClassLike = new (...args: any) => any;
export type GetConstructorArgs<T> = T extends new (...args: infer U) => any
  ? U
  : never;
export interface ConnectionObject<T> {
  [name: string]: T;
}
export type PluginConfig<T> = {
  name: string;
  datasource: string;
  client: T;
  options?: Omit<GetConstructorArgs<T>[0], 'datasources'>;
};
