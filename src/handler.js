import _ from 'lodash';
import aws from 'aws-sdk';
import moment from 'moment';
import bluebird from 'bluebird';
import createError from 'http-errors';
import errorLogger from '@keboola/middy-error-logger';
import { install } from 'source-map-support';
import middy from 'middy';

import getRecipientFromEmail from './lib/email';

install();
process.env.BLUEBIRD_LONG_STACK_TRACES = 1;
global.Promise = bluebird;

let s3 = new aws.S3({});
let dynamo = new aws.DynamoDB({ region: process.env.REGION });

export const setS3 = (client) => {
  s3 = client;
};
export const setDynamo = (client) => {
  dynamo = client;
};

const getFileName = (mail) => `${mail.address}-${moment().toISOString()}`;

const moveFile = (s3Client, bucket, from, to) => s3Client.copyObject({
  CopySource: `${bucket}/${from}`,
  Bucket: bucket,
  Key: to,
}).promise()
  .then(() => s3.deleteObject({ Bucket: bucket, Key: from }).promise());

const handlerFunction = async (event) => {
  if (!_.has(event, 'Records') || !event.Records.length
    || !_.has(event.Records[0], 's3') || !_.has(event.Records[0].s3, 'bucket')
    || !_.has(event.Records[0].s3, 'object')
    || !_.has(event.Records[0].s3.bucket, 'name')
    || !_.has(event.Records[0].s3.object, 'key')) {
    throw Error(`Event is missing. See: ${JSON.stringify(event)}`);
  }
  // eslint-disable-next-line no-console
  console.log('Event', JSON.stringify(event));
  const bucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;
  const path = sourceKey.split('/');

  if (path[0] !== '_incoming') {
    return { statusCode: 200, body: '' };
  }
  if (!_.startsWith(event.Records[0].eventName, 'ObjectCreated:')) {
    throw Error(`Wrong event triggered. See: ${JSON.stringify(event)}`);
  }

  // 1) Read the mail from s3
  const data = await s3.getObject({ Bucket: bucket, Key: sourceKey }).promise()
    .catch((err) => {
      if (err.code === 'NotFound' || err.code === 'Forbidden') {
        throw createError(404, `Uploaded file ${sourceKey} was not found in s3`);
      }
      throw err;
    });

  // 2) Parse destination address from the file and check its existence in Dynamo
  const mail = await getRecipientFromEmail(data.Body, process.env.EMAIL_DOMAIN);
  const res = await dynamo.getItem({
    Key: {
      Project: { N: mail.project },
      Config: { S: mail.config },
    },
    TableName: process.env.DYNAMO_TABLE,
  }).promise();
  if (!_.has(res, 'Item.Email.S')) {
    throw createError(422, `Email ${mail.address} not valid`);
  }
  if (res.Item.Email.S !== mail.address) {
    throw createError(422, `Email ${mail.address} not valid`);
  }
  await moveFile(s3, bucket, sourceKey, `${mail.project}/${mail.config}/${getFileName(mail)}`)
    .catch((err) => {
      if (_.has(err, 'statusCode') && err.statusCode === 422) {
        return moveFile(s3, bucket, `_incoming/${path[1]}`, `_invalid/${getFileName(mail)}`);
      }
      throw err;
    });
  return { statusCode: 200, body: '' };
};

// eslint-disable-next-line
export const handler = middy(handlerFunction)
  .use(errorLogger());
