/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alert.js';
const stripe = Stripe(
  'pk_test_51NGHV5SCKbzTQ15oQiAIwkkHQKNEkzdAkPG7cQ8zLUNkGSwLsirEZbYX0h5Yd2o3kqtDsZiMwO3dpEvOiwgBXosn00jxpLtuio'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
      withCredentials: true,
    });

    console.log(session);

    // window.setTimeout(() => {
    //   location.assign(session.data.session.url);
    // }, 1500);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
