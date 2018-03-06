# Lambda handler for Email attachments extractor

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Build Status](https://travis-ci.org/keboola/ex-email-attachments-lambda.svg)](https://travis-ci.org/keboola/ex-email-attachments-lambda)

Lambda handler for Email attachments extractor. See [keboola/ex-email-attachments](https://github.com/keboola/ex-email-attachments) for more details.

## Installation

1. Download git repository: `git clone git@github.com:keboola/ex-email-attachments-lambda.git`
2. Create a stack [cf-stack.json](https://github.com/keboola/ex-email-attachments-lambda/blob/master/cf-stack.json) with IAM policies and user groups for deployment and functional testing. You will need to fill parameters:
    - `ServiceName` - should be the same as `SERVICE_NAME` env var (e.g. `dev-ex-email-attachments-lambda`), and should be unique across all instances
    - `Stage` - one of: `dev`, `test`, `prod` (again, should be the same as `STAGE` env var)
    - `DynamoTable` - name of the DynamoDB table created by the extractor
    - `S3Bucket` - name of the S3 bucket created by the extractor
3. Create an IAM user for deployment (e.g. `dev-ex-email-attachments-lambda-deploy`) and assign it to the group created in previous step. Create AWS credentials.
4. Create an IAM user for testing (e.g. `dev-ex-email-attachments-lambda-testing`) and assign it to the group created in previous step. Create AWS credentials.
5. Create `.env` file from template [.env.template](https://github.com/keboola/ex-email-attachments-lambda/blob/master/.env.template)
6. Run `docker-compose run --rm dev-deploy`

### CI and deployment

CI is configured on Travis, see https://travis-ci.org/keboola/ex-email-attachments-lambda. Deployment is run automatically after releasing a version on GitHub.
