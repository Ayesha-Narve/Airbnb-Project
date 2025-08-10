const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

router.route("/")
    .get( wrapAsync(listingController.index))   //INDEX Route
    .post(isLoggedIn ,
    upload.single('listing[image]'), //multer process this and convert to req.file
      validateListing,
     wrapAsync(listingController.createNewListing));  //CREATE Route
    

//NEW Route
router.get("/new",isLoggedIn , listingController.renderNewForm );

//search listing based on the location
router.get("/search", listingController.searchBasedOnLocation);

router.route("/:id")
.get(wrapAsync(listingController.showListing))  //SHOW Route
.put(isLoggedIn , isOwner,
  upload.single('listing[image]'),
   validateListing, wrapAsync(listingController.updateListing))  //UPDATE Route
.delete(isLoggedIn ,isOwner, wrapAsync(listingController.destroyListing));  //DELETE Route


//EDIT Route
router.get("/:id/edit",isLoggedIn , isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;