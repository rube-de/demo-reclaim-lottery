import { FC, useEffect, useMemo, useState } from 'react' // Import useMemo
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { Button } from '../../components/Button'
// import classes from './index.module.css' // Assuming styles will be needed

export const ParticipantDashboard: FC = () => {
  const { address } = useAccount()
  const [hasEntered, setHasEntered] = useState(false) // State to track if user has entered

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
    // No args needed
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
  // TODO: Use other details like participantCount, currentPrize etc. in the UI

  // Map enum state to readable string
  const lotteryStateString = useMemo(() => {
    if (isLoadingLotteryDetails) return 'Loading...'
    if (isErrorLotteryDetails) return `Error: ${errorLotteryDetails?.shortMessage || errorLotteryDetails?.message}`
    // Note: Contract enum is Inactive (0), Active (1). Adjusting case statements.
    switch (currentState) {
      case 0: return 'Inactive' // Corresponds to LotteryStatus.Inactive
      case 1: return 'Active'   // Corresponds to LotteryStatus.Active
      default: return 'Unknown State' // Handle undefined case during initial load
    }
  }, [currentState, isLoadingLotteryDetails, isErrorLotteryDetails, errorLotteryDetails])

  // Check if the current user is a participant
  // Note: This might need adjustment based on how participants are stored/checked in the contract.
  // If it's just a mapping `mapping(address => bool) public participants;`, this works.
  // If it's EnumerableSet, we might need a different approach or a dedicated view function.
  const { data: isParticipant, refetch: refetchIsParticipant } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'participants', // Assuming a mapping check
    args: [address!], // Pass user's address
    query: {
      enabled: !!address, // Only run if address is available
    },
  }) satisfies WagmiUseReadContractReturnType<'participants', boolean, [`0x${string}`]>

  useEffect(() => {
    if (isParticipant !== undefined) {
      setHasEntered(isParticipant)
    }
  }, [isParticipant])

  // TODO: Add reads for prize, participant count, winner, etc.

  // --- Write Contract Logic ---
  // Example: Enter Lottery
  const {
    data: enterLotteryTxHash,
    writeContract: enterLottery,
    isPending: isEnterLotteryPending,
    // error: enterLotteryError, // Add error handling
  } = useWriteContract()

  const { isLoading: isEnterLotteryTxPending /*, isSuccess: isEnterLotterySuccess */ } =
    useWaitForTransactionReceipt({ hash: enterLotteryTxHash })

  const handleEnterLottery = async () => {
    enterLottery({
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'enter',
      // args: [], // Add args if needed
      // value: parseEther('0.01') // Add value if entry fee is required
    })
    // TODO: Add success/error handling, refetch data on success (especially isParticipant)
  }

  const isProcessingTx = isEnterLotteryPending || isEnterLotteryTxPending

  // Determine if user can enter
  const canEnter = currentState === 1 && !hasEntered // Still assuming 1 is Active state

  return (
    <div>
      <h3>Participant Dashboard</h3>
      <p>Welcome, Participant ({address})</p>

      {/* Display Lottery State */}
      <div>
        <h4>Lottery Status</h4>
        <p>Current State: {lotteryStateString}</p>
        {/* TODO: Display prize, participants, winner etc. */}
        {hasEntered && <p>You have entered this lottery!</p>}
      </div>

      {/* Participant Actions */}
      <div>
        <h4>Actions</h4>
        <Button
          onClick={handleEnterLottery}
          // Disable if processing, loading details, or cannot enter
          disabled={isProcessingTx || isLoadingLotteryDetails || !canEnter}
        >
          {isProcessingTx ? 'Processing...' : 'Enter Lottery'}
        </Button>
        {/* Display messages based on loading state and contract state */}
        {!canEnter && !isLoadingLotteryDetails && currentState !== 1 && <p>Lottery is not active for entry.</p>}
        {!canEnter && !isLoadingLotteryDetails && currentState === 1 && hasEntered && <p>You have already entered.</p>}
      </div>

      {/* TODO: Add transaction status/error messages */}
    </div>
  )
}
