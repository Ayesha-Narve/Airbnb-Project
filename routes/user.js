const express = require('express');
const { default: mongoose } = require('mongoose');
const router = express.Router();
const User = require("../models/user.js")
const wrapAsync = require("../utils/wrapAsync");
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware.js');
const userController = require("../controllers/users.js");

router.route("/signup")
.get( userController.renderSignupForm)
.post(wrapAsync(userController.signup));

router.route("/login")
.get(userController.renderLoginForm)
//here user are logged in with the help of passport
.post(saveRedirectUrl, passport.authenticate("local",
    { failureRedirect: "/login",
        failureFlash: true,
    }),
    userController.loginSuccessMsg);

router.get("/logout", userController.logout );

module.exports = router;