/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alert.js';

export const signUp = async (data) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data,
      withCredentials: true,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        'Signed up successfully! Check your Email for verification link'
      );
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
