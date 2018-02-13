# Lambda handler for Pigeon

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Build Status](https://travis-ci.org/keboola/pigeon-lambda.svg)](https://travis-ci.org/keboola/pigeon-lambda)

Lambda handler for Pigeon Extractor. See [keboola/pigeon](https://github.com/keboola/pigeon) for more details.

## Installation

1. Download git repository: `git clone git@github.com:keboola/pigeon-lambda.git`
2. Create a stack [cf-template.json](https://github.com/keboola/pigeon-lambda/blob/master/cf-template.json) with IAM policies and user groups for deployment and functional testing. You will need to fill parameters:
    - `ServiceName` - should be the same as `SERVICE_NAME` env var (e.g. `dev-pigeon-lambda`)
    - `KeboolaStack` - should be the same as `KEBOOLA_STACK` env var (e.g. `dev-pigeon`)
    - `Stage` - one of: `dev`, `test`, `prod` (again, should be the same as `STAGE` env var)
    - `DynamoTable` - name of the DynamoDB table created by the extractor
    - `S3Bucket` - name of the S3 bucket created by the extractor
3. Create an IAM user for deployment (e.g. `dev-pigeon-lambda-deploy`) and assign it to the group created in previous step. Create AWS credentials.
4. Create an IAM user for testing (e.g. `dev-pigeon-lambda-testing`) and assign it to the group created in previous step. Create AWS credentials.
5. Create `.env` file from template [.env.template](https://github.com/keboola/pigeon-lambda/blob/master/.env.template)
6. Run `docker-compose run --rm dev-deploy`

### CI and deployment

CI is configured on Travis, see https://travis-ci.org/keboola/pigeon-lambda. Deployment is run automatically after releasing a version on GitHub.
