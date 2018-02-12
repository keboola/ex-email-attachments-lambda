# Lambda handler for Pigeon

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Build Status](https://travis-ci.org/keboola/pigeon-lambda.svg)](https://travis-ci.org/keboola/pigeon-lambda)

Lambda handler for Pigeon Extractor. See [keboola/pigeon](https://github.com/keboola/pigeon) for more details.

## Installation

1. Download git repository: `git clone git@github.com:keboola/pigeon-lambda.git`
2. Create AWS user for deployment
    1. Create a stack [cf-deploy-policy.json](https://github.com/keboola/pigeon-lambda/blob/master/cf-deploy-policy.json) with permissions policy and user group and choose `SERVICE_NAME` parameter (e.g. `dev-pigeon-lambda`)
    2. Create an IAM user (e.g. `dev-pigeon-lambda-deploy`) and assign it to the group created in previous step. Create AWS credentials.
3. Create `.env` file from template [.env.template](https://github.com/keboola/pigeon-lambda/blob/master/.env.template)
4. Run `docker-compose run --rm dev-deploy`

### CI and deployment

CI is configured on Travis, see https://travis-ci.org/keboola/pigeon-lambda. Deployment is run automatically after releasing a version on GitHub.
