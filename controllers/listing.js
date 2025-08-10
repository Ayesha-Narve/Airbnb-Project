const Listing  = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({accessToken: mapToken});

module.exports.index = async (req, res) => {
    const allListing = await Listing.find({});
    res.render('listings/index.ejs', { listings: allListing });
};
module.exports.searchBasedOnLocation = async (req, res) =>{
    const location = req.query.location;
    if(!location) {
        return res.render("listings/index.ejs");
    }
    try {
    const listings = await Listing.find({
      location: { $regex: new RegExp(location, 'i') }
    });
    res.render("listings/index.ejs", { listings });  
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error ");
  }
};

module.exports.renderNewForm = (req, res) => {
    res.render('listings/new.ejs');
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({ path: 'reviews', 
        populate: { path: 'author'},
    }).populate('owner');
    if(!listing) {
        req.flash("error", "Listing you requested for, does not exist!");
        res.redirect("/listings");
    }
    res.render('listings/show.ejs', { listing });
};

module.exports.createNewListing = async (req, res, next) => {
  let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send()
  
    // let { title, description, price, location, country } = req.body; one way to add listing
    // if (!req.body.listing) {
    //     throw new ExpressError(400, "Send valid Data for listing creation");
    // }
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url,filename};

    newListing.geometry = response.body.features[0].geometry; 
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id }= req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you are requested for does not exist!");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
     originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } =req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if(typeof req.file!=="undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename};
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    //console.log(`Deleted listing: ${deletedListing}`);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};