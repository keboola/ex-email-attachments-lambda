<?php
declare(strict_types=1);

namespace Keboola\ExEmailAttachmentsLambda;

class Email
{
    static function getRecipientFromEmail(string $rawEmail, string $domain): array
    {
        $parser = new \PhpMimeMailParser\Parser();
        $parser->setText($rawEmail);

        $recipients = array_merge(
            $parser->getAddresses('to'),
            $parser->getAddresses('cc'),
            $parser->getAddresses('bcc')
        );

        $result = false;
        foreach ($recipients as $recipient) {
            if (substr($recipient['address'], -strlen($domain)) === $domain) {
                $addressParts = explode('-', $recipient['address']);
                if (count($addressParts) >= 3) {
                    $result = [
                        'address' => $recipient['address'],
                        'project' => $addressParts[0],
                        'config' => $addressParts[1],
                    ];
                }
            }
        }
        if (!$result) {
            throw new UserException('Invalid email recipients: ' . json_encode($recipients));
        }
        return $result;
    }
}
