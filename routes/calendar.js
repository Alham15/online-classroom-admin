
const router = require('express-promise-router').default();
const graph = require('../graph.js');
const dateFns = require('date-fns');
const zonedTimeToUtc = require('date-fns-tz/zonedTimeToUtc');
const iana = require('windows-iana');
const { body, validationResult } = require('express-validator');
const validator = require('validator');
const timeZoneId = iana.findIana("India Standard Time")[0];

router.get('/',
  async function(req, res) {
    if (!req.session.userId) {

      res.redirect('/');
    } else {
      const params = {
        active: { calendar: true }
      };

      const user = req.app.locals.users[req.session.userId];

      const timeZoneId = iana.findIana('India Standard Time')[0];
      console.log(`Time zone: ${timeZoneId.valueOf()}`);


      var weekStart = zonedTimeToUtc(
        dateFns.startOfWeek(new Date()),
        'Asia/Calcutta'
      );
      var weekEnd = dateFns.addDays(weekStart, 7);
      console.log(`Start: ${dateFns.formatISO(weekStart)}`);

      try {

        const events = await graph.getCalendarView(
          req.app.locals.msalClient,
          req.session.userId,
          dateFns.formatISO(weekStart),
          dateFns.formatISO(weekEnd),
          'Asia/Calcutta'
        );

        params.events = events.value;
      } catch (err) {
        req.flash('error_msg', {
          message: 'Could not fetch events',
          debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }

      res.render('calendar', params);
    }
  }
);

router.get('/new',
  function(req, res) {
    if (!req.session.userId) {

      res.redirect('/');
    } else {
      res.locals.newEvent = {};
      res.render('newevent');
    }
  }
);

router.post('/new', [
  body('ev-subject').escape(),

  body('ev-attendees').customSanitizer(value => {
    return value.split(';');

  }).custom(value => {
    value.forEach(element => {
      if (!validator.isEmail(element)) {
        throw new Error('Invalid email address');
      }
    });

    return true;
  }),

  body('ev-start').isISO8601(),
  body('ev-end').isISO8601(),
  body('ev-body').escape()
], async function(req, res) {
  if (!req.session.userId) {

    res.redirect('/');
  } else {
    let meetingCode = Math.random()
    let url = `https://alham15.github.io/online-classroom.github.io/room.html?room=${meetingCode}`;
    req.body["ev-body"] = "Join the meeting" + " " + url + `\nMeeting code: ${meetingCode}`;
    const formData = {
      subject: req.body['ev-subject'],
      attendees: req.body['ev-attendees'],
      start: req.body['ev-start'],
      end: req.body['ev-end'],
      body: req.body['ev-body']
    };

    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {

      let invalidFields = '';
      formErrors.array().forEach(error => {
        invalidFields += `${error.param.slice(3, error.param.length)},`;
      });


      formData.attendees = formData.attendees.join(';');
      return res.render('newevent', {
        newEvent: formData,
        error: [{ message: `Invalid input in the following fields: ${invalidFields}` }]
      });
    }


    const user = req.app.locals.users[req.session.userId];

    try {
      await graph.createEvent(
        req.app.locals.msalClient,
        req.session.userId,
        formData,
        'Asia/Calcutta'
      );
    } catch (error) {
      req.flash('error_msg', {
        message: 'Could not create event',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
    }

    return res.redirect('/calendar');
  }
}
);
module.exports = router;
