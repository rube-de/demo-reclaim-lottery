import { FC, useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi' // Remove useQueryClient import from wagmi
import { useQueryClient } from '@tanstack/react-query' // Import useQueryClient from react-query
import { formatEther, zeroAddress } from 'viem' // Import formatEther and zeroAddress
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
import { Alert } from '../../components/Alert' // Import Alert
// import classes from './index.module.css'

// Re-use transaction status types/hook from OwnerDashboard (or move to a shared file)
type TransactionStatus = {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  hash?: `0x${string}`
}

const useTransactionState = (hash?: `0x${string}`): TransactionStatus => {
  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
    error,
  } = useWaitForTransactionReceipt({ hash })

  return {
    isPending: false,
    isConfirming,
    isSuccess,
    isError,
    error,
    hash,
  }
}


export const ParticipantDashboard: FC = () => {
  const { address } = useAccount()
  const queryClient = useQueryClient() // Get query client instance
  const [lastTxStatus, setLastTxStatus] = useState<TransactionStatus | null>(null)
  const [lastTxAction, setLastTxAction] = useState<string | null>(null)

  // --- Read Contract Data ---
  // 1. Fetch all lottery details
  // Removed duplicate const {
  const {
    data: lotteryDetails,
    refetch: refetchLotteryDetails, // Get refetch function
    isLoading: isLoadingLotteryDetails,
    isError: isErrorLotteryDetails,
    error: errorLotteryDetails,
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getLotteryDetails',
  }) satisfies WagmiUseReadContractReturnType< // Keep satisfies for type safety
    'getLotteryDetails',
    readonly [number, bigint, bigint, bigint, boolean] // Simplified tuple type
  >

  // Extract details
  const currentState = useMemo(() => lotteryDetails?.[0], [lotteryDetails])
  const participantCount = useMemo(() => lotteryDetails?.[1], [lotteryDetails])
  const currentPrize = useMemo(() => lotteryDetails?.[2], [lotteryDetails])
  const maxAllowedParticipants = useMemo(() => lotteryDetails?.[3], [lotteryDetails])
  const isWinnerPicked = useMemo(() => lotteryDetails?.[4], [lotteryDetails])

  // Map enum state
  const lotteryStateString = useMemo(() => { /* ... same as before ... */
    if (isLoadingLotteryDetails) return 'Loading...'
    if (isErrorLotteryDetails) return `Error: ${errorLotteryDetails?.shortMessage || errorLotteryDetails?.message}`
    switch (currentState) {
      case 0: return 'Inactive'
      case 1: return 'Active'
      default: return 'Unknown State'
    }
  }, [currentState, isLoadingLotteryDetails, isErrorLotteryDetails, errorLotteryDetails])

  // 2. Fetch participant list to check if current user has entered
  const { data: participantsList, refetch: refetchParticipantsList, isLoading: isLoadingParticipants } = useReadContract({ // Get refetch function
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getParticipants',
    query: {
      enabled: !!address, // Only run if address is available
    },
  }) satisfies WagmiUseReadContractReturnType<'getParticipants', readonly `0x${string}`[]>

  // Check if current address is in the list
  const hasEntered = useMemo(() => {
    if (!address || !participantsList) return false;
    // Add explicit type for 'p'
    return participantsList.some((p: `0x${string}`) => p.toLowerCase() === address.toLowerCase());
  }, [address, participantsList]);

  // 3. Fetch winner address
  const { data: winnerAddress, refetch: refetchWinnerAddress } = useReadContract({ // Get refetch function
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'lotteryWinner',
    query: {
      // Only fetch if the winner has potentially been picked
      enabled: currentState === 0 && isWinnerPicked === true, // Fetch only when inactive AND winner picked
    }
  }) satisfies WagmiUseReadContractReturnType<'lotteryWinner', `0x${string}`>

  // Check if the current user is the winner
  const isCurrentUserWinner = useMemo(() => {
    if (!address || !winnerAddress || winnerAddress === zeroAddress) return false;
    return winnerAddress.toLowerCase() === address.toLowerCase();
  }, [address, winnerAddress]);

  // --- Write Contract Logic ---
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract()
  const txStatus = useTransactionState(txHash)

  // Update lastTxStatus
  useEffect(() => {
    if (isWritePending || txStatus.isConfirming || txStatus.isSuccess || txStatus.isError) {
      setLastTxStatus({
        isPending: isWritePending,
        isConfirming: txStatus.isConfirming,
        isSuccess: txStatus.isSuccess,
        isError: txStatus.isError || !!writeError,
        error: txStatus.error || writeError,
        hash: txHash,
      })
    }
  }, [isWritePending, txStatus.isConfirming, txStatus.isSuccess, txStatus.isError, txStatus.error, writeError, txHash])

  // Handle Enter Lottery
  const handleEnterLottery = () => {
    setLastTxAction('enter');
    setLastTxStatus({ isPending: true, isConfirming: false, isSuccess: false, isError: false, error: null });
    writeContract({
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'enter',
      // No args or value needed for this contract's enter function
    })
  }

  // Refetch data on success
  useEffect(() => {
    if (lastTxStatus?.isSuccess) {
      // Invalidate both queries
      const detailsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getLotteryDetails', undefined];
      const participantsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getParticipants', undefined];

      console.log(`Transaction ${lastTxAction} succeeded. Invalidating queries.`);
      queryClient.invalidateQueries({ queryKey: detailsQueryKey });
      queryClient.invalidateQueries({ queryKey: participantsQueryKey });
      console.log('Query invalidations called.');

      // Explicitly refetch data
      refetchLotteryDetails();
      refetchParticipantsList();
      // No need to refetch winner here, as entering doesn't change the winner
      console.log('Explicit refetches called.');
    }
    // Add refetch functions and lastTxAction to dependency array
  }, [lastTxStatus?.isSuccess, queryClient, refetchLotteryDetails, refetchParticipantsList, lastTxAction]) // Removed refetchWinnerAddress dependency

  // Combine loading/processing states
  const isProcessing = isLoadingLotteryDetails || isLoadingParticipants || lastTxStatus?.isPending || lastTxStatus?.isConfirming;

  // Determine if user can enter
  const isLotteryFull = useMemo(() => {
      if (participantCount === undefined || maxAllowedParticipants === undefined) return false; // Assume not full if data missing
      return participantCount >= maxAllowedParticipants;
  }, [participantCount, maxAllowedParticipants]);

  const canEnter = currentState === 1 && !hasEntered && !isLotteryFull;

  // Error message handling
  const getErrorMessage = (status: TransactionStatus | null): string | null => {
    if (!status || !status.isError) return null;
    const errorReason = (status.error as any)?.shortMessage || status.error?.message || 'Transaction failed.';
    return `Error: ${errorReason}`;
  }
  const errorMessage = getErrorMessage(lastTxStatus);

  return (
    <div className={/*classes.dashboardContainer*/ ""}>
      <h3>Participant Dashboard</h3>
      <p>Welcome, Participant ({address})</p>

      {/* Display Lottery State */}
      <div className={/*classes.statusSection*/ ""}>
        <h4>Lottery Status</h4>
        <p>Current State: <strong>{lotteryStateString}</strong></p>
        <p>Participants: <strong>{participantCount?.toString() ?? '...'} / {maxAllowedParticipants?.toString() ?? '...'}</strong></p>
        <p>Prize Pool: <strong>{currentPrize !== undefined ? formatEther(currentPrize) : '...'} ETH</strong></p>
        <p>Winner Picked: <strong>{isWinnerPicked === undefined ? '...' : isWinnerPicked ? 'Yes' : 'No'}</strong></p>
        {/* Display winner address if picked and not zero address */}
        {isWinnerPicked && winnerAddress && winnerAddress !== zeroAddress && (
          <p>Winner: <strong style={{ wordBreak: 'break-all' }}>{winnerAddress}</strong></p>
        )}
        {/* Show entry status and win status */}
        {hasEntered && !isCurrentUserWinner && <p><strong>You have entered this lottery!</strong></p>}
        {isCurrentUserWinner && (
          <Alert type="success">
            Congratulations, You Won!
          </Alert>
        )}
        {/* Show message if entered but did not win */}
        {isWinnerPicked && hasEntered && !isCurrentUserWinner && (
          <p>Better luck next time!</p>
        )}
      </div>
      {/* Participant Actions */}
      <div className={/*classes.actionsSection*/ ""}>
        <h4>Actions</h4>
        <Button
          onClick={handleEnterLottery}
          disabled={isProcessing || !canEnter || isWinnerPicked} // Also disable if winner already picked
        >
          {isProcessing && lastTxAction === 'enter' ? 'Processing...' : 'Enter Lottery'}
        </Button>
        {/* Display reasons why entry might be disabled */}
        {!isProcessing && currentState !== 1 && !isWinnerPicked && <p>Lottery is not active for entry.</p>}
        {!isProcessing && currentState === 1 && hasEntered && !isWinnerPicked && <p>You have already entered.</p>}
        {!isProcessing && currentState === 1 && !hasEntered && isLotteryFull && !isWinnerPicked && <p>Lottery is full.</p>}
        {!isProcessing && isWinnerPicked && <p>Lottery has ended.</p>}
      </div>

      {/* Transaction Status/Error Messages */}
      <div className={/*classes.statusMessages*/ ""}>
        {lastTxStatus?.isConfirming && <p>Processing transaction ({lastTxAction})... Please wait.</p>}
        {lastTxStatus?.isSuccess && <Alert type="success">Transaction successful! ({lastTxAction})</Alert>}
        {errorMessage && <Alert type="error">{errorMessage} ({lastTxAction})</Alert>}
        {lastTxStatus?.hash && (
          <p style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>
            Tx Hash: {lastTxStatus.hash} {/* Add link to block explorer if needed */}
          </p>
        )}
      </div>
    </div>
  )
}
