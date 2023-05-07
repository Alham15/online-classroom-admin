

const { body, validationResult } = require("express-validator");
const validator = require("validator");
var express = require("express");
const router = require("express-promise-router").default();
const graph = require("../graph");

/* GET home page. */
router.get("/", async function (req, res) {
  if (!req.session.userId) {
    // Redirect unauthenticated requests to home page
    res.redirect("/");
  } else {
    let params = {
      active: { lobby: true },
    };

    const user = req.app.locals.users[req.session.userId];

    
    res.render("lobby", params);
  }
});

module.exports = router;
// </IndexRouterSnippet>
