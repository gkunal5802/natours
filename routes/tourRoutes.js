const express = require('express');
const tourController = require('../Controllers/tourController');
const authController = require('../Controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// CREATING MIDDLEWARE FOR SPECIFIC PARAMETERS. IT WILL ONLY BE PARSED WHEN WE ARE ON THIS SUB-APPLICATION i.e. tours/:id
// router.param('id', tourController.checkId); // acts as tool to check whether id requested is valid or not. After that only the other http methods are executed

// POST: /tour/234fsa/reviews
// GET: /tour/23r4f/reviews

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  ); // in this way we can chain the different middlewares to check whether some functionalities (like user is logged in or not) before excuting main function.

//tours-within/233/center/34.0200392,-118.7413867/unit/mi
//tours-within?distance=233&center=-45,34&unit=mi
router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
