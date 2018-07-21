import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CurrencyConverter from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<CurrencyConverter />, document.getElementById('container'));
registerServiceWorker();
