import _ from 'lodash';
import expect from 'unexpected';
import fs from 'fs';
import uniqid from 'uniqid';

import getRecipientFromEmail from '../../src/lib/email';

describe('email', () => {
  let projectId;
  let config;
  let email;

  beforeEach(() => {
    projectId = _.random(1, 128);
    config = uniqid();
    email = `${projectId}-${config}-${uniqid()}@import.test.keboola.com`;
  });

  it('check in To', () =>
    getRecipientFromEmail(
      _.replace(fs.readFileSync(`${__dirname}/../email`), '{{EMAIL}}', email),
      process.env.EMAIL_DOMAIN
    )
      .then((res) => {
        expect(res, 'to have key', 'address');
        expect(res.address, 'to be', email);
        expect(res, 'to have key', 'project');
        expect(res.project, 'to be', `${projectId}`);
        expect(res, 'to have key', 'config');
        expect(res.config, 'to be', config);
      }));

  it('check in multiple To', () =>
    getRecipientFromEmail(
      _.replace(fs.readFileSync(`${__dirname}/../email-multiple-to`), '{{EMAIL}}', email),
      process.env.EMAIL_DOMAIN
    )
      .then((res) => {
        expect(res, 'to have key', 'address');
        expect(res.address, 'to be', email);
        expect(res, 'to have key', 'project');
        expect(res.project, 'to be', `${projectId}`);
        expect(res, 'to have key', 'config');
        expect(res.config, 'to be', config);
      }));

  it('check in Cc', () =>
    getRecipientFromEmail(
      _.replace(fs.readFileSync(`${__dirname}/../email-cc`), '{{EMAIL}}', email),
      process.env.EMAIL_DOMAIN
    )
      .then((res) => {
        expect(res, 'to have key', 'address');
        expect(res.address, 'to be', email);
        expect(res, 'to have key', 'project');
        expect(res.project, 'to be', `${projectId}`);
        expect(res, 'to have key', 'config');
        expect(res.config, 'to be', config);
      }));
});
