// External Module
const express = require("express");
const storeRouter = express.Router();

// Local Module
const {
  getHomes,
  getBookings,
  getIndex,
  getFavouriteList,
  getHomeDetails,
  getHomePhoto,
  postAddToFavourites,
  postRemoveFromFavourites,
} = require("../controller/store");

const requireLogin = (req, res, next) => {
  if (req.isLoggedIn) {
    return next();
  }
  return res.redirect("/login");
};

storeRouter.get("/", getIndex);
storeRouter.get("/homes", getHomes);
storeRouter.get("/bookings", getBookings);
storeRouter.get("/favourites", requireLogin, getFavouriteList);
storeRouter.get("/homes/:homeId/photo", getHomePhoto);
storeRouter.get("/homes/:homeId", getHomeDetails);
storeRouter.post("/favourites", requireLogin, postAddToFavourites);
storeRouter.post("/favourites/delete/:homeId", requireLogin, postRemoveFromFavourites);

module.exports = storeRouter;
