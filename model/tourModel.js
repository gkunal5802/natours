const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

// mongoose is like a model just as classes in javscript. We need model to perform CRUD operation in application
// creating schema for our document

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // i.e. a name is required. if not provided error msg is displayed.
      unique: true,
      trim: true, // removes white spaces if provided by user.
      maxlength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'A tour name must only contain letters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must a have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must a have group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour must have difficulty either: easy, medium, difficult',
      },
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // custom made validation
        validator: function (val) {
          return val < this.price; // only works for document creation not updation
        },
        message: 'Price Discount ({VALUE}) must be less than the Tour Price',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, // if rating is provided then it will be set as 4.5
      min: [1, 'A tour must have rating above 1.0'],
      max: [5, 'A tour must have rating below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.6667 -> 46.667 -> 47 -> 4.7;
    },
    ratingsQuantity: {
      type: Number,
      default: 0, // if rating is provided then it will be set as 4.5
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'An tour should have a image cover'],
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
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
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
        coordinates: [Number],
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

// creating virtual fields from existing ones.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtually populating the reviews belonging to a particular tour.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// DOCUMENT MIDDLEWARE is a mongoose middleware which helps to perform certain functions before and after an event happen.
// DOCUMENT MIDDLEWARE: runs before .save() & .create() method.

// 'save' is called pre savehook. & here we can't use arrow function as it doesn't have its own this keyword.
tourSchema.pre('save', function (next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});
// using regex the query runs for all the methods which contain find such as findOne,findOneAndUpdate etc.
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
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

// PRE-SAVE middleware to embbed the data user guide data into tours model. Embbed means to copy data.
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = await this.guides.map(
//     async (id) => await User.findById(id)
//   );
//   this.guides = await Promise.all(guidesPromises);
//    next();
// });

// can have multiple pre and post middleware for various functions
// tourSchema.pre('save', function (next) {
//   console.log('will be saving the document');
//   next(); // required to execute next middleware in stack
// });

// tourSchema.post('save', (doc,next) => {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: another type of mongoose middleware.
// used for query like find method.

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

// AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema); // model.('name of model',schema);

module.exports = Tour;
