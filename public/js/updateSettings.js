/* eslint-disable*/
// import axios from 'axios';
import { showAlert } from './alerts';

// export const updateUser = async (data, type) => {
//   try {

//    const url = type === 'password'
//     ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
//     : 'http://127.0.0.1:3000/api/v1/users/updateMe';

//     const res = await axios({
//       method: 'PATCH',
//       url,
//       data,
//     });

//     if (res.data.status === 'success')
//       showAlert('success', `${type.toUpperCase()} Updated Successfully`);
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    console.log(responseData);
    if (responseData.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully`);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.message);
  }
};
