import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { config } from './config';
import Dashboard from './components/Dashboard';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.userPoolId,
      userPoolClientId: config.userPoolClientId,
      loginWith: {
        email: true,
      },
    },
  },
});

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticator>
        {({ signOut, user }) => (
          <div>
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      AWS Knowledge Base
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      Welcome, {user?.signInDetails?.loginId}
                    </span>
                    <button
                      onClick={signOut}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </header>
            <main>
              <Dashboard />
            </main>
          </div>
        )}
      </Authenticator>
    </div>
  );
}

export default App;