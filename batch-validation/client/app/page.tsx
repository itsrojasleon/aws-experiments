'use client';
import { useEffect, useReducer } from 'react';

enum ActionType {
  SET_FILE = 'set_file',
  SET_DOWNLOADABLE_URL = 'set_downloadable_url',
  SET_ID = 'set_id',
  SET_ERROR = 'set_error',
  SET_LOADING = 'set_loading'
}

interface State {
  downloadableUrl: string;
  id: string;
  loading: boolean;
  file: File | null;
  error: string;
}

type Action =
  | { type: ActionType.SET_FILE; payload: File }
  | { type: ActionType.SET_DOWNLOADABLE_URL; payload: string }
  | { type: ActionType.SET_ID; payload: string }
  | { type: ActionType.SET_ERROR; payload: string }
  | { type: ActionType.SET_LOADING; payload: boolean };

const initialState: State = {
  file: null,
  downloadableUrl: '',
  id: '',
  loading: false,
  error: ''
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.SET_FILE:
      return { ...state, file: action.payload };
    case ActionType.SET_DOWNLOADABLE_URL:
      return { ...state, downloadableUrl: action.payload };
    case ActionType.SET_ID:
      return { ...state, id: action.payload };
    case ActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionType.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const Home = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.file) {
      const upload = async () => {
        dispatch({ type: ActionType.SET_LOADING, payload: true });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/upload`,
          { method: 'POST' }
        );
        const data: {
          id: string;
          url: string;
          fields: { [k: string]: string };
        } = await response.json();

        dispatch({ type: ActionType.SET_ID, payload: data.id });

        const formData = new FormData();

        Object.entries(data.fields).map(([key, value]) => {
          formData.append(key, value as string);
        });

        formData.append('file', state.file!);

        await fetch(data.url, { method: 'POST', body: formData });

        dispatch({ type: ActionType.SET_LOADING, payload: false });
      };

      upload();
    }
  }, [state.file]);

  return (
    <div className="ml-5 mt-5">
      {!state.file && (
        <label className="relative overflow-hidden cursor-pointer bg-blue-600 hover:bg-blue-700 focus:outline-none focus:shadow-outline-blue active:bg-blue-800 font-bold py-3 px-5 rounded-full text-white">
          <span className="font-bold uppercase">Select a CSV file</span>
          <input
            className="hidden"
            type="file"
            onChange={(event) => {
              const selectedFile = event.target.files![0];

              if (selectedFile && selectedFile.type === 'text/csv') {
                dispatch({
                  type: ActionType.SET_FILE,
                  payload: selectedFile
                });
              }
            }}
          />
        </label>
      )}

      {state.file && !state.loading && (
        <div>
          <button
            onClick={async () => {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_API_URL}/download/${state.id}`
              );

              const { url } = await response.json();

              dispatch({ type: ActionType.SET_DOWNLOADABLE_URL, payload: url });
            }}
            className="bg-red-500 hover:bg-red-700 font-bold py-1 px-2 rounded-full text-white"
          >
            Get url to download file
          </button>
          {state.downloadableUrl && <input value={state.downloadableUrl} />}
        </div>
      )}

      <div className="mt-10">
        {state.loading && <h2>Loading...</h2>}
        {state.error && <h2>Error: {state.error}</h2>}
      </div>
    </div>
  );
};

export default Home;
