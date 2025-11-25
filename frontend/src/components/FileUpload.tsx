import { useState } from 'react';
import axios from 'axios';
import { config } from '../config';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'text/plain'];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setMessage('');
      } else {
        setMessage('Please select a PDF or TXT file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      // Get presigned URL
      const response = await axios.post(`${config.apiUrl}/upload-url`, {
        filename: file.name,
        contentType: file.type,
      });

      const { uploadUrl } = response.data;

      // Upload file to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      setMessage('File uploaded successfully! Processing will begin shortly.');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700">
            Select File (PDF or TXT)
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>

        {message && (
          <div className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;