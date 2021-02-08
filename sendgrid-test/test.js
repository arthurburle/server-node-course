// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(
  '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'
);
const msg = {
  to: 'meowscalc@gmail.com',
  from: 'arthurburle@gmail.com',
  subject: 'Sending with Twilio SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
sgMail.send(msg);
