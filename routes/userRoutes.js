const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const Router = express.Router();

// These routes does not require authorization i.e. user doesn't need to be logged in to perform below.

Router.post('/signup', authController.signUp);
Router.post('/login', authController.login);
Router.get('/logout', authController.logout);
Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

// Protect routes after this middleware
Router.use(authController.protect);

Router.patch('/updateMyPassword', authController.updatePassword);

Router.get('/me', userController.getMe, userController.getUser);

Router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

Router.delete('/deleteMe', userController.deleteMe);

// Protect below routes from exposing to all the other user.

Router.use(authController.restrictTo('admin'));

Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
