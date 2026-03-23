import config from '../config';

export namespace Logger {
  export function debug(message?: string | any, ...optionalParams: any[]) {
    if (config.logAllowed.includes(config.environment)) {
      if (optionalParams.length > 0) {
        console.log(message, optionalParams);
      } else {
        console.log(message);
      }
    }
  }

  export function info(message?: string | any, ...optionalParams: any[]) {
    if (optionalParams.length > 0) {
      console.log(message, optionalParams);
    } else {
      console.log(message);
    }
  }

  export function error(error: unknown, message?: string | any, ...optionalParams: any[]) {
    const thrownError = error as Error;
    console.group();
    console.error(message, optionalParams);
    console.error('{}: {}', thrownError.name, thrownError.message);
    if (thrownError.stack != null) {
      console.error(thrownError.stack);
    }
    console.groupEnd();
  }
}
