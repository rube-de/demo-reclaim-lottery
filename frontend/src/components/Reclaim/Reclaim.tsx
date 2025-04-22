'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { ReclaimProofRequest, Proof } from '@reclaimprotocol/js-sdk';
import { Button } from '../Button'; // Import standard Button
const { VITE_RECLAIM_APPLICATION_SECRET } = import.meta.env

interface ReclaimDemoProps {
  onProofGenerated: (proofs: Proof[]) => void;
}

export default function ReclaimDemo({ onProofGenerated }: ReclaimDemoProps) {
  const [requestUrl, setRequestUrl] = useState('');
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
 
  // Function to initiate the Reclaim verification process
  const getVerificationReq = async () => {
    // Constants for Reclaim configuration (App ID, Secret, Provider ID)
    // TODO: Consider moving these to config or environment variables if they change per environment
    const APP_ID = '0x6BD0647820eb0F6f318689CFd9ba340119adA9a8';
    const APP_SECRET = VITE_RECLAIM_APPLICATION_SECRET;
    const PROVIDER_ID = '1c476dfe-33e8-4cb9-adcf-e6c1d12a5cea';

    if (!APP_SECRET) {
      console.error('Reclaim Application Secret is not defined in environment variables.');
      setStatus('error');
      setErrorMessage('Configuration error: Reclaim Application Secret is missing.');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      setProofs([]);
      
      // Initialize the Reclaim SDK
      const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);
 
      // Generate the verification request URL for the QR code
      const requestUrl = await reclaimProofRequest.getRequestUrl();

      console.log('Request URL:', requestUrl); // Keep for debugging if needed

      setRequestUrl(requestUrl);
 
      // Start listening for proof submissions from the Reclaim mobile app
      await reclaimProofRequest.startSession({
          // Callback when the user successfully submits the proof via the app
          onSuccess: (receivedProofs) => {
            const validProofs: Proof[] = [];
            if (receivedProofs) {
              const proofsArray = Array.isArray(receivedProofs) ? receivedProofs : [receivedProofs];

              proofsArray.forEach(proof => {
                if (typeof proof !== 'string') {
                  validProofs.push(proof);
                } else {
                  console.log('Received string message instead of proof:', proof);
                }
              });

              if (validProofs.length > 0) {
                console.log('Verification success', JSON.stringify(validProofs.map(p => p.claimData.context))); // Keep context log for debugging
                setProofs(validProofs);
                onProofGenerated(validProofs); // Pass valid proofs to the parent component
                setStatus('success');
              } else {
                console.error('No valid proofs received.');
                setStatus('error');
                setErrorMessage('Verification completed, but no valid proofs were received.');
                setRequestUrl('');
              }
            } else {
              console.error('No proofs received in onSuccess callback.');
              setStatus('error');
              setErrorMessage('Verification completed, but no proofs were received.');
              setRequestUrl(''); // Clear QR code if no valid proofs
            }

          // Optional: Play success sound
          const audio = new Audio('/success.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e)); // Non-critical, log error if fails
          
          // Optional: Show browser notification on success
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Verification Complete', {
              body: 'Your credentials have been successfully verified!'
            });
          }
        },
        // Callback if there's an error during the verification session
        onError: (error) => {
          console.error('Verification failed', error);
          
          setStatus('error');
          setErrorMessage(error.message || 'Verification failed. Please try again.');
          setRequestUrl(''); // Clear QR code on error
          
          // Optional: Reset status after a delay to allow retry
          // This helps if the error was transient or user wants to try again without manual refresh
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
    <div className="w-full flex flex-col items-center gap-8">
      <Button
        variant="solid"
        color="primary"
        onClick={getVerificationReq}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Processing...' : 'Get Verification Request'}
      </Button>

      {requestUrl && status !== 'success' && (
        <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
          <h3 className="text-lg font-semibold">Scan this QR Code</h3>
          <QRCode value={requestUrl} />
          {status === 'loading' && (
            <p className="text-sm text-gray-600 animate-pulse">Waiting for verification...</p>
          )}
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="w-full max-w-2xl p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <h3 className="font-semibold mb-1">Verification Error</h3>
          <p>{errorMessage}</p>
        </div>
      )}

      {status === 'success' && proofs && proofs.length > 0 && (
        <div className="w-full max-w-2xl p-4 border border-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">Verification Successful!</h2>
          <p>Your attestation proof has been generated.</p>
        </div>
      )}
    </div>
  );
}
