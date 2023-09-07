import * as mutations from './types/mutations';
import { userMapper } from '../user/normalizer';
import { jwtDecrypt } from "./jwtHelper";

export default {
  [mutations.USER_LOGOUT]: state => {
    state.user = null;
  },
  [mutations.SET_LOGGED_USER]: (state, userData) => {
    state.user = userMapper(userData);
  },
  [mutations.SET_TOKEN_DATA]: (state, data) => {
 
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
 
    const jwtDecodedValue = jwtDecrypt(data.access_token);
    const newTokenData = {
      token: data.access_token,
      refreshToken: data.refresh_token,
      tokenExp: jwtDecodedValue.exp,
      userId: jwtDecodedValue.sub,
      userName: jwtDecodedValue.userName,
    };
    state.authData = newTokenData; 
  },
  [mutations.SET_LOGIN_STATUS]: (state, value) => {
     state.loginStatus = value;
  }
};
