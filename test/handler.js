'use strict';

const _ = require('lodash');
const expect = require('unexpected');
const handler = require('../src/handler');
const fs = require('fs');
const aws = require('aws-sdk');
const Promise = require('bluebird');
const uniqid = require('uniqid');

aws.config.setPromisesDependency(Promise);

const s3 = new aws.S3({
  s3ForcePathStyle: true,
  endpoint: new aws.Endpoint(process.env.S3_ENDPOINT),
  sslEnabled: false,
});
handler.setS3(s3);

const dynamo = new aws.DynamoDB({
  region: process.env.REGION,
  endpoint: process.env.DYNAMO_ENDPOINT,
});
handler.setDynamo(dynamo);

describe('Handler', () => {
  before(() => dynamo.deleteTable({ TableName: process.env.DYNAMO_TABLE }).promise()
    .catch(() => null)
    .then(() => dynamo.createTable({
    TableName: process.env.DYNAMO_TABLE,
    AttributeDefinitions: [
      { AttributeName: "Project", AttributeType: "N" },
      { AttributeName: "Config", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "Project", KeyType: "HASH" },
      { AttributeName: "Config", KeyType: "RANGE" }
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  }).promise())
    .then(() => s3.createBucket({ Bucket: process.env.S3_BUCKET }).promise()));

  const incomingFile = `test_${Math.random()}`;
  const incomingKey = `_incoming/${incomingFile}`;
  const projectId = _.random(1, 128);
  const config = uniqid();
  const email = `${projectId}-${config}-1234@import.test.keboola.com`;
  const file = _.replace(fs.readFileSync(`${__dirname}/email`), '{{EMAIL}}', email);

  it('Handle', () =>
    dynamo.putItem({
      Item: {
        Project: { N: `${projectId}` },
        Config: { S: config },
        Email: { S: email },
      },
      TableName: process.env.DYNAMO_TABLE,
    }).promise()
      .then(() => s3.putObject({
        Body: file,
        Bucket: process.env.S3_BUCKET,
        Key: incomingKey,
      }).promise())
      .then(() => handler.handler({
        Records: [
          {
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: {
                name: process.env.S3_BUCKET,
              },
              object: {
                key: incomingKey,
              },
            },
          },
        ],
      }, {}, () => expect(s3.headObject({ Bucket: process.env.S3_BUCKET, Key: incomingKey }).promise(), 'to be rejected')
        .then(() => s3.listObjects({ Bucket: process.env.S3_BUCKET, Prefix: `${projectId}/${config}/${email}` }).promise())
        .then((res) => {
          expect(res, 'to have key', 'Contents');
          expect(res.Contents, 'to have length', 1);
          return res.Contents[0].Key;
        })
        .then(key => s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: key }).promise())
        .then(() => dynamo.deleteItem({
          Key: {
            Project: { N: `${projectId}` },
            Config: { S: config },
          },
          TableName: process.env.DYNAMO_TABLE,
        }).promise())
      ))
  );
});
