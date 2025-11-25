import { useState } from 'react';
import FileUpload from './FileUpload';
import SearchInterface from './SearchInterface';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search Documents
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'upload' && <FileUpload />}
          {activeTab === 'search' && <SearchInterface />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;