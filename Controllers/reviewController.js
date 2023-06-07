const Review = require('../model/reviewModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handleFactory');

exports.setTourUserIds = (req, res, next) => {
  // if user and tour id is not specified , take the data from url.
  // Allow nested Routes.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
