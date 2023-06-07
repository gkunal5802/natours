// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require('multer');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

// STORING THE UPLOADED FILE IN DISK SPACE
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // error , destination
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// STORING THE UPLOADED FILE IN MEMORY BUFFER
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  console.log(file);
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image. please upload images only!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  console.log(req.file);
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500) // passing height , width, options to set fit,center etc..
    .toFormat('jpeg')
    .jpeg({ quality: 90 }) // quality degrade to 90%. It compresses the img to save storage
    .toFile(`public/img/users/${req.file.filename}`); // destination.

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create Error, if user POSTs password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      ) //bad request
    );
  }

  // 2) Filtered out the fields that are not allowed to be updated like password, role, resetToken.
  const filterBody = filterObj(req.body, 'name', 'email');

  if (req.file) filterBody.photo = req.file.filename;
  // console.log(req.body);
  // console.log(filterBody);
  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not defined. Please use /signup instead',
  });
});
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// DO NOT UPDATE THE PASSWORD WITH THIS!!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
