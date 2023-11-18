const mongoose = require('mongoose');
const dotenv = require('dotenv');

// ERROR HANDLING: used to catch error that aren't opeartional and programming.
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); //& { $env:NODE_ENV = "development"; nodemon server.js }

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// mongoose.connect(process.env.DATABASE_LOCAL).then(() => {
mongoose.connect(DB).then(() => {
  console.log('DB connection successful!');
  // creating a server and listening on port 3000. it is different from http
  const port = process.env.PORT || 3000;

  const server = app.listen(port, () =>
    console.log(`App running on port ${port}...`)
  );
  // catching the errors in unhandled rejections of promises like changed password of database
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);

    // it means we aborting and finishing all the ongoing requests on server first before closing the process.
    server.close(() => {
      process.exit(1); // 1 means unhandled exception & 0 means success.
    });
  });
});
