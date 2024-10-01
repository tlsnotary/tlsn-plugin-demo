import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import { useDispatch } from 'react-redux';
import './index.scss';

export default function Body(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);

  useEffect(() => {
    const checkExtension = () => {
      //@ts-ignore
      if (window.tlsn && window.tlsn.installed) {
        setExtensionInstalled(true);
      } else {
        return;
      }
    };

    window.onload = () => {
      checkExtension();
    };

    return () => {
      window.onload = null;
    };
  }, []);

  const installExtension = () => {
    const extensionUrl =
      'https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph';
    if (window.chrome && window.chrome.webstore) {
      window.chrome.webstore.install(
        extensionUrl,
        () => alert('Extension installed successfully!'),
        (err) => alert(`Error: ${err}`),
      );
    } else {
      window.open(extensionUrl, '_blank');
    }
  };

  async function handleConnect() {
    //@ts-ignore
    await window.tlsn.connect();
  }

  return (
    <div>
      {extensionInstalled ? (
        <button onClick={handleConnect} className="button">
          TLSN Connect
        </button>
      ) : (
        <button onClick={installExtension} className="button">
          Install TLSN Extension
        </button>
      )}
    </div>
  );
}
