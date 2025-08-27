import React, { ReactElement, useEffect, useState } from 'react';
import './index.scss';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Box from '@mui/material/Box';
import StepLabel from '@mui/material/StepLabel';
import classNames from 'classnames';
import Button from '../Button';
import ConfettiExplosion, { ConfettiProps } from 'react-confetti-explosion';
import OverviewSvg from '../../../static/overview_prover_verifier.svg';

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
              <div className="flex flex-col items-center justify-center gap-6 max-w-4xl">
                <div className="text-center space-y-4 w-full flex flex-col items-center">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Ready to Prove Your Twitter Identity
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Click the button below to start the verification process
                  </p>

                  <Button
                    onClick={handleRunPlugin}
                    loading={loading}
                    className="bg-blue-600 hover:bg-blue-700 !text-white px-12 py-4 text-xl font-semibold min-w-[300px] shadow-lg rounded-lg transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        🔐 Prove Twitter Handle
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full">

                  <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">
                    What happens when you click "Prove Twitter Handle"?
                  </h3>

                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-base leading-relaxed">
                        The TLSNotary extension will open a popup, asking permission to run the plugin and send the unredacted data (just the handle) to the verifier server.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-base leading-relaxed mb-2">
                          If you accept, the extension will open X/Twitter in a new tab with a sidebar showing these steps:
                        </p>
                        <div className="ml-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                            <span className="text-sm text-gray-600">Go to your Twitter profile</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                            <span className="text-sm text-gray-600">Log in if you haven't yet</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                            <span className="text-sm text-gray-600">The extension proves your Twitter handle to the verifier server</span>
                          </div>
                        </div>
                        <p className="text-base leading-relaxed mb-2">
                          Click on the buttons in the sidebar to proceed.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-base leading-relaxed">
                        {process.env.POAP === 'true' ? (
                          <>
                            If successful, your handle will be shown here and you can claim a POAP.
                          </>
                        ) : (
                          <>
                            If successful, your handle will be shown here.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> When step 3 is running, you can close the Twitter/X tab, but don't close the sidebar.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {step === 1 && sessionId && screenName && (
              <div className="flex flex-col items-center justify-center gap-6 max-w-4xl w-full">

                {/* Success Header with Animation */}
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="bg-green-100 border-2 border-green-300 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <span className="text-4xl">✅</span>
                  </div>

                  <h2 className="text-3xl font-bold text-green-800 mb-2">
                    🎉 Verification Successful! 🎉
                  </h2>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Successfully verified your Twitter identity
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-lg text-gray-700">
                        Handle: <span className="font-bold text-green-700 text-xl">@{screenName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* POAP Section */}
                {process.env.POAP === 'true' && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-8 w-full shadow-lg">
                    <div className="text-center space-y-4">
                      <div className="bg-yellow-100 border-2 border-yellow-300 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                        <span className="text-3xl">🎁</span>
                      </div>

                      <h3 className="text-2xl font-bold text-yellow-800">
                        Claim Your Reward!
                      </h3>

                      <p className="text-lg text-yellow-700 max-w-2xl mx-auto">
                        You've successfully proven your Twitter identity! Now claim your exclusive POAP token as proof of this achievement.
                      </p>

                      <div className="pt-4">
                        <ClaimPoap sessionId={sessionId} exploding={exploding} />
                      </div>
                    </div>
                  </div>
                )}

                {/* What's Next Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 w-full">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3 text-center">
                    What just happened?
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600">🔒</span>
                      <div>
                        <p className="font-semibold">Privacy Preserved</p>
                        <p>Your sensitive data stayed private - only your handle was verified</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600">🛡️</span>
                      <div>
                        <p className="font-semibold">Cryptographic Proof</p>
                        <p>TLSNotary created a verifiable proof without exposing your credentials to the verifier</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Try Again Button */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      setSessionId('');
                      setScreenName('');
                      setStep(1);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    🔄 Try Again
                  </button>
                </div>
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
  exploding,
  sessionId,
}: {
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
      if (!sessionId) return;
      const response = await fetch('/poap-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
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
    <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to the TLSNotary Plugin Demo!
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Verify private user data in web applications using zero-knowledge proofs
        </p>
        <img className="mx-auto max-w-full h-auto mt-4" src={OverviewSvg} alt="TLSNotary Prover-Verifier Overview" />
      </div>

      {/* Demo Description */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 w-full">
        <h2 className="text-2xl font-semibold text-blue-900 mb-6 text-center">
          How this demo works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Connect Extension</h3>
            <p className="text-gray-600 text-sm">
              Install and connect the TLSNotary browser extension
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Prove Ownership</h3>
            <p className="text-gray-600 text-sm">
              Prove you own a Twitter/X account without revealing sensitive data
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {process.env.POAP === 'true' ? 'Get Rewarded' : 'Verification Complete'}
            </h3>
            <p className="text-gray-600 text-sm">
              {process.env.POAP === 'true'
                ? 'Receive a POAP token as proof of verification'
                : 'Your Twitter handle is verified'
              }
            </p>
          </div>
        </div>

        {process.env.POAP === 'true' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-center text-yellow-800">
              🎁 <strong>Special offer:</strong> Get a POAP (Proof of Attendance Protocol) token after verification!{' '}<br />
              <span className="font-semibold">(while supplies last)</span>
            </p>
          </div>
        )}
      </div>

      {/* Installation Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 w-full shadow-sm">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Get Started
            </h2>
            <p className="text-gray-600">
              Install the TLSNotary extension to begin the verification process
            </p>
            {/* Add the manual refresh notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Note:</strong> This page cannot automatically detect when the extension is installed.
                You'll need to refresh the page after installation. We've added a refresh button below for your convenience.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://chromewebstore.google.com/detail/tlsn-extension/gcfkkledipjbgdbimfpijgbkhajiaaph"
              target="_blank"
              className="button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold min-w-[200px]"
            >
              📥 Install Extension
            </a>

            <button
              onClick={handleRefresh}
              className="button bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 text-lg font-semibold min-w-[200px]"
            >
              🔄 Refresh Page
            </button>
          </div>

        </div>
      </div>

      {/* Additional Info */}
      <div className="text-center space-y-4 text-gray-600 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900">
          What is TLSNotary?
        </h3>
        <p className="text-sm leading-relaxed">
          TLSNotary enables privacy-preserving verification of web data. Instead of sharing your actual data,
          you can prove specific facts about it using cryptographic proofs, keeping your sensitive information private.
        </p>

        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-4">
          <a href="https://tlsnotary.org" className="hover:text-blue-600 transition-colors">Learn More</a>
          <a href="https://tlsnotary.org/docs/intro" className="hover:text-blue-600 transition-colors">Documentation</a>
          <a href="https://github.com/tlsnotary" className="hover:text-blue-600 transition-colors">GitHub</a>
        </div>
      </div>
    </div>
  );
}
