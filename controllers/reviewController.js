const Review = require('../models/reviewModel');
const handlerFactory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // if user and tour id is not specified , take the data from url.
  // Allow nested Routes.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = handlerFactory.getAll(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.getReview = handlerFactory.getOne(Review);
