
const dateFns = require("date-fns");
const zonedTimeToUtc = require("date-fns-tz/zonedTimeToUtc");
const iana = require("windows-iana");
const { body, validationResult } = require("express-validator");
const validator = require("validator");
var express = require("express");
const router = require("express-promise-router").default();
const graph = require("../graph");

/* GET home page. */
router.get('/', async function (req, res) {

  

  if (!req.session.userId) {
      // Redirect unauthenticated requests to home page
      res.redirect('/');
    } else {
  let params = {
    active: { mail: true },
  };

  const user = req.app.locals.users[req.session.userId];
console.log(req);

  try {
    // Get the events
    const events = await graph.sendMail(
      req.app.locals.msalClient,
      req.session.userId
    );


  } catch (err) {
    req.flash("error_msg", {
      message: "Could not fetch events for mail",
      debug: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
    
  }
  res.render("mail", params);
}
}
);

module.exports = router;

