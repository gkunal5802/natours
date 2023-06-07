const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please fill in your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // this only works for CREATE AND SAVE!!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  resetPasswordToken: String,
  passwordTokenExpiresIn: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// PRE MIDDLEWARE: used to modify the password after creating before saving it to the model.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // hashing the password with the cost of 12. It is called salting the password
  this.password = await bcrypt.hash(this.password, 12);

  // delete confirm password field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // need to subtract 1000ms because there might be a possiblity that jwt is issued a little bit earlier than setting this password.
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// it is an instance of user which can be accessed in any document
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  const bool = await bcrypt.compare(candidatePassword, userPassword);
  console.log(bool);
  return bool;
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimeStamp < changedTimeStamp;
  }

  // means password is not changed
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  // just like a password which helps the user to create a new password.
  const resetToken = crypto.randomBytes(32).toString('hex');

  // this needs to be hashed so that attacker can not access our database and change the password.
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordTokenExpiresIn = Date.now() + 10 * 60 * 1000; // 10 minutes to change the password. Else the reset token will expires.
  // console.log({ resetToken }, this.resetPasswordToken);
  return resetToken;
};
// model(name of model, model made from which schema)
const User = mongoose.model('User', userSchema);

module.exports = User;
