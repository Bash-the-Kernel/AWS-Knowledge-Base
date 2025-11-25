import { useState } from 'react';
import axios from 'axios';
import { config } from '../config';

interface SearchResult {
  documentId: string;
  filename: string;
  userId: string;
  score: number;
  highlight: string;
}

const SearchInterface = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const response = await axios.post(`${config.apiUrl}/search`, {
        query: query.trim(),
      });

      setResults(response.data.results);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Search Documents</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700">
            Search Query
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search terms..."
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {total > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-4">
            Found {total} result{total !== 1 ? 's' : ''}
          </p>
          
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.documentId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {result.filename}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Score: {result.score.toFixed(2)}
                  </span>
                </div>
                
                {result.highlight && (
                  <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                    <span dangerouslySetInnerHTML={{ __html: result.highlight }} />
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  Document ID: {result.documentId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && query && !searching && (
        <div className="mt-6 text-center text-gray-500">
          No documents found matching your search.
        </div>
      )}
    </div>
  );
};

export default SearchInterface;