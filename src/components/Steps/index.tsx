import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Box from '@mui/material/Box';
import StepLabel from '@mui/material/StepLabel';
import classNames from 'classnames';
import Icon from '../Icon';
import * as Comlink from 'comlink';
import { Presentation as TPresentation, Transcript } from 'tlsn-js';

const { init, Presentation }: any = Comlink.wrap(
  new Worker(new URL('../../../utils/worker.ts', import.meta.url)),
);

const steps = ['Connect Extension', 'Install Plugin', 'Run Plugin'];

export default function Steps(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pluginID, setPluginID] = useState('');
  const [step, setStep] = useState<number>(0);
  const [client, setClient] = useState<any>(null);
  const [pluginData, setPluginData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

    (async () => {
      await init({ loggingLevel: 'Info'});
    })();

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

  async function handleGetHistory() {
    try {
      const history = await client.getHistory(
        'GET',
        'https://api.x.com/1.1/account/settings.json',
      );
      console.log(history);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleGetPlugins() {
    try {
      const plugins = await client.getPlugins('**', '**', {
        id: 'twitter-plugin',
      });
      console.log(plugins);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleVerify() {
    try {
      const presentation = (await new Presentation(pluginData.data)) as TPresentation;
      const proof = await presentation.verify();
      const transcript = new Transcript({
        sent: proof.transcript.sent,
        recv: proof.transcript.recv,
      })
      const vk = await presentation.verifyingKey();
      console.log(transcript.sent(), transcript.recv(), vk);
    } catch (error) {
      console.log(error);
    }
  }

  async function handlePluginInstall() {
    try {
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
      setLoading(true);
      const pluginData = await client.runPlugin(pluginID);
      console.log(pluginData);
      setLoading(false);
      setPluginData(pluginData);
      setStep(3);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button onClick={handleVerify} className='button'>Verify</button>
      {extensionInstalled ? (
        <>
          <div className="flex flex-row items-center gap-2 text-slate-600 font-bold pb-8">
            Connected{' '}
            <div
              className={classNames(
                'rounded-full h-[10px] w-[10px] border-[2px]',
                {
                  'bg-green-500': step >= 1,
                  'bg-red-500': step === 0,
                },
              )}
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
            {step === 2 && (
              <button
                onClick={handleRunPlugin}
                disabled={loading}
                className="button"
              >
                {loading ? (
                  <Icon
                    className="animate-spin"
                    fa="fa-solid fa-spinner"
                    size={2}
                  />
                ) : (
                  'Run Plugin'
                )}
              </button>
            )}
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
          className="button"
        >
          Install TLSN Extension
        </a>
      )}
    </div>
  );
}
