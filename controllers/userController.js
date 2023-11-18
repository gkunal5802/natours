const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

// STORING THE UPLOADED FILE IN MEMORY BUFFER
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  console.log(file);

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500) // passing height , width, options to set fit,center etc..
    .toFormat('jpeg')
    .jpeg({ quality: 90 }) // quality degrade to 90%. It compresses the img to save storage
    .toFile(`public/img/users/${req.file.filename}`); // destination.

  next();
});

//   const streamUpload = () =>
//     new Promise((resolve) => {
//       cloudinary.uploader
//         .upload_stream(
//           {
//             folder: 'Natours/users',
//             public_id: req.file.filename,
//             access_mode: 'public',
//             overwrite: true,
//           },
//           (error, result) => {
//             if (result) {
//               resolve(result);
//             } else {
//               return next(new AppError('Error uploading file to cloudinary'));
//             }
//           }
//         )
//         .end(req.file.buffer);
//     });
//   const result = await streamUpload();

//   req.file.filename = result.secure_url;

//   next();
// });

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
  // 1) Create Error, if user Posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      ) // bad request
    );
  }

  // 2) Filtered out the fields that are not allowed to be upadeted like passswords, role, resetToken.
  const filteredBody = filterObj(req.body, 'name', 'email');

  console.log(req.file);

  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

// DO NOT UPDATE THE PASSWORD WITH THIS!!
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
