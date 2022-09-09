import { APIGatewayProxyHandler } from "aws-lambda";
import { readdir, writeFile } from "fs/promises";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const filename = (Math.random() + 1).toString(36).substring(7);

    for (let i = 0; i < 10; i++) {
      await writeFile(`/tmp/${filename}.txt`, "random text", "utf-8");
    }

    const dirs = await readdir("/tmp");

    return {
      statusCode: 201,
      body: JSON.stringify({ count: dirs.length }),
    };
  } catch (error) {
    return {
      statusCode: 201,
      body: JSON.stringify({ error }),
    };
  }
};
