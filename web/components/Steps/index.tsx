import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Box from '@mui/material/Box';
import StepLabel from '@mui/material/StepLabel';
import classNames from 'classnames';
import Button from '../Button';
import ConfettiExplosion, { ConfettiProps } from 'react-confetti-explosion';

const steps = ['Connect Extension', 'Run Plugin'];

export default function Steps(): ReactElement {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [client, setClient] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
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
        window.location.origin + '/twitter_profile.tlsn.wasm',
      );
      setSessionId(_sessionId);
      console.log('Session ID:', _sessionId);

      const response = await fetch('/check-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: _sessionId }),
      });
      console.log('Check session response:', response);
      if (response.status === 200) {
        const data = await response.json();
        console.log('Response: Plugin data:', data);
        setScreenName(data.screen_name);
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
            Extension Connected{' '}
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
            {step === 1 && !sessionId && (
              <div className="flex flex-col items-center justify-center gap-2">
                <Button onClick={handleRunPlugin} loading={loading}>
                  Prove Twitter Screen Name
                </Button>
                <div>
                  What will happen when you click "Prove Twitter Screen Name"?
                  <ul className="flex flex-col items-center justify-center gap-1">
                    <li className="text-base font-light">
                      The TLSNotary extension will open a pop up, asking you permission to run the plugin and send the unredacted data (just the screen name in this case) to the verifier server.
                    </li>
                    <li className="text-base font-light">
                      If you accept, the extension will open X/Twitter in a new tab and will show a sidebar with steps to prove your Twitter screen name:
                      <ul className="flex flex-col items-center justify-center gap-1">
                        <li className="text-base font-light">
                          Step 1: go to your Twitter profile
                        </li>
                        <li className="text-base font-light">
                          Step 2: log in if you haven't yet
                        </li>
                        <li className="text-base font-light">
                          Step 3: the extensions proves your Twitter handle to the verifier server
                        </li>
                        <li className="text-base font-light">
                          When step 3 is running, you can close the Twitter/X tab, but don't close the sidebar.
                        </li>
                      </ul>
                    </li>
                    <li className="text-base font-light">
                      {process.env.POAP === 'true' ? (
                        <>
                          If successful, your screen name will be shown here and you can claim a POAP.
                        </>
                      ) : (
                        <>
                          If successful, your screen name will be shown here.
                        </>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            )}
            {step === 1 && sessionId && screenName && (
              <div className="flex flex-col items-center justify-center gap-2">
                <h3 className="text-lg font-semibold text-center">
                  🎉 Successfully verified your Twitter screen name <i>"{screenName}"</i> 🎉
                </h3>
                {process.env.POAP === 'true' && (
                  <>
                    <h3 className="text-lg font-semibold text-center">
                      Claim your POAP (Optional)
                    </h3>
                    <ClaimPoap sessionId={sessionId} screen_name={screenName} exploding={exploding} />
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <InstallExtensionPrompt />
      )}
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
  const handleRefresh = () => {
    window.location.reload();
  };

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
        {process.env.POAP === 'true' && (
          <p className="text-base font-light">
            The webserver will verify your proof and give a POAP in return (
            <span className="font-semibold">while supplies last</span>)
          </p>
        )}
      </div>
      <p className="font-bold">Please install the extension to proceed </p>
      <a
        href="https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph"
        target="_blank"
        className="button"
      >
        Install TLSN Extension
      </a>
      <p className="font-bold">
        You will need to refresh your browser after installing the extension
      </p>
      <a
        onClick={handleRefresh}
        className="button"
      >
        Refresh Page
      </a>

    </div>
  );
}
