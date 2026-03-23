import config from '../../config';

export const callFunction =
  <A extends unknown[], B extends unknown[], T>(aws: (...args: A) => T, azure?: (...args: B) => T) =>
  (...args: A & B) =>
    config.deploymenEnv === 'aws' ? aws(...args) : azure == null ? (undefined as T) : azure(...args);
