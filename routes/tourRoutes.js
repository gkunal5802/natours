const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const Router = express.Router();

// CREATING MIDDLEWARE FOR SPECIFIC PARAMETERS. IT WILL ONLY BE PARSED WHEN WE ARE ON THIS SUB-APPLICATION i.e. tours/:id
// router.param('id', tourController.checkId); // acts as tool to check whether id requested is valid or not. After that only the other http methods are executed

// POST: /tour/234fsa/reviews
// GET: /tour/23r4f/reviews

Router.use('/:tourId/reviews', reviewRouter);

Router.route('/top-5-cheap').get(
  tourController.aliasTopTours,
  tourController.getAllTours
);
Router.route('/tour-stats').get(tourController.getTourStats);
Router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan
); // in this way we can chain the different middlewares to check whether some functionalities (like user is logged in or not) before excuting main function.

//tours-within/233/center/34.0200392,-118.7413867/unit/mi
//tours-within?distance=233&center=-45,34&unit=mi

Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  tourController.getToursWithin
);
Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

Router.route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

Router.route('/:id')
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

module.exports = Router;
