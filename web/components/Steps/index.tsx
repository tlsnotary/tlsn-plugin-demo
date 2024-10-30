import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Box from '@mui/material/Box';
import StepLabel from '@mui/material/StepLabel';
import classNames from 'classnames';
import type { PresentationJSON } from 'tlsn-js/build/types';
import Button from '../Button';
import ConfettiExplosion, { ConfettiProps } from 'react-confetti-explosion';

const steps = [
  'Connect Extension',
  'Install Plugin',
  'Run Plugin',
  'Verify Attestation',
  '🎉 Claim POAP 🎉',
];

export default function Steps(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pluginID, setPluginID] = useState('');
  const [step, setStep] = useState<number>(0);
  const [client, setClient] = useState<any>(null);
  const [pluginData, setPluginData] = useState<PresentationJSON | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<any>(null);
  const [screenName, setScreenName] = useState<string>('');
  const [exploding, setExploding] = useState<boolean>(false);

  useEffect(() => {
    const checkExtension = () => {
      //@ts-ignore
      if (typeof window.tlsn !== 'undefined') {
        setExtensionInstalled(true);
      } else {
        return;
      }
    };
    const handleTLSNLoaded = async () => {
      //@ts-ignore
      setClient(await window.tlsn.connect());
      setStep(1);
    };

    window.addEventListener('tlsn_loaded', handleTLSNLoaded);

    window.onload = checkExtension;

    (async () => {
      const { default: init } = await import('tlsn-js');
      await init();
    })();

    return () => {
      window.onload = null;
      window.removeEventListener('tlsn_loaded', handleTLSNLoaded);
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      const match = transcript.recv.match(/"screen_name":"([^"]+)"/);
      const screenName = match ? match[1] : null;
      setScreenName(screenName);
      setExploding(true);
    }
  }, [transcript]);

  async function handleConnect() {
    try {
      //@ts-ignore
      setClient(await window.tlsn.connect());
      setStep(1);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleGetPlugins() {
    try {
      const plugins = await client.getPlugins('**', '**', {
        id: 'twitter-plugin',
      });
      if (plugins.length > 0) {
        setPluginID(plugins[0].hash);
        setStep(2);
      }
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
    } catch (error: any) {
      console.log(error.message);
      if (error.message === 'Plugin already exist.') {
        try {
          await handleGetPlugins();
        } catch (error) {
          console.log(error);
        }
      }
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
          <div className="flex flex-row items-center gap-2 text-slate-600 font-bold pb-2">
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
          <Box className="w-full max-w-3xl mt-6 pb-4">
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          <div className="flex gap-3">
            {step === 0 && (
              <button onClick={handleConnect} className="button">
                Connect
              </button>
            )}
            {step === 1 && (
              <div className="flex flex-col gap-2">
                <button onClick={handlePluginInstall} className="button">
                  Install Plugin
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center gap-2">
                <Button onClick={handleRunPlugin} loading={loading}>
                  Run Plugin
                </Button>
                <span className="font-bold">
                  Please keep the sidebar open during the notarization process
                </span>
              </div>
            )}
            {step === 5 && (
              <>
                <ClaimPoap
                  screen_name={screenName}
                  exploding={exploding}
                  setStep={setStep}
                />
              </>
            )}
          </div>

          <DisplayPluginData
            step={step}
            pluginData={pluginData}
            transcript={transcript}
            setTranscript={setTranscript}
            setStep={setStep}
          />
        </>
      ) : (
        <div className="flex flex-col justify-center items-center gap-2">
          <div className="flex flex-col justify center items-center gap-2 pb-4">
            <h1 className="text-base font-light">
              Welcome to the TLSNotary Plugin Demo!
            </h1>
            <p className="text-base font-light">
              This demo shows how TLSNotary can be used to verify private user
              data in a webapp.
            </p>
            <p className="text-base font-light">
              In this demo you'll prove that you own a Twitter/X account to the
              webserver.
            </p>
            <p className="text-base font-light">
              The website will verify your attestation and give a POAP in return
              (<span className="font-semibold">while supplies last</span>)
            </p>
          </div>
          <p className="font-bold">Please install the extension to proceed </p>
          <p className="font-bold">
            You will need to refresh your browser after installing the extension
          </p>
          <a
            href="https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph"
            target="_blank"
            className="button"
          >
            Install TLSN Extension
          </a>
        </div>
      )}
    </div>
  );
}

function DisplayPluginData({
  step,
  pluginData,
  transcript,
  setTranscript,
  setStep,
}: {
  step: number;
  pluginData: any;
  transcript: any;
  setTranscript: any;
  setStep: any;
}): ReactElement {
  const [tab, setTab] = useState<'sent' | 'recv'>('sent');

  async function handleVerify() {
    try {
      const { Presentation, Transcript } = await import('tlsn-js');
      const presentation = await new Presentation(pluginData.data);
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
      setStep(5);
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

function ClaimPoap({
  screen_name,
  exploding,
  setStep,
}: {
  screen_name: string;
  exploding: boolean;
  setStep: any;
}): ReactElement {
  const [screenName, setScreenName] = useState('');
  const [poapLink, setPoapLink] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleClaimPoap = async () => {
      try {
        if (!screen_name) return;
        const response = await fetch('/poap-claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ screenName: screen_name }),
        });
        if (response.status === 200) {
          const data = await response.json();
          setPoapLink(data.poapLink);
        } else {
          setError(await response.text());
        }
      } catch (error) {
        console.log(error);
      }
    };

    handleClaimPoap();
  }, [screen_name]);

  const mediumProps: ConfettiProps = {
    force: 0.6,
    duration: 4000,
    particleCount: 150,
    width: 1500,
    colors: ['#F0FFF', '#F0F8FF', '#483D8B', '#E0FFF', '#778899'],
  };

  return (
    <div>
      {poapLink !== '' && (
        <a className="button" href={poapLink} target="_blank">
          Claim POAP!
        </a>
      )}
      {exploding && <ConfettiExplosion {...mediumProps} />}
    </div>
  );
}
