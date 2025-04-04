import { FC, useMemo, useState, useEffect, useRef } from 'react' // Added useEffect, useRef
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi' // Added useWaitForTransactionReceipt back
import { useQueryClient } from '@tanstack/react-query'
import { formatEther, zeroAddress } from 'viem'
import { toast, Id as ToastId } from 'react-toastify' // Import toast and Id type
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config';
import { Button } from '../../components/Button';
// import { Alert } from '../../components/Alert'; // No longer using Alert here
import { StatusBanner } from '../../components/StatusBanner'; // Import the new component
import commonStyles from './DashboardCommon.module.css';
import participantStyles from './ParticipantDasboard.module.css';

// Removed TransactionStatus type and useTransactionState hook

export const ParticipantDashboard: FC = () => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<string | null>(null); // State to track specific pending action
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined); // State for the current transaction hash
  const currentToastId = useRef<ToastId | null>(null); // Ref to store the current toast ID
  // Removed lastTxStatus and lastTxAction state

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
  const { writeContract, isPending: isWritePending, reset: resetWriteContract } = useWriteContract() // Added reset

  // Handle Enter Lottery
  const handleEnterLottery = () => {
    const functionName = 'enter';
    const loadingMessage = 'Submitting transaction...'; // Initial toast message
    const successMessage = 'Successfully entered lottery!';
    const errorMessagePrefix = 'Failed to enter lottery';

    // Dismiss any existing toast
    if (currentToastId.current) {
      toast.dismiss(currentToastId.current);
    }
    currentToastId.current = toast.loading(loadingMessage); // Show initial toast
    setPendingAction(functionName); // Set the specific action being processed

    writeContract({
      ...WAGMI_CONTRACT_CONFIG,
      functionName,
    }, {
      onSuccess: (hash: `0x${string}`) => {
        console.log(`Transaction submitted (${functionName}): ${hash}`);
        setCurrentTxHash(hash); // Store hash to monitor
        // Update toast to indicate waiting for confirmation, include full hash using JSX
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
        if (currentToastId.current) {
          toast.update(currentToastId.current, { render: `${errorMessagePrefix}: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        } else {
          toast.error(`${errorMessagePrefix}: ${error.message}`);
        }
        resetWriteContract();
        setPendingAction(null);
        setCurrentTxHash(undefined);
        currentToastId.current = null;
      },
    });
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

  const canEnter = currentState === 1 && !hasEntered && !isLotteryFull;

  // Removed getErrorMessage function and errorMessage variable

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
      {!hasEntered && (
        <div className={commonStyles.actionsSection}>
          <h4>Actions</h4>
          <div>
          <Button
            onClick={handleEnterLottery}
            disabled={!!currentTxHash || isWritePending || isLoadingLotteryDetails || isLoadingParticipants || !canEnter || isWinnerPicked} // Disable if tx pending or other conditions
            className={commonStyles.actionButton}
          >
            {isWritePending && pendingAction === 'enter' ? 'Processing...' : 'Enter Lottery'}
          </Button>

          {/* Display reasons why entry might be disabled */}
          {!isWritePending && !isLoadingLotteryDetails && !isLoadingParticipants && ( // Check loading states too
            <div className={commonStyles.infoMessage}>
              {currentState !== 1 && !isWinnerPicked && 'Lottery is not active for entry.'}
              {currentState === 1 && hasEntered && !isWinnerPicked && 'You have already entered.'}
              {currentState === 1 && !hasEntered && isLotteryFull && !isWinnerPicked && 'Lottery is full.'}
              {isWinnerPicked && 'Lottery has ended.'}
            </div>
          )}
          </div>
        </div>
      )}
      {/* Transaction Status/Error Messages Section Removed */}
    </div>
  )
}
