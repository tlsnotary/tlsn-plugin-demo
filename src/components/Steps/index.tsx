import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Box from '@mui/material/Box';
import StepLabel from '@mui/material/StepLabel';
import classNames from 'classnames';

const steps = ['Connect Extension', 'Install Plugin', 'Run Plugin'];

export default function Steps(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pluginID, setPluginID] = useState('');
  const [step, setStep] = useState<number>(0);
  const [client, setClient] = useState<any>(null);

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
      setClient(await window.tlsn.connect());
      setStep(1);
    } catch (error) {
      console.log(error);
    }
  }

  async function handlePluginInstall() {
    try {
      console.log(client);
      const plugin = await client.installPlugin(
        'https://github.com/tlsnotary/tlsn-extension/raw/main/src/assets/plugins/twitter_profile.wasm',
        { id: 'twitter-plugin' },
      );
      setPluginID(plugin);
      setStep(2);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleRunPlugin() {
    try {
      const pluginData = await client.runPlugin(pluginID);
    } catch (error) {
      console.log(error);
    }
  }


  return (
    <div className="flex flex-col items-center gap-4">
      {extensionInstalled ? (
        <>
          <div className="flex flex-row items-center gap-2 text-slate-600 font-bold pb-8">
            Connected{' '}
            <div
              className={classNames('rounded-full h-[10px] w-[10px] border-[2px]', {
                'bg-green-500': step >= 1,
                'bg-red-500': step === 0,
              })}
            ></div>
          </div>
          <div className="flex gap-3">
            {step === 0 && (
              <button onClick={handleConnect} className="button">
                Connect
              </button>
            )}
            {step === 1 && (
              <button onClick={handlePluginInstall} className="button">
                Install Plugin
              </button>
            )}
            {step === 2 && <button onClick={handleRunPlugin} className="button">Run Plugin</button>}
          </div>
          <Box className="w-full max-w-md mt-6">
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </>
      ) : (
        <a
          href="https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph"
          target="_blank"
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Install TLSN Extension
        </a>
      )}
    </div>
  );
}
