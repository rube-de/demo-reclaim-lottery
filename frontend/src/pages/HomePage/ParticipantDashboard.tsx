import { FC, useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { formatEther, zeroAddress } from 'viem'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
import { Alert } from '../../components/Alert'
import styles from './ParticipantDasboard.module.css'

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
  const queryClient = useQueryClient()
  const [lastTxStatus, setLastTxStatus] = useState<TransactionStatus | null>(null)
  const [lastTxAction, setLastTxAction] = useState<string | null>(null)

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
    })
  }

  // Refetch data on success
  useEffect(() => {
    if (lastTxStatus?.isSuccess) {
      const detailsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getLotteryDetails', undefined];
      const participantsQueryKey: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getParticipants', undefined];

      queryClient.invalidateQueries({ queryKey: detailsQueryKey });
      queryClient.invalidateQueries({ queryKey: participantsQueryKey });

      refetchLotteryDetails();
      refetchParticipantsList();
    }
  }, [lastTxStatus?.isSuccess, queryClient, refetchLotteryDetails, refetchParticipantsList, lastTxAction])

  // Combine loading/processing states
  const isProcessing = isLoadingLotteryDetails || isLoadingParticipants || lastTxStatus?.isPending || lastTxStatus?.isConfirming;

  // Determine if user can enter
  const isLotteryFull = useMemo(() => {
    if (participantCount === undefined || maxAllowedParticipants === undefined) return false;
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
    <div className={styles.dashboardContainer}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h3>Participant Dashboard</h3>
        <p>Welcome, Participant</p>
        <div className={styles.addressDisplay}>{address}</div>
      </div>
      
      {/* Status Section */}
      <div>
        <h4>Lottery Status</h4>
        <div className={styles.statusSection}>
          <div className={styles.statusIndicator}>
            <span className={currentState === 1 ? styles.statusDotActive : styles.statusDotInactive}></span>
            <strong>{lotteryStateString}</strong>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Participants</div>
              <div className={styles.statValue}>
                {participantCount?.toString() ?? '...'} / {maxAllowedParticipants?.toString() ?? '...'}
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Prize Pool</div>
              <div className={styles.statValue}>
                {currentPrize !== undefined ? formatEther(currentPrize) : '...'} ETH
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Winner Picked</div>
              <div className={styles.statValue}>
                {isWinnerPicked === undefined ? '...' : isWinnerPicked ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
          
          {/* Winner Display */}
          {isWinnerPicked && winnerAddress && winnerAddress !== zeroAddress && (
            <div className={styles.winnerCard}>
              <div className={styles.statLabel}>Winner</div>
              <div className={styles.winnerAddress}>{winnerAddress}</div>
            </div>
          )}
          
          {/* Participant Status */}
          {hasEntered && (
            <Alert type={isCurrentUserWinner ? "success" : "info"}>
              {isCurrentUserWinner ? (
                <strong className={styles.successText}>🎉 Congratulations! You won this lottery! 🎉</strong>
              ) : (
                <strong>You have entered this lottery!</strong>
              )}
            </Alert>
          )}
          
          {/* Show message if entered but did not win */}
          {isWinnerPicked && hasEntered && !isCurrentUserWinner && (
            <div className={styles.infoMessage}>Better luck next time!</div>
          )}
        </div>
      </div>
      
      {/* Actions Section */}
      <div className={styles.actionsSection}>
        <h4>Actions</h4>
        <div>
          <Button
            onClick={handleEnterLottery}
            disabled={isProcessing || !canEnter || isWinnerPicked}
            className={styles.actionButton}
          >
            {isProcessing && lastTxAction === 'enter' ? 'Processing...' : 'Enter Lottery'}
          </Button>
          
          {/* Display reasons why entry might be disabled */}
          {!isProcessing && (
            <div className={styles.infoMessage}>
              {currentState !== 1 && !isWinnerPicked && 'Lottery is not active for entry.'}
              {currentState === 1 && hasEntered && !isWinnerPicked && 'You have already entered.'}
              {currentState === 1 && !hasEntered && isLotteryFull && !isWinnerPicked && 'Lottery is full.'}
              {isWinnerPicked && 'Lottery has ended.'}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Status/Error Messages */}
      <div className={styles.statusMessages}>
        {lastTxStatus?.isConfirming && <p>Processing transaction ({lastTxAction})... Please wait.</p>}
        {lastTxStatus?.isSuccess && <Alert type="success">Transaction successful! ({lastTxAction})</Alert>}
        {errorMessage && <Alert type="error">{errorMessage} ({lastTxAction})</Alert>}
        {lastTxStatus?.hash && (
          <div className={styles.txHash}>
            Tx Hash: {lastTxStatus.hash}
          </div>
        )}
      </div>
    </div>
  )
}