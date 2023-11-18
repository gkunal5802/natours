const mongoose = require('mongoose');
const slugify = require('slugify');

// mongoose is like a model just as classes in javscript. We need model to perform CRUD operation in application
// creating schema for our document

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // i.e. a name is required. if not provided error msg is displayed.
      unique: true,
      trim: true, // removes white spaces if provided by user.
      maxLength: [40, "A tour name can't exceed 40 characters"],
      minLength: [10, 'A tour name must have at least 10 character'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating avg must be between 1 and 5'],
      max: [5, 'Rating avg must be between 1 and 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.6667 -> 46.667 -> 47 -> 4.7;
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        // custom made validation
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  // this basically helps to show the property which are created virtually in JSON FILE

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes help improving reading performance by only traversing documents according to following parameters not Linearly one by one. This is essential in bigger application where millions of data has to be searched to get the results.

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtually populating the reviews belonging to a particular tour.

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE is a mongoose middleware which helps to perform certain functions before and after an event happen.
// DOCUMENT MIDDLEWARE: runs before .save() & .create() method.

// 'save' is called pre savehook. & here we can't use arrow function as it doesn't have its own this keyword.

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Query Middleware: using regex the query runs for all the methods which contain find such as findOne,findOneAndUpdate etc.

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// used to populate users into our tour document via refrencing them from user model document.
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start}ms`);
  next();
});

//Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
