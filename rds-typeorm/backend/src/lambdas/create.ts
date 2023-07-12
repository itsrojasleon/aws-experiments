import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DataSource } from 'typeorm';
import { User } from '../models/user';

const secrets = new SecretsManagerClient({});

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    if (!process.env.DB_NAME) throw new Error('DB_NAME is not set');
    if (!process.env.DB_HOST) throw new Error('DB_HOST is not set');
    if (!process.env.DB_SECRET_ARN) throw new Error('DB_SECRET_ARN is not set');

    const secretId = process.env.DB_SECRET_ARN.split(':')[6];

    const { SecretString } = await secrets.send(
      new GetSecretValueCommand({
        SecretId: secretId
      })
    );

    if (!SecretString) throw new Error('SecretString is not set');

    let dbUsername = '';
    let dbPassword = '';

    try {
      const { username, password } = JSON.parse(SecretString);

      if (!username) throw new Error('username is not set in SecretString');
      if (!password) throw new Error('password is not set in SecretString');

      dbUsername = username;
      dbPassword = password;
    } catch (err) {
      throw new Error('SecretString is not a valid JSON');
    }

    const dataSource = new DataSource({
      type: 'postgres',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      username: dbUsername,
      password: dbPassword,
      port: 5432, // Maybe use as env var?
      ssl: true,
      entities: [User]
    });

    await dataSource.initialize();

    const user = await User.create({
      name: 'John Doe',
      isHuman: true
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User created successfully',
        user
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error'
      })
    };
  }
};
