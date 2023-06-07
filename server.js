const dotenv = require('dotenv');

// ERROR HANDLING: used to catch error that aren't opeartional and programming.
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION 💥 Shutting down....');
  process.exit(1);
});
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// connecting mongodb with mongodb driver - mongoose to our database mongodb atlas.
mongoose
  // .connect(process.env.DATABASE_LOCAL, { // connecting to local database
  .connect(DB, {
    // connecting to hosted database version
    // connect method will return a promise
    // some options to deal with deprecation warnings
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// saving the document to our server & can be seen at atlas and compass. This is called connecting our express application to our mongoose database
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR 💥', err);
//   });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  // creating a server and listening on port 3000. it is different from http
  console.log(`Application running on port ${port}`);
});

// catching the errors in unhandled rejections of promises like changed password of database
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTIONS 💥 Shutting down...');

  // it means we aborting and finishing all the ongoing requests on server first before closing the process.
  server.close(() => {
    process.exit(1); // 1 means unhandled exception & 0 means success.
  });
});
