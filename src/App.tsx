import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Play } from 'lucide-react';

const WEBHOOK_URL = 'https://cloud.lfgcloud.win/webhook/cef18d86-c73a-4f8e-969b-ae11cdc70fe8';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startingScenario, setStartingScenario] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setStatus({ type: null, message: '' });

    if (!file) {
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setStatus({
        type: 'error',
        message: 'Proszę wybrać plik w formacie CSV.'
      });
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setStatus({
        type: 'error',
        message: 'Rozmiar pliku przekracza maksymalny limit 10MB.'
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartScenario = async () => {
    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Proszę wybrać plik do przesłania.'
      });
      return;
    }

    setStartingScenario(true);
    setUploadProgress(0);
    setStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Błąd serwera: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Błąd połączenia sieciowego'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Przesyłanie zostało przerwane'));
        });

        xhr.open('POST', WEBHOOK_URL);
        xhr.send(formData);
      });

      await uploadPromise;

      setStatus({
        type: 'success',
        message: 'Scenariusz został pomyślnie uruchomiony!'
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd podczas uruchamiania scenariusza.'
      });
    } finally {
      setStartingScenario(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="h-32 w-auto object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Prześlij plik CSV z leadami i wystartuj scenariusz
            </h1>
            <div className="text-gray-600 text-sm space-y-1">
              <p>1. Wybierz plik CSV do przesłania (maksymalnie 10MB)</p>
              <p>2. Kliknij przycisk "Wystartuj scenariusz"</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={handleButtonClick}
                disabled={startingScenario}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                <p className="text-gray-700 font-medium mb-1">
                  Kliknij aby wybrać plik
                </p>
                <p className="text-gray-500 text-sm">
                  lub przeciągnij i upuść plik tutaj
                </p>
              </button>

              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {startingScenario && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Przesyłanie...</span>
                  <span className="text-green-600 font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {status.type && (
              <div
                className={`p-4 rounded-lg flex items-start space-x-3 ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{status.message}</p>
              </div>
            )}

            <button
              onClick={handleStartScenario}
              disabled={!selectedFile || startingScenario}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {startingScenario ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uruchamianie...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Wystartuj scenariusz</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Stworzone przez:{' '}
          <a
            href="https://procesflow.pl/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            Procesflow
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;
