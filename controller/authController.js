const { check, validationResult } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
  res.render('auth/Login', {
    pageTitle: 'Home Login',
    currentPage: 'login',
    isLoggedIn: false,
    errors: [],
    oldInput: { email: '' },
    user: {},
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(422).render('auth/Login', {
      pageTitle: 'Home Login',
      currentPage: 'login',
      isLoggedIn: false,
      errors: ['Invalid email'],
      oldInput: { email: email },
      user: {},
    });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(422).render('auth/Login', {
      pageTitle: 'Home Login',
      currentPage: 'login',
      isLoggedIn: false,
      errors: ['Invalid password'],
      oldInput: { email: email },
      user: {},
    });
  }

  req.session.isLoggedIn = true;
  req.session.user = {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
  };
  await req.session.save();

  res.redirect('/');
};

exports.postLogout = (req, res, next) => {
  // res.cookie('isLoggedIn', false);
  req.session.destroy((err) => {
    console.log('session destroy error: ', err);
    res.redirect('/login');
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    pageTitle: 'Home Signup',
    currentPage: 'signup',
    isLoggedIn: false,
    errors: [],
    oldInput: {
      firstName: '',
      lastName: '',
      email: '',
      userType: '',
    },
    user: {},
  });
};

exports.postSignup = [
  check('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long')
    .matches(/^[A-Za-z]+$/)
    .withMessage('First name should contain only alphabets'),

  check('lastName')
    .matches(/^[A-Za-z]+$/)
    .withMessage('Last name should contain only alphabets'),

  check('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  check('password')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character')
    .trim(),

  check('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  check('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['guest', 'host'])
    .withMessage('Invalid user type'),

  check('terms')
    .notEmpty()
    .withMessage('You must agree to the terms and conditions')
    .custom((value) => {
      if (value !== 'on') {
        throw new Error('You must agree to the terms and conditions');
      }
      return true;
    }),

  (req, res, next) => {
    const { firstName, lastName, email, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/signup', {
        pageTitle: 'Home Signup',
        currentPage: 'signup',
        isLoggedIn: false,
        errors: errors.array().map((error) => error.msg),
        oldInput: { firstName, lastName, email, password, userType },
        user: {},
      });
    }

    bcrypt
      .hash(password, 12)
      .then((hashedPassword) => {
        const user = new User({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          userType,
        });
        return user.save();
      })
      .then(() => {
        console.log('User created successfully');
        res.redirect('/login');
      })
      .catch((err) => {
        console.error('Error creating user:', err);
        return res.status(422).render('auth/signup', {
          pageTitle: 'Home Signup',
          currentPage: 'signup',
          isLoggedIn: false,
          errors: [err.message],
          oldInput: { firstName, lastName, email, userType },
          user: {},
        });
      });

  },
];
