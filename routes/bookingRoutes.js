const express = require('express');
const bookingController = require('../Controllers/bookingController');
const authController = require('../Controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
