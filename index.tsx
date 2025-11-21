import React from 'react';
import { createRoot } from 'react-dom/client';
import RootLayout from './app/layout';
import Page from './app/page';
import './app/globals.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <RootLayout>
      <Page />
    </RootLayout>
  </React.StrictMode>
);
