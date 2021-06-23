import _ from 'lodash';
import { simpleParser } from 'mailparser';
import createError from 'http-errors';

export default function getRecipientFromEmail(rawEmail, domain) {
  return simpleParser(rawEmail)
    .then((email) => {
      const recipients = email.to.value;
      if (_.has(email, 'cc')) {
        recipients.push(...email.cc.value);
      }
      if (_.has(email, 'bcc')) {
        recipients.push(...email.bcc.value);
      }
      // eslint-disable-next-line no-console
      console.log('recipients', recipients);

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
      throw createError(422, 'Invalid email address');
    });
}
