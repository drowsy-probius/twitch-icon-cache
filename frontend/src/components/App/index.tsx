import React from 'react';
import './style.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from '../Header';
import Main from '../pages/Main';
import Dashboard from '../pages/Dashboard';

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <div className='App-header-container'>
          <Header />
        </div>

        <div className='App-main-container'>
          <Routes>
            <Route path='/' element={ <Main /> } />
            <Route path='/dashboard' element={ <Dashboard /> } />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
