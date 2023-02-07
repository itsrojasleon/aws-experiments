import { Stages } from './types';

export const validateNodeEnv = () => {
  if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV is not defined');
  }

  if (
    process.env.NODE_ENV !== Stages.Dev &&
    process.env.NODE_ENV !== Stages.Test &&
    process.env.NODE_ENV !== Stages.Prod
  ) {
    throw new Error(
      `NODE_ENV must be either '${Stages.Dev}', '${Stages.Test}' or '${Stages.Prod}'`
    );
  }
};

export const generateId = () => {
  return Math.random().toString(36).substring(2);
};
