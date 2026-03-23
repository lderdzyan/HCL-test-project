import { UserType } from '../constants';
import * as O from 'fp-ts/Option';

export const convertUserType = (userTypeName?: string): O.Option<UserType> => {
  switch (userTypeName) {
    case UserType.MS_EXPLORER:
      return O.some(UserType.MS_EXPLORER);
    case UserType.MS_GUIDE:
      return O.some(UserType.MS_GUIDE);
    case UserType.MS_WEB_ADMIN:
      return O.some(UserType.MS_WEB_ADMIN);
    case UserType.MS_WEB_DEBUG:
      return O.some(UserType.MS_WEB_DEBUG);
    default:
      console.log('Wrong userType name.');
      return O.none;
  }
};
