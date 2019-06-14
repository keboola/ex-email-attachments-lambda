<?php
declare(strict_types=1);

use Aws\DynamoDb\DynamoDbClient;
use Aws\S3\S3Client;
use Keboola\ExEmailAttachmentsLambda\Handler;
use Keboola\ExEmailAttachmentsLambda\UserException;

require __DIR__.'/vendor/autoload.php';

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (0 === error_reporting()) {
        return false;
    }
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

function handler(array $event): array
{
    print_r(json_encode($event));
    try {
        $s3 = new S3Client(['region' => getenv('REGION')]);
        $dynamo = new DynamoDbClient(['region' => getenv('REGION')]);

        $handler = new Handler($s3, $dynamo);
        $handler->run($event);
    } catch (UserException $e) {
        echo $e->getMessage().PHP_EOL;
    } catch (\Exception $e) {
        echo "{$e->getMessage()}\n{$e->getTraceAsString()}\n";
        throw $e;
    }
    return [];
}
