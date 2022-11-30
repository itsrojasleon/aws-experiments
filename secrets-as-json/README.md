# Secrets as json

This example will output the secret name that we can use later to get the secret values.

Here's an example using the aws cli.

```shell
aws secretsmanager get-secret-value --secret-id [name_or_arn] --query SecretString --output text
```
