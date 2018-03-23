'use strict';

const _ = require('lodash');
const { UserError, RequestHandler } = require('@keboola/serverless-request-handler');
const aws = require('aws-sdk');
const moment = require('moment');
const Promise = require('bluebird');
const emailLib = require('./lib/email');

aws.config.setPromisesDependency(Promise);
let s3 = new aws.S3({});
let dynamo = new aws.DynamoDB({ region: process.env.REGION });

module.exports.setS3 = client => s3 = client;
module.exports.setDynamo = client => dynamo = client;

module.exports.handler = (event, context, callback) => RequestHandler.handler(() => {
  if (!_.has(event, 'Records') || !event.Records.length ||
    !_.has(event.Records[0], 's3') || !_.has(event.Records[0].s3, 'bucket') ||
    !_.has(event.Records[0].s3, 'object') ||
    !_.has(event.Records[0].s3.bucket, 'name') ||
    !_.has(event.Records[0].s3.object, 'key')) {
    throw Error(`Event is missing. See: ${JSON.stringify(event)}`);
  }
  console.log('Event', JSON.stringify(event));
  const bucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;
  const path = sourceKey.split('/');

  if (path[0] !== '_incoming') {
    return callback();
  }
  if (!_.startsWith(event.Records[0].eventName, 'ObjectCreated:')) {
    throw Error(`Wrong event triggered. See: ${JSON.stringify(event)}`);
  }

  // 1) Read the mail from s3
  const promise = s3.getObject({ Bucket: bucket, Key: sourceKey }).promise()
    .catch((err) => {
      if (err.code === 'NotFound' || err.code === 'Forbidden') {
        throw UserError.notFound(`Uploaded file ${sourceKey} was not found in s3`);
      }
      throw err;
    })
    // 2) Parse destination address from the file and check its existence in Dynamo
    .then(data => emailLib.getRecipientFromEmail(data.Body, process.env.EMAIL_DOMAIN))
    .then(mail => dynamo.getItem({
      Key: {
        Project: { N: mail.project },
        Config: { S: mail.config },
      },
      TableName: process.env.DYNAMO_TABLE,
    }).promise()
      .then((res) => {
        if (!_.has(res, 'Item.Email.S')) {
          throw UserError.unprocessable(`Email ${mail.address} not valid`);
        }
        if (res.Item.Email.S !== mail.address) {
          throw UserError.unprocessable(`Email ${mail.address} not valid`);
        }
      })
      .then(() => moveFile(s3, bucket, sourceKey, `${mail.project}/${mail.config}/${getFileName(mail)}`))
      .catch((err) => {
        if (err instanceof UserError && err.code === 422) {
          return moveFile(s3, bucket, `_incoming/${path[1]}`, `_invalid/${getFileName(mail)}`);
        }
        throw err;
      }));

  return RequestHandler.responsePromise(promise, event, context, callback);
}, event, context, callback);

const getFileName = mail => `${mail.address}-${moment().toISOString()}`;

const moveFile = (s3, bucket, from, to) => {
  return s3.copyObject({
    CopySource: `${bucket}/${from}`,
    Bucket: bucket,
    Key: to,
  }).promise()
  .then(() => s3.deleteObject({ Bucket: bucket, Key: from }).promise());
};
