const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const multer = require('multer');

const storeRouter = require('./routes/storeRouter');
const { hostRouter } = require('./routes/hostRouter');
const { authRouter } = require('./routes/authRouter');
const { pageNotFound } = require('./controller/errors');

const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is missing. Copy .env.example to .env and set your MongoDB connection string.',
  );
}

if (/<[^>]+>/.test(MONGODB_URI)) {
  throw new Error(
    'MONGODB_URI still contains example placeholders. Copy the real connection string from MongoDB Atlas: Database > Connect > Drivers.',
  );
}

let mongoUri;
try {
  mongoUri = new URL(MONGODB_URI);
} catch {
  throw new Error(
    'MONGODB_URI is not a valid connection string. Copy the MongoDB URI from Atlas and URL-encode special characters in the username or password.',
  );
}

if (
  !['mongodb:', 'mongodb+srv:'].includes(mongoUri.protocol) ||
  !mongoUri.hostname
) {
  throw new Error(
    'MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string with a database host.',
  );
}

if (!SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET is missing. Set it in .env or your deployment environment variables.',
  );
}

const app = express();
let sessionStore;
let sessionStoreConnection;
let sessionMiddleware;
const connectToSessionStore = () => {
  if (!sessionStoreConnection) {
    sessionStoreConnection = (async () => {
      const store = new MongoDBStore({
        uri: MONGODB_URI,
        collection: 'sessions',
      });

      store.on('error', (error) => {
        console.error('MongoDB session store error:', error.message);
      });

      try {
        await store.initialConnectionPromise;
      } catch (error) {
        try {
          await store.client.close();
        } catch (closeError) {
          console.error(
            'Unable to close failed MongoDB session connection:',
            closeError.message,
          );
        }
        throw error;
      }

      sessionStore = store;
      sessionMiddleware = session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      });
    })().catch((error) => {
      sessionStoreConnection = undefined;
      throw error;
    });
  }
  return sessionStoreConnection;
};

let databaseConnection;
const connectToDatabase = () => {
  if (!databaseConnection) {
    databaseConnection = mongoose.connect(MONGODB_URI).catch((error) => {
      databaseConnection = undefined;
      throw error;
    });
  }
  return databaseConnection;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const supportedTypes = ['image/png', 'image/jpeg'];
    if (!supportedTypes.includes(file.mimetype)) {
      const error = new Error('Only PNG and JPEG images are supported.');
      error.code = 'INVALID_IMAGE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: false }));
app.use(upload.single('photo'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/host/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/homes/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(async (req, res, next) => {
  try {
    await Promise.all([connectToDatabase(), connectToSessionStore()]);
    sessionMiddleware(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  req.isLoggedIn = Boolean(req.session.isLoggedIn);
  next();
});

app.use(authRouter);
app.use(storeRouter);
app.use('/host', (req, res, next) => {
  if (req.isLoggedIn && req.session.user.userType === 'host') {
    return next();
  }
  if (!req.isLoggedIn) {
    return res.redirect('/login');
  }
  return res.sendStatus(403);
});
app.use('/host', hostRouter);
app.use(pageNotFound);

app.use((error, req, res, next) => {
  console.error('Request failed:', error);
  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    error.code === 'INVALID_IMAGE_TYPE'
      ? 400
      : error instanceof multer.MulterError
        ? error.code === 'LIMIT_FILE_SIZE'
          ? 413
          : 400
        : 500;
  return res
    .status(statusCode)
    .send(
      statusCode === 413
        ? 'Image is too large. Please upload an image smaller than 4 MB.'
        : statusCode === 400
          ? 'Invalid image upload. Please use a PNG or JPEG image.'
          : 'Internal Server Error',
    );
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  Promise.all([connectToDatabase(), connectToSessionStore()])
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error(
        'Unable to start: check your MongoDB URI, credentials, and Atlas network access.',
      );
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = app;
