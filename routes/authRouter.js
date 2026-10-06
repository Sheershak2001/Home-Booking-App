// Extrenal Module
const express = require('express');
const authRouter = express.Router();

// Local Module
const {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
} = require('../controller/authController');

authRouter.get('/login', getLogin);
authRouter.post('/login', postLogin);
authRouter.post('/logout', postLogout);
authRouter.get('/signup', getSignup);
authRouter.post('/signup', postSignup);

exports.authRouter = authRouter;
