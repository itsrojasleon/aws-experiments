# Queue DLQ Lambda

A single lambda has a main queue and a dead letter queue as event source.

Inside the lambda we can distinguish that the current message came from the main queue or the DLQ by looking at the `record.attributes.DeadLetterQueueSourceArn` property.

This is good is you only need to re-run the same process but giving more time to send sqs messages to the consumers (lambda in this case).

![Logs](https://github.com/rojasleon/aws-experiments/blob/main/queue-dlq-lambda/images/logs.png)
