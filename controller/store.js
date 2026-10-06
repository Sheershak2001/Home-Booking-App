const Home = require('../models/home');
const User = require('../models/user');

exports.getIndex = (req, res, next) => {
  // console.log('session value: ', req.session);
  Home.find().then((registeredHomes) => {
    res.render('store/index', {
      registeredHomes: registeredHomes,
      pageTitle: 'Home',
      currentPage: 'index',
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHomes = (req, res, next) => {
  // console.log(registeredHomes);
  Home.find().then((registeredHomes) => {
    res.render('store/home-list', {
      registeredHomes: registeredHomes,
      pageTitle: 'Home list',
      currentPage: 'Home',
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getBookings = (req, res, next) => {
  // console.log(registeredHomes);
  res.render('store/bookings', {
    pageTitle: 'My bookings',
    currentPage: 'bookings',
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = req.session.user.id;

  const user = await User.findById(userId).populate('favourites');

  console.log('Favourite Homes:', user.favourites);

  res.render('store/favourite-list', {
    favouriteHomes: user.favourites,
    pageTitle: 'My Favourites',
    currentPage: 'favourites',
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.postAddToFavourites = async (req, res, next) => {
  // console.log("Apple", req.body);
  const homeId = req.body.id;
  const userId = req.session.user.id;
  const user = await User.findById(userId);
  if (!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save();
  }

  res.redirect('/favourites');
};

exports.postRemoveFromFavourites = async (req, res, next) => {
  const homeId = req.params.homeId;
  const userId = req.session.user.id;
  const user = await User.findById(userId);

  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter(
      (favId) => favId.toString() !== homeId,
    );
    await user.save();
  }

  res.redirect('/favourites');
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  // console.log("homeId", homeId);
  Home.findById(homeId).then((home) => {
    // console.log("Home Details", home);
    if (!home) {
      res.redirect('/homes');
    } else {
      res.render('store/home-detail', {
        home: home,
        pageTitle: 'Home Details',
        currentPage: 'home',
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};

exports.getHomePhoto = async (req, res, next) => {
  try {
    const home = await Home.findById(req.params.homeId);
    if (!home) {
      return res.sendStatus(404);
    }

    if (!home.photoData || !home.photoContentType) {
      return home.photoUrl
        ? res.redirect(home.photoUrl)
        : res.sendStatus(404);
    }

    res.set('X-Content-Type-Options', 'nosniff');
    return res.type(home.photoContentType).send(home.photoData);
  } catch (error) {
    return next(error);
  }
};
