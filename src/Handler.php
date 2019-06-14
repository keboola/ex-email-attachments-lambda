<?php
declare(strict_types=1);

namespace Keboola\ExEmailAttachmentsLambda;

use Aws\DynamoDb\DynamoDbClient;
use Aws\S3\S3Client;

class Handler
{
    /** @var S3Client  */
    protected $s3;
    /** @var DynamoDbClient  */
    protected $dynamo;

    public function __construct(S3Client $s3, DynamoDbClient $dynamo)
    {
        $this->s3 = $s3;
        $this->dynamo = $dynamo;
    }

    public function run(array $event): void
    {
        if (empty($event['Records'][0]['s3']['bucket']) || empty($event['Records'][0]['s3']['bucket']['name'])
            || empty($event['Records'][0]['s3']['object']['key'])) {
            throw new \Exception('Event is missing. See: ' . json_encode($event));
        }
        echo json_encode($event).PHP_EOL;

        $bucket = $event['Records'][0]['s3']['bucket']['name'];
        $sourceKey = $event['Records'][0]['s3']['object']['key'];
        $path = explode('/', $sourceKey);

        if ($path[0] !== '_incoming') {
            return;
        }
        if (substr($event['Records'][0]['eventName'], 0, 14) !== 'ObjectCreated:') {
            throw new \Exception('Wrong event triggered. See: ' . json_encode($event));
        }

        $file = $this->s3->getObject([ 'Bucket' => $bucket, 'Key' => $sourceKey ]);

        $email = Email::getRecipientFromEmail((string) $file, getenv('EMAIL_DOMAIN'));

        $dbEmail = $this->dynamo->getItem([
            'Key' => [
                'Project' => ['N' => $email['project']],
                'Config' => [ 'S' => $email['config']],
            ],
            'TableName' => getenv('DYNAMO_TABLE'),
        ]);

        $newFileName = $email['address']. '-' . date('c');
        if (empty($dbEmail['Item']['Email']['S']) || $dbEmail['Item']['Email']['S'] !== $email['address']) {
            $this->moveFile($bucket, "{$bucket}/{$path[1]}", "_invalid/{$newFileName}");
            throw new UserException("Email {$email['address']} not valid");
        }

        $this->moveFile(
            $bucket,
            "{$bucket}/{$sourceKey}",
            "{$email['project']}/{$email['config']}/{$newFileName}"
        );
    }

    protected function moveFile(string $bucket, string $from, string $to): void
    {
        $this->s3->copyObject([
            'CopySource' => "{$bucket}/{$from}",
            'Bucket' => $bucket,
            'Key' => $to,
        ]);
        $this->s3->deleteObject([
            'Bucket' => $bucket,
            'Key' => "{$bucket}/{$from}",
        ]);
    }
}
