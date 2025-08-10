if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const joi = require('joi'); // for validation
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");

const listingsRoute = require("./routes/listing.js");
const reviewsRoute = require("./routes/review.js");
const userRoute = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

async function main() {
    await mongoose.connect(dbUrl);
}
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // for PUT and DELETE requests
app.engine('ejs', ejsMate); // to use ejs-mate for layout support
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", () => {
    console.log("error in mongo session store",err)
})
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    }
}


// app.get('/', (req, res) => {
//     res.send("Root is working");
// });

app.use( session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use( new LocalStrategy(User.authenticate())); //use to authenticate the incoming user. it's a static method added by passport-local-mongoose
//serialize and deserialize the user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/listings/find", async (req, res) => {
    const { category } = req.query;
    let query = {};

    if (category) {
        query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') }; // Matches exactly
    }

    const listings = await Listing.find(query);
    res.render("listings/index", { listings });
});


app.use("/listings", listingsRoute);
app.use("/listings/:id/reviews", reviewsRoute);
app.use("/", userRoute);



app.all('*', (req,res, next)=> {
    next(new ExpressError(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
    const {statusCode=500, message="Something wents wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send(message);
});


app.listen(8080, () => {
    console.log('Server is running on port 8080');  
});