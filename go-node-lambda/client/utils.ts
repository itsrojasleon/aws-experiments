export const generatePresignedPostUrl = async () => {
  if (!process.env.NEXT_PUBLIC_PRESIGNED_POST_URL) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_PRESIGNED_POST_URL'
    );
  }

  const response = await fetch(process.env.NEXT_PUBLIC_PRESIGNED_POST_URL, {
    method: 'POST'
  });

  const { url, fields }: { url: string; fields: { [k: string]: string } } =
    await response.json();

  return { url, fields };
};
