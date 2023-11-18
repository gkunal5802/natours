const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// upload.single('photo'); // upload single photo
// upload.array('images' ,3); // upload multiple photo of single field
// upload multiple photo with multiple fields
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // 3/2 ratio -> passing height , width, options to set fit,center etc..
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (image, idx) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 }) // quality degrade to 90%. It compresses the img to save storage
        .toFile(`public/img/tours/${filename}`); // destination.

      req.body.images.push(filename);
    })
  );

  next();
});

// we could call this checkId function in each of the route handler/controller but it is against the policy of express that everything should go through the pipeline.
// Now this middleware stack act as a sub-process in request-response cycle which excutes first before other http methods.
// MIDDLEWARE
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTour = handlerFactory.getOne(Tour, {
  path: 'reviews',
});
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // aggregate pipeline is a mongodb framework which tells the order in which the operations must be performed. Aggregation of data is process the data for several parameters and computing a single result. In this all the documents in our schema goes through multiple stages in sequential manner to calculate the result into one single document.
  // pipeline provides a path to calculate statistics.

  const stats = await Tour.aggregate([
    // stage 1: to match the documents having rating gte 4.5
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // stage 2: to group them according to different ids.

    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // stage 3: sorting the above result according to one of the parameters taken above like avgRating.

    {
      $sort: { avgPrice: 1 },
    },

    // stage 4: again match the above result with not equal to easy one. therefore we can repeat stages multiple times
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  if (unit !== 'mi' && unit !== 'km') {
    return next(
      new AppError('Please provide unit in the format mi or km.', 400)
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  if (unit !== 'mi' && unit !== 'km') {
    return next(
      new AppError('Please provide unit in the format mi or km.', 400)
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});
