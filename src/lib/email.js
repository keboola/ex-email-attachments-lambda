const _ = require('lodash');
const simpleParser = require('mailparser').simpleParser;
const { UserError } = require('@keboola/serverless-request-handler');

module.exports.getRecipientFromEmail = (rawEmail, domain) => simpleParser(rawEmail)
  .then(email => {
    const recipients = email.to.value;
    if (_.has(email, 'cc')) {
      recipients.push(...email.cc.value);
    }
    if (_.has(email, 'bcc')) {
      recipients.push(...email.bcc.value);
    }
    let res;
    recipients.forEach((item) => {
      if (_.endsWith(item.address, domain)) {
        const addressParts = _.split(item.address, '-');
        if (_.size(addressParts) >= 3) {
          res = {
            address: item.address,
            project: addressParts[0],
            config: addressParts[1],
          };
        }
      }
    });
    if (res) {
      return res;
    }
    throw UserError.unprocessable('Invalid email address');
  });
