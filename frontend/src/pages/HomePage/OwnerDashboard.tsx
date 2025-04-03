import { FC, useMemo, useState, useEffect } from 'react' // Import useState, useEffect
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi' // Remove useQueryClient import from wagmi
import { useQueryClient } from '@tanstack/react-query' // Import useQueryClient from react-query
import { formatEther, parseEther, zeroAddress } from 'viem' // Import formatEther, parseEther, zeroAddress
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Alert } from '../../components/Alert' // Import Alert for feedback
// import classes from './index.module.css'

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
    <div className={/*classes.dashboardContainer*/ ""}> {/* Add class if needed */}
      <h3>Owner Dashboard</h3>
      <p>Welcome, Owner ({address})</p>

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
      </div>
      {/* Owner Actions */}
      <div className={/*classes.actionsSection*/ ""}>
        <h4>Actions</h4>

        {/* Deposit Prize */}
        <div className={/*classes.actionItem*/ ""}>
          <Input
            label="Deposit Amount (ETH)"
            value={depositAmount}
            // Pass the value directly to setDepositAmount
            onChange={setDepositAmount}
            disabled={!!isProcessingTx}
            // Remove unsupported props: type, placeholder, step
          />
          <Button
            onClick={handleDepositPrize}
            disabled={!!isProcessingTx || !depositAmount}
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'depositPrize' ? 'Depositing...' : 'Deposit Prize'}
          </Button>
        </div>

        {/* Start Lottery */}
        <div className={/*classes.actionItem*/ ""}>
          <Button
            onClick={handleStartLottery}
            disabled={!!isProcessingTx || currentState !== 0} // Disable if not Inactive
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'startLottery' ? 'Starting...' : 'Start Lottery'}
          </Button>
        </div>

        {/* End Lottery */}
        <div className={/*classes.actionItem*/ ""}>
          <Button
            onClick={handleEndLottery}
            disabled={!!isProcessingTx || currentState !== 1} // Disable if not Active
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'endLottery' ? 'Ending...' : 'End Lottery'}
          </Button>
        </div>

        {/* Pick Winner */}
        <div className={/*classes.actionItem*/ ""}>
          <Button
            onClick={handlePickWinner}
            // Disable if not Inactive, or winner already picked, or no participants, or prize is zero
            disabled={!!isProcessingTx || currentState !== 0 || isWinnerPicked === undefined || isWinnerPicked || participantCount === 0n || currentPrize === 0n}
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'pickWinner' ? 'Picking...' : 'Pick Winner'}
          </Button>
        </div>

         {/* Reset Lottery */}
        <div className={/*classes.actionItem*/ ""}>
          <Button
            onClick={handleResetLottery}
            // Disable if winner not picked yet
            disabled={!!isProcessingTx || isWinnerPicked === undefined || !isWinnerPicked}
          >
            {(lastTxStatus?.isPending || lastTxStatus?.isConfirming) && lastTxAction === 'resetLottery' ? 'Resetting...' : 'Reset Lottery'}
          </Button>
        </div>
      </div>

      {/* Transaction Status/Error Messages */}
      <div className={/*classes.statusMessages*/ ""}>
        {/* Use a simple paragraph for confirming state as Alert doesn't support info/warning */}
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
