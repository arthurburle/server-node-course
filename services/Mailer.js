const sendgrid = require('sendgrid');
const {
  Mail,
  Email,
  Content,
  TrackingSettings,
  ClickTracking,
  Personalization,
} = sendgrid.mail;
const keys = require('../config/keys');

class Mailer extends Mail {
  constructor({ subject, recipients }, content) {
    super();

    this.sgApi = sendgrid(keys.sendGridKey);
    this.from_email = new Email('arthurburle@gmail.com');
    this.subject = subject;
    this.body = new Content('text/html', content);
    this.recipients = this.formatAddresses(recipients);

    this.addContent(this.body);
    this.addClickTracking();
    this.addRecipients();
  }

  formatAddresses(recipients) {
    return recipients.map(({ email }) => new Email(email));
  }

  addClickTracking() {
    const trackingSettings = new TrackingSettings();
    const clickTracking = new ClickTracking(true, true);

    trackingSettings.setClickTracking(clickTracking);
    this.addTrackingSettings(trackingSettings);
  }

  addRecipients() {
    const personalize = new Personalization();

    this.recipients.forEach(recipient => {
      personalize.addTo(recipient);
    });
    this.addPersonalization(personalize);
  }

  async send() {
    const request = this.sgApi.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: this.toJSON(),
    });

    const response = await this.sgApi.API(request);
    return response;
  }
}

module.exports = Mailer;
