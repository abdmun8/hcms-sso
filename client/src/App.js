import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';

function handleLogin(instance) {
  instance
    .loginRedirect({
      scopes: ['email'],
    })
    .then((result) => {
      console.log({ result });
      fetch('http://localhost:5001/me', {
        headers: {
          'Content-Type': 'Application/json',
        },
        body: {
          idToken: result.idToken,
        },
      })
        .then((res) => res.json())
        .then((res) => console.log({ res }))
        .catch((err) => console.log({ err }));
      // return post('signIn', {jwt: result.idToken})
    })
    .catch((err) => {
      console.log(err.errName, err.errType);
    });
}

function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState({});
  console.log({ isAuthenticated, accounts });
  return (
    <div className="App">
      <header className="App-header">
        {isAuthenticated ? (
          <h5>Selamat datang </h5>
        ) : (
          <>
            <h5>Silahkan Login</h5>
            <button
              style={{ padding: 5 }}
              onClick={() => handleLogin(instance)}
            >
              Login
            </button>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
