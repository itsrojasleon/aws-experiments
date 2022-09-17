export const validateEnvVars = (vars: string[]) => {
  vars.map((v) => {
    if (!process.env[v]) {
      throw new Error(`${v} must be defined`);
    }
  });
};
