'use client';
import React, { useEffect, useState } from 'react';

const generatePresignedPostUrl = async () => {
  const response = await fetch(
    'https://gg3cob7q40.execute-api.us-east-1.amazonaws.com/upload', // TODO: Hide.
    { method: 'POST' }
  );

  // TODO: Add types.
  const { url, fields } = await response.json();

  return { url, fields };
};

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files![0];

    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
    }

    // If not, maybe show an error message.
  };

  useEffect(() => {
    if (file) {
      const upload = async () => {
        setLoading(true);

        const { url, fields } = await generatePresignedPostUrl();

        const formData = new FormData();

        Object.entries(fields).map(([key, value]) => {
          formData.append(key, value as string);
        });

        formData.append('file', file);

        await fetch(url, {
          method: 'POST',
          body: formData
        });

        setLoading(false);
      };

      upload();
    }
  }, [file]);

  return (
    <div>
      <label className="relative overflow-hidden cursor-pointer bg-blue-500 hover:bg-blue-600 focus:outline-none focus:shadow-outline-blue active:bg-blue-800 text-white font-bold py-2 px-4 rounded-full">
        <span className="text-lg font-bold uppercase">Select a file</span>
        <input type="file" className="hidden" onChange={handleChange} />
      </label>
      {loading && <h2 className="mt-2 text-gray-600">Uploading...</h2>}
    </div>
  );
};

export default Home;
