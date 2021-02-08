const { Path } = require('path-parser');
const _ = require('lodash');
const { URL } = require('url');
const mongoose = require('mongoose');
const requireAuth = require('../middlewares/requireAuth');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

const Survey = mongoose.model('surveys');

module.exports = app => {
  app.get('/api/surveys', requireAuth, async (req, res) => {
    const surveys = await Survey.find({ _user: req.user.id }).select({
      recipients: false,
    });

    res.send(surveys);
  });

  app.get('/api/surveys/:surveyId/:choice', (req, res) => {
    res.send('Thanks for voting!');
  });

  app.post('/api/surveys/webhooks', (req, res) => {
    const p = new Path('/api/surveys/:surveyId/:choice');

    // lodash chain method
    _.chain(req.body)
      .map(({ email, url }) => {
        const match = p.test(new URL(url).pathname);
        if (match) {
          const { surveyId, choice } = match;
          return { email, surveyId, choice };
        }
      })
      // removes undefined
      .compact()
      // removes duplicates
      .uniqBy('email', 'surveyId')
      .each(({ surveyId, email, choice }) => {
        Survey.updateOne(
          {
            _id: surveyId,
            recipients: {
              $elemMatch: { email, responded: false },
            },
          },
          {
            $inc: { [choice]: 1 },
            $set: { 'recipients.$.responded': true },
            lastResponded: new Date(),
          }
        ).exec();
      })
      // returns the values
      .value();

    res.send({});
  });

  app.post('/api/surveys', requireAuth, requireCredits, async (req, res) => {
    const { title, subject, body, recipients } = req.body;

    if (!title || !subject || !body || !recipients) {
      res.status(401).send({ error: 'You need to provide all the fields' });
    }

    const survey = new Survey({
      title,
      subject,
      body,
      recipients: recipients.split(',').map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now(),
    });

    const mailer = new Mailer(survey, surveyTemplate(survey));

    try {
      await mailer.send();
      await survey.save();
      req.user.credits -= 1;
      const user = await req.user.save();

      res.send(user);
    } catch (err) {
      res.status(422).send(err);
    }
  });
};

// arthurtesting
// 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

/* 
echo "export SENDGRID_API_KEY='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'" > sendgrid.env
echo "sendgrid.env" >> .gitignore
source ./sendgrid.env
*/

// npm install --save @sendgrid/mail

/*

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
javascript
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const msg = {
  to: 'test@example.com', // Change to your recipient
  from: 'test@example.com', // Change to your verified sender
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })

*/