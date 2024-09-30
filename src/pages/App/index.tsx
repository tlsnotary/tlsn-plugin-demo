import React, { ReactElement } from 'react';
import "./index.scss";
import { useDispatch } from 'react-redux';
import './index.scss';
import Header from '../../components/Header';

export default function App(): ReactElement {
  const dispatch = useDispatch();

  async function handleConnect() {
    //@ts-ignore
    await window.tlsn.connect();
  }

  return (
    <div className="app flex flex-col gap-4">
      <Header />
      <button onClick={handleConnect} className="button">
        TLSN Connect
      </button>
    </div>
  );
}
