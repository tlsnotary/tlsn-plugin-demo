import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
export default function Body(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pluginID, setPluginID] = useState('');


  let client: any;

  useEffect(() => {
    const checkExtension = () => {
      //@ts-ignore
      if (typeof window.tlsn !== 'undefined') {
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

  async function handleConnect() {
    try {
      //@ts-ignore
      client = await window.tlsn.connect();
    } catch (error) {
      console.log(error);
    }
  }

  async function handlePluginInstall() {
    try {
      const plugin = await client.installPlugin('https://github.com/tlsnotary/tlsn-extension/raw/main/src/assets/plugins/twitter_profile.wasm', { id: 'twitter-plugin' });
      setPluginID(plugin);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="flex flex-row justify-center gap-3">
      {extensionInstalled ? (
        <div>
          <button onClick={handleConnect} className="button">
            TLSN Connect
          </button>
          <button onClick={handlePluginInstall} className="button">
            Install Plugin
          </button>
        </div>
      ) : (
        <a
          href="https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph"
          target="_blank"
          className="button"
        >
          Install TLSN Extension
        </a>
      )}
    </div>
  );
}
