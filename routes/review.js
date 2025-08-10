const express = require('express');
const router = express.Router({ mergeParams: true });
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError'); // custom error class for handling errors
const Review = require("../models/review");
const {validatereview, isLoggedIn, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");


// adding review in listings 
router.post("/",isLoggedIn, validatereview, wrapAsync(reviewController.createReview));
// delete review route 
router.delete("/:reviewId",isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;