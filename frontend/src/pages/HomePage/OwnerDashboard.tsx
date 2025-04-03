import { FC, useMemo, useState, useEffect } from 'react' // Import useState, useEffect
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi' // Remove useQueryClient import from wagmi
import { useQueryClient } from '@tanstack/react-query' // Import useQueryClient from react-query
import { formatEther, parseEther, zeroAddress } from 'viem' // Import formatEther, parseEther, zeroAddress
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Alert } from '../../components/Alert' // Import Alert for feedback
import styles from './DashboardCommon.module.css' // Import common styles

// Helper type for transaction states
type TransactionStatus = {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
  hash?: `0x${string}`
}

// Helper hook to manage transaction state
const useTransactionState = (hash?: `0x${string}`): TransactionStatus => {
  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
    error,
  } = useWaitForTransactionReceipt({ hash })

  return {
    isPending: false, // This will be overridden by useWriteContract's isPending
    isConfirming,
    isSuccess,
    isError,
    error,
    hash,
  }
}

export const OwnerDashboard: FC = () => {
  const { address } = useAccount()
  const queryClient = useQueryClient() // Get query client instance

  // --- State for Inputs ---
  const [depositAmount, setDepositAmount] = useState('');
  const [lastTxStatus, setLastTxStatus] = useState<TransactionStatus | null>(null)
  const [lastTxAction, setLastTxAction] = useState<string | null>(null)

  // --- Read Contract Data ---
  // Fetch all lottery details in one call
  const {
    data: lotteryDetails,
    refetch: refetchLotteryDetails,
    isLoading: isLoadingLotteryDetails, // Use loading state from this hook
    isError: isErrorLotteryDetails,     // Use error state from this hook
    error: errorLotteryDetails,         // Use error object from this hook
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getLotteryDetails',
    // No args needed for this function
  }) satisfies WagmiUseReadContractReturnType<
    'getLotteryDetails',
    // Define the expected tuple structure based on Lottery.sol
    readonly [
      status: number, // LotteryStatus enum (0: Inactive, 1: Active)
      participantCount: bigint,
      currentPrize: bigint,
      maxAllowedParticipants: bigint,
      isWinnerPicked: boolean,
    ]
  >

  // Extract details from the tuple safely
  const currentState = useMemo(() => lotteryDetails?.[0], [lotteryDetails])
  const participantCount = useMemo(() => lotteryDetails?.[1], [lotteryDetails])
  const currentPrize = useMemo(() => lotteryDetails?.[2], [lotteryDetails])
  const maxAllowedParticipants = useMemo(() => lotteryDetails?.[3], [lotteryDetails])
  const isWinnerPicked = useMemo(() => lotteryDetails?.[4], [lotteryDetails])

  // Map enum state to readable string
  const lotteryStateString = useMemo(() => {
    if (isLoadingLotteryDetails) return 'Loading...'
    if (isErrorLotteryDetails) return `Error: ${errorLotteryDetails?.shortMessage || errorLotteryDetails?.message}`
    // Note: Contract enum is Inactive (0), Active (1). Adjusting case statements.
    switch (currentState) {
      case 0: return 'Inactive' // Corresponds to LotteryStatus.Inactive
      case 1: return 'Active'   // Corresponds to LotteryStatus.Active
      // The contract doesn't seem to have Calculating Winner or Complete states in the enum
      default: return 'Unknown State' // Handle undefined case during initial load
    }
  }, [currentState, isLoadingLotteryDetails, isErrorLotteryDetails, errorLotteryDetails])

  // Read Lottery Winner
  const { data: winnerAddress, refetch: refetchWinnerAddress } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'lotteryWinner', // Public getter for lotteryWinner state variable
    query: {
      // Only fetch if the winner has potentially been picked (or after reset)
      enabled: currentState === 0, // Fetch when inactive (could be before pick or after reset)
    }
  }) satisfies WagmiUseReadContractReturnType<'lotteryWinner', `0x${string}`>

  // --- Write Contract Logic ---

  // Generic hook setup
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract()
  const txStatus = useTransactionState(txHash)

  // Update lastTxStatus whenever a new transaction is initiated or its status changes
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


  // Function to handle common transaction logic
  const handleTransaction = (functionName: string, args?: any[], value?: bigint) => {
    setLastTxAction(functionName); // Track which action was initiated
    setLastTxStatus({ // Reset status for new tx
        isPending: true, isConfirming: false, isSuccess: false, isError: false, error: null
    });
    writeContract({
      ...WAGMI_CONTRACT_CONFIG,
      functionName,
      args,
      value,
    })
  }

  // Specific Handlers
  const handleDepositPrize = () => {
    try {
      const amountWei = parseEther(depositAmount || '0')
      if (amountWei <= 0n) {
        setLastTxStatus({ isPending: false, isConfirming: false, isSuccess: false, isError: true, error: new Error("Deposit amount must be positive.") });
        setLastTxAction('depositPrize');
        return;
      }
      handleTransaction('depositPrize', [], amountWei)
    } catch (e) {
        setLastTxStatus({ isPending: false, isConfirming: false, isSuccess: false, isError: true, error: new Error("Invalid deposit amount format.") });
        setLastTxAction('depositPrize');
    }
  }
  const handleStartLottery = () => handleTransaction('startLottery')
  const handleEndLottery = () => handleTransaction('endLottery')
  const handlePickWinner = () => handleTransaction('pickWinner')
  const handleResetLottery = () => handleTransaction('resetLottery')

  // Refetch data on successful transaction completion
  useEffect(() => {
    if (lastTxStatus?.isSuccess) {
      const queryKeyToInvalidate: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getLotteryDetails', undefined];
      console.log(`Transaction ${lastTxAction} succeeded. Invalidating query key:`, queryKeyToInvalidate);
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate }); // Invalidate cache
      console.log('Query invalidation called.');

      // Explicitly refetch the main details
      refetchLotteryDetails();
      console.log('Explicit refetch called for details.');

      // Also refetch winner if pickWinner or resetLottery succeeded
      if (lastTxAction === 'pickWinner' || lastTxAction === 'resetLottery') {
        refetchWinnerAddress();
        console.log('Explicit refetch called for winner.');
      }

      setDepositAmount(''); // Clear deposit input on success
      // Optionally clear status after a delay
      // setTimeout(() => setLastTxStatus(null), 5000);
    }
    // Add refetch functions and lastTxAction to dependency array
  }, [lastTxStatus?.isSuccess, queryClient, refetchLotteryDetails, refetchWinnerAddress, lastTxAction])

  // Combine all pending/loading states
  const isProcessingTx = lastTxStatus?.isPending || lastTxStatus?.isConfirming || isLoadingLotteryDetails;

  // Determine the specific error message
  const getErrorMessage = (status: TransactionStatus | null): string | null => {
    if (!status || !status.isError) return null;
    // Attempt to parse custom contract errors or show generic message
    const errorReason = (status.error as any)?.shortMessage || status.error?.message || 'Transaction failed.';
    // You might add more specific parsing here based on known custom errors
    return `Error: ${errorReason}`;
  }

  const errorMessage = getErrorMessage(lastTxStatus);

  return (
    <div className={styles.dashboardContainer}>
      {/* Welcome Section Removed */}
      <h3>Owner Dashboard</h3> {/* Keep the title */}

      {/* Display Lottery State */}
      <div className={styles.statusSection}>
        <h4>Lottery Status</h4>

        {/* Row 1: State & Participants */}
        <div className={styles.statusDisplayRow}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Current State</div>
            <div className={styles.statValue}>{lotteryStateString}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Participants</div>
            <div className={styles.statValue}>{participantCount?.toString() ?? '...'} / {maxAllowedParticipants?.toString() ?? '...'}</div>
          </div>
        </div>

        {/* Row 2: Prize Pool & Deposit Action */}
        <div className={styles.statusDisplayRow}>
           <div className={styles.statItem}>
            <div className={styles.statLabel}>Prize Pool</div>
            <div className={styles.statValue}>{currentPrize !== undefined ? formatEther(currentPrize) : '...'} ETH</div>
          </div>
          {/* Deposit action moved here */}
          <div className={styles.actionItem} style={{ flexGrow: 1 }}> {/* Allow deposit to take more space */}
            <Input
              label="Deposit Amount (ETH)"
              value={depositAmount}
              onChange={setDepositAmount}
              disabled={!!isProcessingTx}
            />
            <Button
              onClick={handleDepositPrize}
              disabled={!!isProcessingTx || !depositAmount}
              className={styles.actionButton}
            >
              {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'depositPrize' ? 'Depositing...' : 'Deposit Prize'}
            </Button>
          </div>
        </div>

        {/* Row 3: Winner (Conditional) */}
        {/* "Winner Picked" line removed */}
        {isWinnerPicked && winnerAddress && winnerAddress !== zeroAddress && (
          <div className={styles.statusDisplayRow}>
             <div className={styles.statItem}>
              <div className={styles.statLabel}>Winner</div>
              {/* Using statValue but adjusted style */}
              <div className={styles.statValue} style={{ wordBreak: 'break-all', fontSize: '1rem' }}>{winnerAddress}</div>
            </div>
          </div>
        )}
      </div>

      {/* Owner Actions (excluding Deposit) - Now in a row */}
      <div className={styles.actionsSection} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem' }}>
        {/* <h4>Other Actions</h4> Removed */}

        {/* Start Lottery - Only show if Inactive */}
        {currentState === 0 && (
          // <div className={styles.actionItem}> Removed wrapper
            <Button
              onClick={handleStartLottery}
              disabled={!!isProcessingTx} // Keep disabled check
              className={styles.actionButton} // Apply common button class if needed
            >
              {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'startLottery' ? 'Starting...' : 'Start Lottery'}
            </Button>
          // </div> Removed wrapper
        )}

        {/* End Lottery - Only show if Active */}
        {currentState === 1 && (
          // <div className={styles.actionItem}> Removed wrapper
            <Button
              onClick={handleEndLottery}
              disabled={!!isProcessingTx} // Keep disabled check
              className={styles.actionButton} // Apply common button class if needed
            >
              {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'endLottery' ? 'Ending...' : 'End Lottery'}
            </Button>
          // </div> Removed wrapper
        )}

        {/* Pick Winner */}
        {/* <div className={styles.actionItem}> Removed wrapper */}
          <Button
            onClick={handlePickWinner}
            // Disable if not Inactive, or winner already picked, or no participants, or prize is zero
            disabled={!!isProcessingTx || currentState !== 0 || isWinnerPicked === undefined || isWinnerPicked || participantCount === 0n || currentPrize === 0n}
            className={styles.actionButton} // Apply common button class if needed
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'pickWinner' ? 'Picking...' : 'Pick Winner'}
          </Button>
        {/* </div> Removed wrapper */}

         {/* Reset Lottery */}
        {/* <div className={styles.actionItem}> Removed wrapper */}
          <Button
            onClick={handleResetLottery}
            // Disable if winner not picked yet
            disabled={!!isProcessingTx || isWinnerPicked === undefined || !isWinnerPicked}
            className={styles.actionButton} // Apply common button class if needed
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'resetLottery' ? 'Resetting...' : 'Reset Lottery'}
          </Button>
        {/* </div> Removed wrapper */}
      </div>

      {/* Transaction Status/Error Messages */}
      <div className={styles.statusMessages}>
        {/* Use a simple paragraph for confirming state as Alert doesn't support info/warning */}
        {lastTxStatus?.isConfirming && <p>Processing transaction ({lastTxAction})... Please wait.</p>}
        {lastTxStatus?.isSuccess && <Alert type="success">Transaction successful! ({lastTxAction})</Alert>}
        {errorMessage && <Alert type="error">{errorMessage} ({lastTxAction})</Alert>}
        {lastTxStatus?.hash && (
          <div className={styles.txHash}> {/* Use common style for hash */}
            Tx Hash: {lastTxStatus.hash}
          </div>
        )}
      </div>
    </div>
  )
}
