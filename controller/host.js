const Home = require('../models/home');

exports.getAddHome = (req, res, next) => {
  res.render('host/edit-Home', {
    pageTitle: 'Add Home',
    currentPage: 'addHome',
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === 'true';

  Home.findById(homeId).then((home) => {
    // console.log(homeId, editing, home);
    if (!home) {
      console.log('Home not found');
      return res.redirect('/host/host-home-list');
    }
    res.render('host/edit-Home', {
      home: home,
      pageTitle: 'Edit Home',
      currentPage: 'host-Homes',
      editing: editing,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getHostHomes = (req, res, next) => {
  // console.log(registeredHomes);
  Home.find().then((registeredHomes) => {
    res.render('host/host-home-list', {
      registeredHomes: registeredHomes,
      pageTitle: 'Host Home list',
      currentPage: 'host-Homes',
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.postAddHome = async (req, res, next) => {
  const { homeName, price, homeAddress, rating, description } = req.body;

  if (!req.file) {
    return res.status(422).send('Please provide a PNG or JPEG image.');
  }

  const home = new Home({
    homeName,
    price,
    homeAddress,
    rating,
    photoData: req.file.buffer,
    photoContentType: req.file.mimetype,
    description,
  });

  try {
    await home.save();
    return res.redirect('/host/host-home-list');
  } catch (error) {
    return next(error);
  }
};

exports.postEditHome = async (req, res, next) => {
  const { id, homeName, price, homeAddress, rating, description } = req.body;

  try {
    const home = await Home.findById(id);
    if (!home) {
      return res.status(404).send('Home not found.');
    }

    home.homeName = homeName;
    home.price = price;
    home.homeAddress = homeAddress;
    home.rating = rating;
    home.description = description;

    if (req.file) {
      home.photoData = req.file.buffer;
      home.photoContentType = req.file.mimetype;
      home.photo = undefined;
    }

    await home.save();
    return res.redirect('/host/host-home-list');
  } catch (error) {
    return next(error);
  }
};

exports.postDeleteHome = async (req, res, next) => {
  const homeId = req.params.homeId;
  try {
    await Home.findByIdAndDelete(homeId);
    return res.redirect('/host/host-home-list');
  } catch (error) {
    return next(error);
  }
};
