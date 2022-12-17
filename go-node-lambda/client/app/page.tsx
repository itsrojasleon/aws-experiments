'use client';
import React, { useEffect, useState } from 'react';
import { generatePresignedPostUrl } from '../utils';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files![0];

    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
    }
  };

  useEffect(() => {
    if (file) {
      (async () => {
        try {
          setLoading(true);

          const { url, fields } = await generatePresignedPostUrl();

          const formData = new FormData();

          Object.entries(fields).map(([key, value]) => {
            formData.append(key, value as string);
          });

          formData.append('file', file);

          await fetch(url, { method: 'POST', body: formData });

          setLoading(false);
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        }
      })();
    }
  }, [file]);

  return (
    <div>
      <label className="relative overflow-hidden cursor-pointer bg-blue-500 hover:bg-blue-600 focus:outline-none focus:shadow-outline-blue active:bg-blue-800 text-white font-bold py-2 px-4 rounded-full">
        <span className="text-lg font-bold uppercase">Select a file</span>
        <input type="file" className="hidden" onChange={handleChange} />
      </label>
      {loading && <h2 className="mt-2 text-gray-600">Uploading...</h2>}
      {error && <h2 className="mt-2 text-red-600">{JSON.stringify(error)}</h2>}
    </div>
  );
};

export default Home;
