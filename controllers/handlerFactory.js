const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // 204: CONTENT NOT EXIST
    res.status(204).json({ status: 'success', data: null });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // (id of updated doc ,body of doc, options)
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // one way to create tour is to make an instance of it and then save it.
    // const newTour = new Tour({});
    // newTour.save()
    // other way to create tour is call create method directly on Tour model which will return a promise which we can consume
    // to pass so
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      // 201: created successfully,
      status: 'success',
      data: { data: newDoc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // fixing the mongoose to tell the exact error 404 instead of default 500
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({ status: 'success', data: { data: doc } });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); // methods can only be chained when previously attached method returns something.

    const docs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { data: docs },
    });
  });
