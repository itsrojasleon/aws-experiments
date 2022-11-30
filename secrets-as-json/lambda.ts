import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';

const secrets = new SecretsManagerClient({});

export const handler = async () => {
  const secret = await secrets.send(
    new GetSecretValueCommand({
      SecretId: process.env.SECRET_ID
    })
  );

  console.log(JSON.stringify(secret)); // Will print 'supersecret'.
};
