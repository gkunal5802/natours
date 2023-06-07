// review // rating // createdAt // ref to tour // ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review message is required!'],
    },
    rating: {
      type: Number,
      max: [5, 'Rating cannot be greater than 5'],
      min: [1, 'Rating cannot be less than 1'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  // this basically helps to show the property in JSON FILE which are created virtually
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// user and tour together should be unique. That means single user is allowed to post one review on a single tour.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// populating the users on review with only name and photo of user.
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// static method on model to calculate average ratings of review on a tour.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// saving the result of newly created review quantity and average of reviews on tour
reviewSchema.post('save', function () {
  // this point to current review
  this.constructor.calcAverageRatings(this.tour);
});

// querying the result of updated review quantity and average of reviews on tour
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

// now saving the updated quantity and statistics.
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() does NOT work, query has already executed. that's why we use query middleware.
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// constructing the model.
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
