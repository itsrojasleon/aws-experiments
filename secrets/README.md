# Secrets

A quick example using Secrets Manage with CDK.

Here's what the lambda returns after being invoked.
What really matters is this part `"SecretString":"supersecret"`. There is it the value to use.

```shell
START RequestId: be3e6bdd-2cd9-4a60-80b7-7b930de1c017 Version: $LATEST
2022-12-01T17:48:35.303Z	be3e6bdd-2cd9-4a60-80b7-7b930de1c017	INFO	{"$metadata":{"httpStatusCode":200,"requestId":"7edfb31f-6e7d-4cd3-aa5e-464b9d4d70d4","attempts":1,"totalRetryDelay":0},"ARN":"arn:aws:secretsmanager:us-east-1:544305545848:secret:secret4DA88516-rsvWQU3CGzC8-g7xEsQ","CreatedDate":"2022-12-01T17:19:42.004Z","Name":"secret4DA88516-rsvWQU3CGzC8","SecretString":"supersecret","VersionId":"99f1eac6-983e-4211-ae9b-9b7a93e1ff5c","VersionStages":["AWSCURRENT"]}
END RequestId: be3e6bdd-2cd9-4a60-80b7-7b930de1c017
REPORT RequestId: be3e6bdd-2cd9-4a60-80b7-7b930de1c017	Duration: 571.72 ms	Billed Duration: 572 ms	Memory Size: 128 MB	Max Memory Used: 90 MB	Init Duration: 496.34 ms
```
