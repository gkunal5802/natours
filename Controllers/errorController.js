const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  console.log(message);
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidatorErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${error.join('. ')}.`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

const SendErrorDev = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //B) RENDERED WEBSITE
  console.error('ERROR: 💥 ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const SendErrorProd = (err, req, res) => {
  console.log(err.isOperational);
  // A) API
  // A) Operational, trusted error: send error to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // B) Programming or other unknown error: don't leak error details
    // 1) log error
    console.error('ERROR: ', err);

    // 2) Send Generic error message
    return res.status(500).json({
      status: 'error',
      error: err,
      message: 'Something went very wrong!',
    });
  }
  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send error to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // b) programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR: ', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    SendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // console.log(error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error._message === 'Validation failed')
      error = handleValidatorErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    SendErrorProd(error, req, res);
  }
};
