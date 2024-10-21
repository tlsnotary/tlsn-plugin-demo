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
import type { PresentationJSON } from 'tlsn-js/build/types';
import Button from '../Button';

const { init, Presentation }: any = Comlink.wrap(
  new Worker(new URL('../../../utils/worker.ts', import.meta.url)),
);

const steps = ['Connect Extension', 'Install Plugin', 'Run Plugin'];

export default function Steps(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pluginID, setPluginID] = useState('');
  const [step, setStep] = useState<number>(0);
  const [client, setClient] = useState<any>(null);
  const [pluginData, setPluginData] = useState<PresentationJSON | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkExtension = () => {
      //@ts-ignore
      if (typeof window.tlsn !== 'undefined') {
        setExtensionInstalled(true);
        setTimeout(async () => {
          // temporary fix until extension events added
          // @ts-ignore
          setClient(await window.tlsn.connect());
          setStep(1);
        }, 50);
      } else {
        return;
      }
    };

    window.onload = () => {
      checkExtension();
    };

    (async () => {
      await init({ loggingLevel: 'Info' });
    })();

    return () => {
      window.onload = null;
    };
  }, []);

  // useEffect(() => {
  //   const fetchPlugins = async () => {
  //     if (step === 1) {
  //       const plugins = await handleGetPlugins();
  //       console.log(plugins);
  //     }
  //   };

  //   fetchPlugins();
  //   return () => {};
  // }, [step]);


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
              <Button onClick={handleRunPlugin} loading={loading}>
                Run Plugin
              </Button>
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
          <DisplayPluginData step={step} pluginData={pluginData} />
        </>
      ) : (
        <div className='flex flex-col justify-center items-center gap-2'>
        <a
          href="https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph"
          target="_blank"
          className="button"
        >
          Install TLSN Extension
        </a>
        <p className='font-bold'>
          Please install the extension to proceed.{' '}
        </p>
        <p className='font-bold'>
        You will need to refresh your browser after installing the extension.
        </p>
        </div>
      )}
    </div>
  );
}

function DisplayPluginData({
  step,
  pluginData,
}: {
  step: number;
  pluginData: any;
}): ReactElement {
  const [transcript, setTranscript] = useState<any>(null);
  const [tab, setTab] = useState<'sent' | 'recv'>('sent');

  async function handleVerify() {
    try {
      const presentation = (await new Presentation(
        pluginData.data,
      )) as TPresentation;
      const proof = await presentation.verify();
      const transcript = new Transcript({
        sent: proof.transcript.sent,
        recv: proof.transcript.recv,
      });
      const verifiedData = {
        sent: transcript.sent(),
        recv: transcript.recv(),
      };
      setTranscript(verifiedData);
    } catch (error) {
      console.log(error);
    }
  }

  const formatDataPreview = (data: PresentationJSON) => {
    if (!data) return '';
    return Object.entries(data)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}: ${JSON.stringify(value, null, 2)}`;
        } else if (key === 'data') {
          const maxLength = 160;
          const previewData = value.toString().substring(0, maxLength);
          const formattedData = previewData.match(/.{1,20}/g)?.join('\n');
          return `${key}: ${formattedData}... ${value.length} more`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join('\n');
  };

  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      <div className="w-96">
        <div className="p-2 bg-gray-200 border-t rounded-t-md text-center text-lg font-semibold">
          Attestation
        </div>
        <div className="p-4 bg-gray-100 border rounded-b-md h-96 text-left overflow-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap text-[12px]">
            {formatDataPreview(pluginData)}
          </pre>
        </div>
      </div>
      <button disabled={step !== 3} onClick={handleVerify} className="button">
        Verify
      </button>
      <div className="w-96">
        <div className="p-2 bg-gray-200 border-t rounded-t-md text-center text-lg font-semibold">
          Presentation
        </div>
        <div className="bg-gray-100 border rounded-b-md h-96 overflow-auto">
          <div className="flex border-b">
            <button
              onClick={() => setTab('sent')}
              className={`p-2 w-1/2 text-center ${tab === 'sent' ? 'bg-slate-500 text-white' : 'bg-white text-black'}`}
            >
              Sent
            </button>
            <button
              onClick={() => setTab('recv')}
              className={`p-2 w-1/2 text-center ${tab === 'recv' ? 'bg-slate-500 text-white' : 'bg-white text-black'}`}
            >
              Received
            </button>
          </div>
          <div className="p-4 text-left">
            <pre className="text-[10px] text-gray-700 whitespace-pre-wrap">
              {transcript &&
                (tab === 'sent' ? transcript.sent : transcript.recv)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
