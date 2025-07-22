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
import { formatDataPreview } from '../../utils/utils';

const steps = ['Connect Extension', 'Run Plugin'];

export default function Steps(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [client, setClient] = useState<any>(null);
  const [pluginData, setPluginData] = useState<PresentationJSON | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<any>(null);
  const [screenName, setScreenName] = useState<string>('');
  const [exploding, setExploding] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window._paq) {
      window._paq.push(['trackEvent', 'Demo', 'Step', steps[step]]);
    }
  }, [step]);

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
      if (screenName) {
        setExploding(true);
      }
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

  async function handleRunPlugin() {
    try {
      setLoading(true);
      const _sessionId = await client.runPlugin(
        'http://localhost:60990' + '/twitter_profile.tlsn.wasm',
      );
      setSessionId(_sessionId);
      const response = await fetch('/verify-attestation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: _sessionId }),
      });
      if (response.status === 200) {
        const data = await response.json();
        setTranscript(data.presentationObj);
        setStep(1);
      } else {
        console.log(await response.text());
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
            {step === 1 && !pluginData && !sessionId && (
              <div className="flex flex-col items-center justify-center gap-2">
                <ul className="flex flex-col items-center justify-center gap-1">
                  <li className="text-base font-light">
                    This will open a new tab to Twitter/X and the sidebar for
                    the extension
                  </li>
                  <li className="text-base font-light">
                    Click through the steps in the sidebar
                  </li>
                  <li className="text-base font-light">
                    Don't close the sidebar or refresh the page until
                    notarization is finished
                  </li>
                  <li className="text-base font-light">
                    If successful, the attestation and verified data will be
                    displayed below
                  </li>
                </ul>
                <Button onClick={handleRunPlugin} loading={loading}>
                  Run Plugin
                </Button>
              </div>
            )}
            {step === 1 && pluginData && screenName && (
              <div className="flex flex-col items-center justify-center gap-2">
                <h3 className="text-lg font-semibold text-center">
                  Optional: Claim Your POAP
                </h3>
                <ClaimPoap screen_name={screenName} exploding={exploding} />
              </div>
            )}
            {step === 1 && sessionId && (
              <div className="flex flex-col items-center justify-center gap-2">
                <h3 className="text-lg font-semibold text-center">
                  Optional: Claim Your POAP
                </h3>
                <ClaimPoap sessionId={sessionId} exploding={exploding} />
              </div>
            )}
          </div>
          {pluginData && (
            <DisplayPluginData
              step={step}
              pluginData={pluginData}
              transcript={transcript}
            />
          )}
        </>
      ) : (
        <InstallExtensionPrompt />
      )}
    </div>
  );
}

function DisplayPluginData({
  step,
  pluginData,
  transcript,
}: {
  step: number;
  pluginData: any;
  transcript: any;
}): ReactElement {
  const [tab, setTab] = useState<'sent' | 'recv'>('sent');

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
  sessionId,
}: {
  screen_name?: string;
  exploding: boolean;
  sessionId?: string;
}): ReactElement {
  const [poapLink, setPoapLink] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleClaimPoap = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!screen_name && !sessionId) return;
      const response = await fetch('/poap-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ screenName: screen_name, sessionId }),
      });
      if (response.status === 200) {
        const data = await response.json();
        setPoapLink(data.poapLink);
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to claim POAP');
      }
    } catch (error) {
      console.error('Error claiming POAP:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const mediumProps: ConfettiProps = {
    force: 0.6,
    duration: 4000,
    particleCount: 150,
    width: 1500,
    colors: ['#F0FFF', '#F0F8FF', '#483D8B', '#E0FFF', '#778899'],
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {!poapLink && !error && (
        <Button onClick={handleClaimPoap} loading={loading}>
          Claim POAP!
        </Button>
      )}
      {poapLink && (
        <a className="button" href={poapLink} target="_blank">
          View Your POAP!
        </a>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
      {exploding && poapLink && <ConfettiExplosion {...mediumProps} />}
    </div>
  );
}

function InstallExtensionPrompt() {
  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex flex-col justify center items-center gap-2 pb-4">
        <h1 className="text-base font-light">
          Welcome to the TLSNotary Plugin Demo!
        </h1>
        <p className="text-base font-light">
          This demo shows how TLSNotary can be used to verify private user data
          in a webapp.
        </p>
        <p className="text-base font-light">
          In this demo you'll prove that you own a Twitter/X account to the
          webserver.
        </p>
        <p className="text-base font-light">
          The webserver will verify your attestation and give a POAP in return (
          <span className="font-semibold">while supplies last</span>)
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
  );
}
