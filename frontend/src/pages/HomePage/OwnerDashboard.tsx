import { FC, useMemo } from 'react' // Import useMemo
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
// import classes from './index.module.css' // Assuming styles will be needed

export const OwnerDashboard: FC = () => {
  const { address } = useAccount()

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

  // --- Write Contract Logic ---
  // Example: Start Lottery
  const {
    data: startLotteryTxHash,
    writeContract: startLottery,
    isPending: isStartLotteryPending,
    // error: startLotteryError, // Add error handling
  } = useWriteContract()

  const { isLoading: isStartLotteryTxPending /*, isSuccess: isStartLotterySuccess */ } =
    useWaitForTransactionReceipt({ hash: startLotteryTxHash })

  const handleStartLottery = async () => {
    startLottery({
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'startLottery',
      // args: [], // Add args if needed
    })
    // TODO: Add success/error handling, refetch data on success
  }

  // TODO: Add write logic for depositPrize, endLottery, pickWinner, resetLottery

  // --- State for Inputs ---
  // Example: Prize Deposit Amount
  // const [depositAmount, setDepositAmount] = useState('');

  const isProcessingTx = isStartLotteryPending || isStartLotteryTxPending // Combine all pending states

  return (
    <div>
      <h3>Owner Dashboard</h3>
      <p>Welcome, Owner ({address})</p>

      {/* Display Lottery State */}
      <div>
        <h4>Lottery Status</h4>
        <p>Current State: {lotteryStateString}</p>
        <p>Participants: {participantCount?.toString() ?? '...'} / {maxAllowedParticipants?.toString() ?? '...'}</p>
        {/* TODO: Format prize properly (e.g., using viem's formatEther) */}
        <p>Prize Pool: {currentPrize?.toString() ?? '...'} WEI</p>
        <p>Winner Picked: {isWinnerPicked === undefined ? '...' : isWinnerPicked ? 'Yes' : 'No'}</p>
        {/* TODO: Display winner address if picked */}
      </div>

      {/* Owner Actions */}
      <div>
        <h4>Actions</h4>

        {/* Placeholder for Deposit Prize */}
        <div>
          {/* <Input label="Deposit Amount (WEI)" value={depositAmount} onChange={setDepositAmount} disabled={isProcessingTx || isLoadingLotteryDetails} type="number" /> */}
          {/* <Button onClick={handleDepositPrize} disabled={isProcessingTx || isLoadingLotteryDetails}>Deposit Prize</Button> */}
          <p>Deposit Prize UI Placeholder</p>
        </div>

        <Button
          onClick={handleStartLottery}
          // Disable if processing, loading details, or not in Inactive state
          disabled={isProcessingTx || isLoadingLotteryDetails || currentState !== 0}
        >
          {isProcessingTx ? 'Processing...' : 'Start Lottery'}
        </Button>

        {/* Placeholder for End Lottery */}
        <Button
          // onClick={handleEndLottery}
          // Disable if processing, loading details, or not in Active state
          disabled={isProcessingTx || isLoadingLotteryDetails || currentState !== 1}
        >
          End Lottery
        </Button>

        {/* Placeholder for Pick Winner */}
        <Button
          // onClick={handlePickWinner}
          // Disable if processing, loading details, not Inactive, or winner already picked
          disabled={isProcessingTx || isLoadingLotteryDetails || currentState !== 0 || isWinnerPicked === undefined || isWinnerPicked}
        >
          Pick Winner
        </Button>

         {/* Placeholder for Reset Lottery */}
        <Button
          // onClick={handleResetLottery}
          // Disable if processing, loading details, or winner not picked yet
          disabled={isProcessingTx || isLoadingLotteryDetails || isWinnerPicked === undefined || !isWinnerPicked}
        >
          Reset Lottery
        </Button>
      </div>

      {/* TODO: Add transaction status/error messages */}
    </div>
  )
}
