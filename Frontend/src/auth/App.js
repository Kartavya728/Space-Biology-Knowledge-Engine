import React, { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import './App.css'; // Import the global stylesheet
import { AuthContextProvider } from './context/AuthContext';


export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);

  // This function will be passed to both components to let them switch views
  const handleSwitch = () => {
    setShowSignUp(!showSignUp);
  };

  return (
    <AuthContextProvider>
      <div className="auth-page">
        <div className="auth-card">
          {showSignUp ? (
            <SignUp onSwitch={handleSwitch} />
          ) : (
            <SignIn onSwitch={handleSwitch} />
          )}
        </div>
      </div>
    </AuthContextProvider>
  );
}