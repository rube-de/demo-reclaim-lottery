'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { ReclaimProofRequest, Proof } from '@reclaimprotocol/js-sdk';
const { VITE_RECLAIM_APPLICATION_SECRET } = import.meta.env 

interface ReclaimDemoProps {
  onProofGenerated: (proofs: Proof[]) => void;
}

export default function ReclaimDemo({ onProofGenerated }: ReclaimDemoProps) {
  // State to store the verification request URL
  const [requestUrl, setRequestUrl] = useState('');
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
 
  const getVerificationReq = async () => {
    // Your credentials from the Reclaim Developer Portal
    // Replace these with your actual credentials
    const APP_ID = '0x6BD0647820eb0F6f318689CFd9ba340119adA9a8';
    const APP_SECRET = VITE_RECLAIM_APPLICATION_SECRET;
    const PROVIDER_ID = '1c476dfe-33e8-4cb9-adcf-e6c1d12a5cea';

    if (!APP_SECRET) {
      console.error('Reclaim Application Secret is not defined in environment variables.');
      setStatus('error');
      setErrorMessage('Configuration error: Reclaim Application Secret is missing.');
      return; // Stop execution if secret is missing
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      setProofs([]);
      
      // Initialize the Reclaim SDK with your credentials
      const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);
 
      // Generate the verification request URL
      const requestUrl = await reclaimProofRequest.getRequestUrl();

      console.log('Request URL:', requestUrl);

      setRequestUrl(requestUrl);
 
      // Start listening for proof submissions
      await reclaimProofRequest.startSession({
          // Called when the user successfully completes the verification
          onSuccess: (receivedProofs) => {
            const validProofs: Proof[] = [];
            if (receivedProofs) {
              // Ensure we always work with an array, even if a single proof is returned
              const proofsArray = Array.isArray(receivedProofs) ? receivedProofs : [receivedProofs];

              proofsArray.forEach(proof => {
                // Filter out potential string messages if custom callback URL is used (though typically we expect Proof objects)
                if (typeof proof !== 'string') {
                  validProofs.push(proof);
                } else {
                  console.log('Received string message instead of proof:', proof);
                }
              });

              if (validProofs.length > 0) {
                console.log('Verification success', JSON.stringify(validProofs.map(p => p.claimData.context)));
                setProofs(validProofs);
                onProofGenerated(validProofs); // Call the callback prop
                setStatus('success');
              } else {
                console.error('No valid proofs received.');
                setStatus('error');
                setErrorMessage('Verification completed, but no valid proofs were received.');
                setRequestUrl(''); // Reset QR code
              }
            } else {
              console.error('No proofs received in onSuccess callback.');
              setStatus('error');
              setErrorMessage('Verification completed, but no proofs were received.');
              setRequestUrl(''); // Reset QR code
            }

          // Optional: Play success sound
          const audio = new Audio('/success.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          // Optional: Show success notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Verification Complete', {
              body: 'Your credentials have been successfully verified!'
            });
          }
        },
        // Called if there's an error during verification
        onError: (error) => {
          console.error('Verification failed', error);
          
          // Error handling logic
          setStatus('error');
          setErrorMessage(error.message || 'Verification failed. Please try again.');
          setRequestUrl(''); // Reset QR code
          
          // Optional: Implement retry mechanism after delay
          setTimeout(() => {
            setStatus('idle');
          }, 5000);
        },
      });
    } catch (error: any) {
      console.error('Initialization error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to initialize verification. Please try again.');
    }
  };
 
  return (
    <div className="flex flex-col items-center gap-8">
      <button 
        onClick={getVerificationReq}
        disabled={status === 'loading'}
        className={`rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {status === 'loading' ? 'Processing...' : 'Get Verification Request'}
      </button>

      {/* Display QR code when URL is available */}
      {requestUrl && (
        <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
          <h3 className="text-lg font-semibold">Scan this QR Code</h3>
          <QRCode value={requestUrl} />
          {status === 'loading' && (
            <p className="text-sm text-gray-600 animate-pulse">Waiting for verification...</p>
          )}
        </div>
      )}

      {/* Display error message */}
      {status === 'error' && errorMessage && (
        <div className="w-full max-w-2xl p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <h3 className="font-semibold mb-1">Verification Error</h3>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Display success message and proofs */}
      {status === 'success' && proofs && proofs.length > 0 && (
        <div className="w-full max-w-2xl p-4 border border-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">Verification Successful!</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(proofs, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
