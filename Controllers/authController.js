const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // used to generate json web tokens
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  user.password = undefined;
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // lets send data back to client
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  // lets get data from request. newUser will await for the request to complete.
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  // sign method requires (payload,secret string, options)
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password exist
  if (!email || !password) {
    // needs to return right away because then there will be 2 responses.
    return next(new AppError('Please provide email and password!', 400));
  }

  // console.log(Tour.find());

  // 2) check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Password or email!', 401)); // unauthorized access
  }

  // 3) If everything is ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

// MIDDLEWARE: to protect the routes from accessing by anyone who is not logged in.
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting the token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in!, please login to get access.', 401)
    );
  }
  // 2) Verification Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists: what if user is deleted after creating the token.
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this Tour does no longer exist.', 401)
    );
  }
  // 4) Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  // GRANT ACCESS TO THE PROTECTED ROUTE
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);

      // Check if user exists
      if (!currentUser) {
        return next();
      }

      // check if user hasn't changed password
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a LOGGED IN user. response.locals helps to access our user in all our files including pug files.
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles: ['admin','lead-guide']. roles - ['user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      ); // 403: means forbidden
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.passwordTokenExpiresIn = undefined;

    await user.save();

    return next(
      new AppError('There was an error sending email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get the user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    passwordTokenExpiresIn: { $gt: Date.now() },
  });

  // 2) If token is not expired and there is user, set the new password.
  if (!user) {
    return next(new AppError('Token is invalid or expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.passwordTokenExpiresIn = undefined;

  await user.save();
  // 3) Change the passwordChangedAt property of user.
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from collection

  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Password is incorrect!', 401)); // 401 unauthorized

  // 3) update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // this can't be done by findByIdandUpdate because it won't work as intended for the validators and pre-save middlewares.
  // 4) log the user in, send JWT

  createSendToken(user, 200, res);
});
