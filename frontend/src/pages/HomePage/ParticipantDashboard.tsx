import { FC, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { formatEther, zeroAddress } from 'viem'
import { toast, Id as ToastId } from 'react-toastify'
import { Proof } from '@reclaimprotocol/js-sdk'; // Import Reclaim Proof type
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config';
import { Button } from '../../components/Button';
import { StatusBanner } from '../../components/StatusBanner';
import ReclaimDemo from '../../components/Reclaim/Reclaim'; // Import ReclaimDemo
import commonStyles from './DashboardCommon.module.css';
import participantStyles from './ParticipantDasboard.module.css';


export const ParticipantDashboard: FC = () => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined);
  const currentToastId = useRef<ToastId | null>(null);
  const [reclaimProofs, setReclaimProofs] = useState<Proof[]>([]); // State for Reclaim proofs
  const [proofState, setProofState] = useState<'idle' | 'generating' | 'generated' | 'error'>('idle'); // State for proof generation UI
  const [isFollowingVerified, setIsFollowingVerified] = useState<boolean | null>(null); // null: not checked, true: verified, false: not following
  const [followingErrorMessage, setFollowingErrorMessage] = useState<string>(''); // Error message if not following

  // --- Callbacks ---
  const handleProofGenerated = useCallback((proofs: Proof[]) => {
    setReclaimProofs(proofs);
    setProofState('generated');
    setIsFollowingVerified(null); // Reset verification status
    setFollowingErrorMessage('');

    if (proofs && proofs.length > 0) {
      const firstProof = proofs[0];
      try {
        // Safely parse proof context
        const contextData = JSON.parse(firstProof.claimData.context);
        // Check the 'following' status directly within extractedParameters
        const isFollowing = contextData?.extractedParameters?.following === 'true';

        if (isFollowing) {
          setIsFollowingVerified(true);
          toast.success('Attestation proof generated and verified successfully!');
        } else {
          setIsFollowingVerified(false);
          setFollowingErrorMessage('Proof verified, but it shows you are not following the required account. Entry is disabled.');
          toast.warn('Proof generated, but verification failed: Not following required account.');
        }
      } catch (error) {
        console.error("Error parsing proof context:", error);
        setIsFollowingVerified(false); // Treat parsing errors as verification failure
        setFollowingErrorMessage('Failed to parse proof context. Cannot verify following status.');
        toast.error('Error processing proof context.');
        setProofState('error'); // Set proof state to error if context parsing fails
      }
    } else {
      // Handle case where proofs array is empty or undefined
      setIsFollowingVerified(false);
      setFollowingErrorMessage('No valid proof received.');
      setProofState('error');
    }
  }, []);

  // Reset following verification if proof state changes back from generated/error
  useEffect(() => {
    if (proofState !== 'generated' && proofState !== 'error') {
      setIsFollowingVerified(null);
      setFollowingErrorMessage('');
    }
  }, [proofState]);


  // --- Read Contract Data ---
  const {
    data: lotteryDetails,
    refetch: refetchLotteryDetails,
    isLoading: isLoadingLotteryDetails,
    isError: isErrorLotteryDetails,
    error: errorLotteryDetails,
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getLotteryDetails',
  }) satisfies WagmiUseReadContractReturnType<
    'getLotteryDetails',
    readonly [number, bigint, bigint, bigint, boolean]
  >

  // Extract details
  const currentState = useMemo(() => lotteryDetails?.[0], [lotteryDetails])
  const participantCount = useMemo(() => lotteryDetails?.[1], [lotteryDetails])
  const currentPrize = useMemo(() => lotteryDetails?.[2], [lotteryDetails])
  const maxAllowedParticipants = useMemo(() => lotteryDetails?.[3], [lotteryDetails])
  const isWinnerPicked = useMemo(() => lotteryDetails?.[4], [lotteryDetails])

  // Map enum state
  const lotteryStateString = useMemo(() => {
    if (isLoadingLotteryDetails) return 'Loading...'
    if (isErrorLotteryDetails) return `Error: ${errorLotteryDetails?.shortMessage || errorLotteryDetails?.message}`
    switch (currentState) {
      case 0: return 'Inactive'
      case 1: return 'Active'
      default: return 'Unknown State'
    }
  }, [currentState, isLoadingLotteryDetails, isErrorLotteryDetails, errorLotteryDetails])

  // Fetch participant list to check if current user has entered
  const { data: participantsList, refetch: refetchParticipantsList, isLoading: isLoadingParticipants } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getParticipants',
    query: {
      enabled: !!address,
    },
  }) satisfies WagmiUseReadContractReturnType<'getParticipants', readonly `0x${string}`[]>

  // Check if current address is in the list
  const hasEntered = useMemo(() => {
    if (!address || !participantsList) return false;
    return participantsList.some((p: `0x${string}`) => p.toLowerCase() === address.toLowerCase());
  }, [address, participantsList]);

  // Fetch winner address
  const { data: winnerAddress, refetch: refetchWinnerAddress } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'lotteryWinner',
    query: {
      enabled: currentState === 0 && isWinnerPicked === true,
    }
  }) satisfies WagmiUseReadContractReturnType<'lotteryWinner', `0x${string}`>

  // Check if the current user is the winner
  const isCurrentUserWinner = useMemo(() => {
    if (!address || !winnerAddress || winnerAddress === zeroAddress) return false;
    return winnerAddress.toLowerCase() === address.toLowerCase();
  }, [address, winnerAddress]);

  // --- Write Contract Logic ---
  const { writeContract, isPending: isWritePending, reset: resetWriteContract } = useWriteContract()

  // Handle Enter Lottery
  const handleEnterLottery = () => {
    if (proofState !== 'generated' || reclaimProofs.length === 0) {
      toast.error('Please generate the required attestation proof first.');
      return;
    }

    // --- Prepare Proof Data for Smart Contract ---
    // This part needs careful implementation based on how the Reclaim.Proof struct is defined in Solidity
    // and what data the `enter` function expects. Assuming it needs the whole proof object for now.
    // You might need to serialize or format specific fields.
    const proofArg = reclaimProofs[0]; // Assuming the first proof is the relevant one

    const formattedProofArg = {
      claimInfo: {
        provider: proofArg.claimData.provider,
        parameters: proofArg.claimData.parameters,
        context: proofArg.claimData.context,
      },
      signedClaim: {
        signatures: proofArg.signatures,
        claim: {
          identifier: proofArg.identifier,
          owner: proofArg.claimData.owner,
          timestampS: Number(proofArg.claimData.timestampS) >>> 0,
          epoch: proofArg.claimData.epoch,
        }
      }
    };
    // --- End Proof Data Preparation ---


    const functionName = 'enter';
    const loadingMessage = 'Submitting transaction...';
    const errorMessagePrefix = 'Failed to enter lottery';

    if (currentToastId.current) {
      toast.dismiss(currentToastId.current);
    }
    currentToastId.current = toast.loading(loadingMessage); // Show initial toast
    setPendingAction(functionName); // Set the specific action being processed

    // Corrected writeContract structure
    writeContract(
      { // First argument: configuration
        ...WAGMI_CONTRACT_CONFIG,
        functionName,
        args: [formattedProofArg], // Pass the formatted proof
      },
      { // Second argument: options object
        onSuccess: (hash: `0x${string}`) => {
          console.log(`Transaction submitted (${functionName}): ${hash}`);
          setCurrentTxHash(hash);
          if (currentToastId.current) {
            toast.update(currentToastId.current, {
              render: (
                <div>
                  <div>Transaction submitted, waiting for confirmation...</div>
                  <div style={{ fontSize: '0.8em', wordBreak: 'break-all', marginTop: '4px', opacity: 0.8 }}>
                    Tx Hash: {hash}
                  </div>
                </div>
              ),
              type: "info",
              isLoading: true
            });
          }
        },
        onError: (error: Error) => {
          console.error(`Transaction submission error (${functionName}):`, error);
          // Attempt to parse custom error
          let displayError = error.message;
          if (error.message.includes('InvalidAttestation')) {
            // Basic parsing, might need refinement based on actual error format
            const match = error.message.match(/InvalidAttestation\("([^"]*)"\)/);
            if (match && match[1]) {
              displayError = `Attestation Error: ${match[1]}`;
            } else {
              displayError = 'Invalid Attestation Proof';
            }
          }

          if (currentToastId.current) {
            toast.update(currentToastId.current, { render: `${errorMessagePrefix}: ${displayError}`, type: "error", isLoading: false, autoClose: 5000 });
          } else {
            toast.error(`${errorMessagePrefix}: ${displayError}`);
          }
          resetWriteContract();
          setPendingAction(null);
          setCurrentTxHash(undefined);
          currentToastId.current = null;
        },
      }
    );
  }

  // Hook to monitor the transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isConfirmationError,
    error: confirmationError,
  } = useWaitForTransactionReceipt({
    hash: currentTxHash,
    query: {
      enabled: !!currentTxHash,
    },
  });

  // Effect to update toast based on transaction confirmation status
  useEffect(() => {
    if (!currentTxHash || !pendingAction) return;

    // Only handle 'enter' action in this dashboard
    if (pendingAction !== 'enter') return;

    const successMessage = 'Successfully entered lottery!';
    const errorMessagePrefix = 'Failed to enter lottery';

    if (isConfirming && currentToastId.current) {
      // Update toast while confirming, include full hash using JSX
      toast.update(currentToastId.current, {
        render: (
          <div>
            <div>Confirming transaction...</div>
            <div style={{ fontSize: '0.8em', wordBreak: 'break-all', marginTop: '4px', opacity: 0.8 }}>
              Tx Hash: {currentTxHash}
            </div>
          </div>
        ),
        type: "info",
        isLoading: true
      });
    } else if (isConfirmed && currentToastId.current) {
      // Update toast on success, include full hash using JSX
      toast.update(currentToastId.current, {
        render: (
          <div>
            <div>{successMessage}</div>
            <div style={{ fontSize: '0.8em', wordBreak: 'break-all', marginTop: '4px', opacity: 0.8 }}>
              Tx Hash: {currentTxHash}
            </div>
          </div>
        ),
        type: "success",
        isLoading: false,
        autoClose: 5000
      });
      console.log(`Transaction confirmed (${pendingAction}): ${currentTxHash}`);

      // Refetch data *after* confirmation
      const detailsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getLotteryDetails', undefined];
      const participantsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getParticipants', undefined];
      queryClient.invalidateQueries({ queryKey: detailsQueryKey });
      queryClient.invalidateQueries({ queryKey: participantsQueryKey });
      refetchLotteryDetails();
      refetchParticipantsList();
      // Refetch winner address too, in case the lottery ended and winner was picked while confirming
      refetchWinnerAddress();

      // Reset state
      resetWriteContract();
      setPendingAction(null);
      setCurrentTxHash(undefined);
      currentToastId.current = null;

    } else if (isConfirmationError && currentToastId.current) {
      const errorReason = confirmationError?.message || 'Unknown confirmation error';
      toast.update(currentToastId.current, { render: `${errorMessagePrefix}: ${errorReason}`, type: "error", isLoading: false, autoClose: 5000 });
      console.error(`Transaction confirmation error (${pendingAction}):`, confirmationError);

      // Reset state
      resetWriteContract();
      setPendingAction(null);
      setCurrentTxHash(undefined);
      currentToastId.current = null;
    }
    // Added refetchWinnerAddress to dependencies
  }, [isConfirming, isConfirmed, isConfirmationError, confirmationError, currentTxHash, pendingAction, queryClient, refetchLotteryDetails, refetchParticipantsList, refetchWinnerAddress, resetWriteContract]);


  // Determine if user can enter
  const isLotteryFull = useMemo(() => {
    if (participantCount === undefined || maxAllowedParticipants === undefined) return false;
    return participantCount >= maxAllowedParticipants;
  }, [participantCount, maxAllowedParticipants]);

  // Update canEnter logic to include proof state and following verification
  const canEnter = currentState === 1 && !hasEntered && !isLotteryFull && proofState === 'generated' && isFollowingVerified === true;

  return (
    <div className={commonStyles.dashboardContainer}>
      {/* Welcome Section Removed */}

      {/* Status Section */}
      <div>
        <h4>Lottery Status</h4>
        <div className={commonStyles.statusSection}>
          {/* Row 1: State & Participants */}
          <div className={commonStyles.statusDisplayRow}>
            <div className={commonStyles.statItem}>
              <div className={commonStyles.statLabel}>Current State</div>
              <div className={commonStyles.statValue}>{lotteryStateString}</div>
            </div>
            <div className={commonStyles.statItem}>
              <div className={commonStyles.statLabel}>Participants</div>
              <div className={commonStyles.statValue}>
                {participantCount?.toString() ?? '...'} / {maxAllowedParticipants?.toString() ?? '...'}
              </div>
            </div>

            {/* Prize Pool - Row 2 */}
          </div>
          <div className={commonStyles.statusDisplayRow}>
            <div className={commonStyles.statItem}>
              <div className={commonStyles.statLabel}>Prize Pool</div>
              <div className={commonStyles.statValue}>
                {currentPrize !== undefined ? formatEther(currentPrize) : '...'} ETH
              </div>
            </div>

            {/* Winner Picked Removed */}
          </div>

          {/* Winner Display - Row 3 (Conditional) */}
          {isWinnerPicked && winnerAddress && winnerAddress !== zeroAddress && (
            <div className={commonStyles.statusDisplayRow}>
              {/* Using winnerCard style for now, could be simplified */}
              <div className={`${participantStyles.winnerCard} ${commonStyles.statItem}`} style={{width: '100%'}}>
                <div className={commonStyles.statLabel}>Winner</div>
                <div className={participantStyles.winnerAddress}>{winnerAddress}</div>
              </div>
            </div>
          )}
        </div> {/* End of commonStyles.statusSection */}
      </div>

      {/* Participant Status Banner & Message (Moved Below Status Section) */}
      {hasEntered && (
        <StatusBanner type={isCurrentUserWinner ? "success" : "info"}>
          {isCurrentUserWinner ? (
            <strong>🎉 Congratulations! You won this lottery! 🎉</strong> // Use strong tag directly
          ) : (
            <strong>You have entered this lottery!</strong>
          )}
        </StatusBanner>
      )}
      {isWinnerPicked && hasEntered && !isCurrentUserWinner && (
        <div className={commonStyles.infoMessage} style={{ textAlign: 'center', marginTop: '0.5rem' }}> {/* Adjusted margin */}
          Better luck next time!
        </div>
      )}

      {/* Actions Section - Conditionally Rendered */}
      {!hasEntered && currentState !== 0 && !isWinnerPicked && ( // Only show actions if not entered and lottery hasn't ended
        <div className={commonStyles.actionsSection}>
          <h4>Entry Requirements</h4>
          {/* Reclaim Proof Generation */}
          <div style={{ marginBottom: '1rem' }}>
            <p>To enter, you must prove you follow @oasisprotocol on Twitter.</p>
            {proofState === 'idle' && <p>Click below to generate the proof.</p>}
            {proofState === 'generating' && <p>Generating proof... Follow instructions in the Reclaim app.</p>}
            {proofState === 'generated' && isFollowingVerified === true && <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Proof generated and verified successfully!</p>}
            {proofState === 'generated' && isFollowingVerified === false && <p style={{ color: 'orange', fontWeight: 'bold' }}>⚠️ {followingErrorMessage}</p>}
            {proofState === 'error' && <p style={{ color: 'red' }}>{followingErrorMessage || 'Proof generation failed. Please try again.'}</p>}

            <ReclaimDemo onProofGenerated={handleProofGenerated} />
            {/* Consider adding a retry button if proofState === 'error' */}
          </div>

          {/* Enter Lottery Button */}
          <div>
            <Button
              onClick={handleEnterLottery}
              // Updated disabled logic
              disabled={
                !!currentTxHash ||
                isWritePending ||
                isLoadingLotteryDetails ||
                isLoadingParticipants ||
                proofState !== 'generated' || // Must have generated proof
                isFollowingVerified !== true || // Must have verified following status
                currentState !== 1 || // Lottery must be active
                hasEntered || // Must not have entered
                isLotteryFull || // Lottery must not be full
                isWinnerPicked // Lottery must not have ended
              }
              className={commonStyles.actionButton}
            >
              {isWritePending && pendingAction === 'enter' ? 'Processing...' : 'Enter Lottery'}
            </Button>

            {/* Display reasons why entry might be disabled */}
            {!isWritePending && !isLoadingLotteryDetails && !isLoadingParticipants && (
              <div className={commonStyles.infoMessage}>
                {proofState !== 'generated' && 'Please generate the attestation proof first.'}
                {proofState === 'generated' && isFollowingVerified !== true && (followingErrorMessage || 'Proof verification pending or failed.')}
                {proofState === 'generated' && isFollowingVerified === true && currentState !== 1 && 'Lottery is not active for entry.'}
                {proofState === 'generated' && isFollowingVerified === true && currentState === 1 && isLotteryFull && 'Lottery is full.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
