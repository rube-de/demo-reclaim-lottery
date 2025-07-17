import { FC, useMemo, useState, useEffect, useRef } from 'react' // Added useEffect, useRef
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { formatEther, parseEther, zeroAddress } from 'viem'
import { toast, Id as ToastId } from 'react-toastify' // Import toast and Id type
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
// Removed Alert import
import styles from './DashboardCommon.module.css'

// Removed TransactionStatus type and useTransactionState hook

export const OwnerDashboard: FC = () => {
  const queryClient = useQueryClient()

  // --- State for Inputs ---
  const [depositAmount, setDepositAmount] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null); // State to track specific pending action
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined); // State for the current transaction hash
  const currentToastId = useRef<ToastId | null>(null); // Ref to store the current toast ID

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

  // Generic hook setup - only need writeContractAsync and isPending now for button state
  const { writeContractAsync, isPending: isWritePending, reset: resetWriteContract } = useWriteContract() // Added reset

  // Function to handle common transaction logic
  const handleTransaction = async (
    functionName: string,
    _loadingMessage: string, // This will be used for the button text now
    _successMessage: string,
    errorMessagePrefix: string,
    args?: any[],
    value?: bigint
  ) => {
    // Dismiss any existing toast before starting a new one
    if (currentToastId.current) {
      toast.dismiss(currentToastId.current);
    }
    // Show initial pending toast and store its ID
    currentToastId.current = toast.loading("Submitting transaction...");
    setPendingAction(functionName); // Set the specific action being processed

    try {
      const hash = await writeContractAsync({
        address: WAGMI_CONTRACT_CONFIG.address,
        abi: WAGMI_CONTRACT_CONFIG.abi,
        functionName: functionName as any,
        args: args || [],
        value: value || 0n,
      });
      
      console.log(`Transaction submitted (${functionName}): ${hash}`);
      setCurrentTxHash(hash); // Store the hash to monitor
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
    } catch (error: any) {
      console.error(`Transaction submission error (${functionName}):`, error);
      // Update toast to show submission error
      if (currentToastId.current) {
        toast.update(currentToastId.current, { render: `${errorMessagePrefix}: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
      } else {
        // Fallback if toast ID wasn't set somehow
        toast.error(`${errorMessagePrefix}: ${error.message}`);
      }
      resetWriteContract();
      setPendingAction(null);
      setCurrentTxHash(undefined); // Clear hash on error
      currentToastId.current = null; // Clear toast ref
    }
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
      enabled: !!currentTxHash, // Only run when there's a hash
    },
  });

  // Effect to update toast based on transaction confirmation status
  useEffect(() => {
    if (!currentTxHash || !pendingAction) return; // Only run if monitoring a specific action

    const actionSuccessMessages: Record<string, string> = {
      depositPrize: 'Prize deposited successfully!',
      startLottery: 'Lottery started successfully!',
      endLottery: 'Lottery ended successfully!',
      pickWinner: 'Winner picked successfully!',
      resetLottery: 'Lottery reset successfully!',
    };
    const actionErrorMessages: Record<string, string> = {
        depositPrize: 'Deposit failed',
        startLottery: 'Failed to start lottery',
        endLottery: 'Failed to end lottery',
        pickWinner: 'Failed to pick winner',
        resetLottery: 'Failed to reset lottery',
    };

    const successMessage = actionSuccessMessages[pendingAction] || 'Transaction successful!';
    const errorMessagePrefix = actionErrorMessages[pendingAction] || 'Transaction failed';

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

      // Perform refetching *after* confirmation
      const queryKeyToInvalidate: readonly unknown[] = [WAGMI_CONTRACT_CONFIG.address, 'getLotteryDetails', undefined];
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      refetchLotteryDetails();
      console.log('Data refetch triggered on confirmation.');

      if (pendingAction === 'pickWinner' || pendingAction === 'resetLottery') {
        refetchWinnerAddress();
      }
      if (pendingAction === 'depositPrize') {
        setDepositAmount('');
      }

      // Reset state after success
      resetWriteContract();
      setPendingAction(null);
      setCurrentTxHash(undefined);
      currentToastId.current = null;

    } else if (isConfirmationError && currentToastId.current) {
      // Update toast on error
      const errorReason = confirmationError?.message || 'Unknown confirmation error'; // Use .message
      toast.update(currentToastId.current, { render: `${errorMessagePrefix}: ${errorReason}`, type: "error", isLoading: false, autoClose: 5000 });
      console.error(`Transaction confirmation error (${pendingAction}):`, confirmationError);

      // Reset state after error
      resetWriteContract();
      setPendingAction(null);
      setCurrentTxHash(undefined);
      currentToastId.current = null;
    }
  }, [isConfirming, isConfirmed, isConfirmationError, confirmationError, currentTxHash, pendingAction, queryClient, refetchLotteryDetails, refetchWinnerAddress, resetWriteContract]);


  // Specific Handlers (now just call handleTransaction)
  const handleDepositPrize = async () => {
    try {
      const amountWei = parseEther(depositAmount || '0')
      if (amountWei <= 0n) {
        toast.error("Deposit amount must be positive.");
        return;
      }
      await handleTransaction(
        'depositPrize',
        'Depositing...', // Button text during pending
        'Prize deposited successfully!',
        'Deposit failed',
        [],
        amountWei
      )
    } catch (e) {
      toast.error("Invalid deposit amount format.");
    }
  }
  const handleStartLottery = async () => await handleTransaction(
    'startLottery',
    'Starting...', // Button text during pending
    'Lottery started successfully!',
    'Failed to start lottery'
  )
  const handleEndLottery = async () => await handleTransaction(
    'endLottery',
    'Ending...', // Button text during pending
    'Lottery ended successfully!',
    'Failed to end lottery'
  )
  const handlePickWinner = async () => await handleTransaction(
    'pickWinner',
    'Picking...', // Button text during pending
    'Winner picked successfully!',
    'Failed to pick winner'
  )
  const handleResetLottery = async () => await handleTransaction(
    'resetLottery',
    'Resetting...', // Button text during pending
    'Lottery reset successfully!',
    'Failed to reset lottery'
  )

  // Removed isProcessingTx variable
  // Removed getErrorMessage function and errorMessage variable

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
              disabled={isWritePending} // Use isWritePending directly
            />
            <Button
              onClick={handleDepositPrize}
              disabled={!!currentTxHash || isWritePending || !depositAmount} // Disable if tx pending or writing or no amount
              className={styles.actionButton}
            >
              {isWritePending && pendingAction === 'depositPrize' ? 'Depositing...' : 'Deposit Prize'}
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
            <Button
              onClick={handleStartLottery}
              disabled={!!currentTxHash || isWritePending} // Disable if tx pending or writing
              className={styles.actionButton}
            >
              {isWritePending && pendingAction === 'startLottery' ? 'Starting...' : 'Start Lottery'}
            </Button>
        )}

        {/* End Lottery - Only show if Active */}
        {currentState === 1 && (
            <Button
              onClick={handleEndLottery}
              disabled={!!currentTxHash || isWritePending} // Disable if tx pending or writing
              className={styles.actionButton}
            >
              {isWritePending && pendingAction === 'endLottery' ? 'Ending...' : 'End Lottery'}
            </Button>
        )}

        {/* Pick Winner */}
          <Button
            onClick={handlePickWinner}
            // Disable if tx pending, or writing, or not Inactive, or winner already picked, or no participants, or prize is zero
            disabled={!!currentTxHash || isWritePending || currentState !== 0 || isWinnerPicked === undefined || isWinnerPicked || participantCount === 0n || currentPrize === 0n}
            className={styles.actionButton}
          >
            {isWritePending && pendingAction === 'pickWinner' ? 'Picking...' : 'Pick Winner'}
          </Button>

         {/* Reset Lottery */}
          <Button
            onClick={handleResetLottery}
            // Disable if tx pending, or writing, or winner not picked yet
            disabled={!!currentTxHash || isWritePending || isWinnerPicked === undefined || !isWinnerPicked}
            className={styles.actionButton}
          >
            {isWritePending && pendingAction === 'resetLottery' ? 'Resetting...' : 'Reset Lottery'}
          </Button>
      </div>

      {/* Transaction Status/Error Messages Section Removed */}
    </div>
  )
}
