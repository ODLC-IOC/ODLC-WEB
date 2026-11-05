import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../assets/css/styles.css';
import '../../assets/css/tarjeta.css';
import './app.css';
import Invitation from './Invitation.jsx';
import Booking from './Booking.jsx';
import Panel from './Panel.jsx';

function App() {
  const path = window.location.pathname;
  const inv = path.match(/^\/r\/([A-Za-z0-9_-]{22})\/?$/);
  if (inv) return <Invitation id={inv[1]} />;
  if (path.startsWith('/panel')) return <Panel />;
  return <Booking />;
}
createRoot(document.getElementById('root')).render(<App />);
