/* eslint-disable*/

// const axios = require('axios');
const Stripe = require('stripe');
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51NGHV5SCKbzTQ15oQiAIwkkHQKNEkzdAkPG7cQ8zLUNkGSwLsirEZbYX0h5Yd2o3kqtDsZiMwO3dpEvOiwgBXosn00jxpLtuio'
);

// export const bookTour = async (tourId) => {
//   // 1) Get checkout session from API
//   const session = await axios(
//     `http://127.0.0.1:3000/api/v1/bookings/${tourId}`
//   );

//   console.log(session);
//   // 2) Get checkout form + charge credit card
// };

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const response = await fetch(
      `http://127.0.0.1:3000/api/v1/bookings/${tourId}`
    );
    const session = await response.json();

    console.log(session);
    // 2) Get checkout form + charge credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    // Handle any errors
    console.log(error);
    showAlert('error', error);
  }
};
