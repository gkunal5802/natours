/* eslint-disable*/
// import axios from 'axios';
import { showAlert } from './alerts';
// export const login = async (email, password) => {
//   try {
//     const res = await axios({
//       method: 'POST',
//       url: 'http://127.0.0.1:3000/api/v1/users/login',
//       data: {
//         email,
//         password,
//       },
//     });

//     if (res.data.status === 'success') {
//       alert('Logged in Successfully');
//       window.setTimeout(() => {
//         location.assign('/');
//       }, 1500);
//     }
//   } catch (err) {
//     alert(err.response.data.message);
//   }
// };

export const login = async (email, password) => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error.message));
    }

    const data = await response.json();

    if (data.status === 'success') {
      showAlert('success', 'Logged in Successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err);
    showAlert('error', err.message);
  }
};

// export const logout = async () => {
//   try {
//     const res = await axios({
//       method: 'GET',
//       url: 'http://127.0.0.1:3000/api/v1/users/logout',
//     });

//     if ((res.data.status = 'success')) location.reload(true);
//   } catch (err) {
//     console.log(err);
//     showAlert('error', 'ERROR Logging Out. Try Again!');
//   }
// };

// export const logout = async () => {
//   try {
//     const response = await fetch('http://127.0.0.1:3000/api/v1/users/logout', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     console.log(response);
//     if (response.status === 200) location.reload(true);
//   } catch (err) {
//     console.log(err);
//     showAlert('error', 'ERROR Logging Out. Try Again!');
//   }
// };

export const logout = async () => {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/v1/users/logout', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const data = await res.json();

    if (data.status === 'success') {
      location.reload(true);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', 'ERROR Logging Out. Try Again!');
  }
};
