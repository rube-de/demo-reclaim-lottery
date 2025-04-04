import { FC } from 'react'
import { Card } from '../../components/Card'
import classes from './index.module.css'
import { useAccount, useReadContract } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { useWeb3Auth } from '../../hooks/useWeb3Auth' // Keep useWeb3Auth as requested
import { OwnerDashboard } from './OwnerDashboard' // Import OwnerDashboard
import { ParticipantDashboard } from './ParticipantDashboard' // Import ParticipantDashboard

export const HomePage: FC = () => {
  const { address, isConnected } = useAccount()
  const {
    // state: { authInfo }, // Keep authInfo if needed by Lottery interactions
    // fetchAuthInfo, // Keep fetchAuthInfo if needed
  } = useWeb3Auth()

  // Fetch the owner of the Lottery contract
  const { data: ownerAddress, isLoading: isLoadingOwner } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'owner',
    query: {
      enabled: isConnected, // Only fetch if connected
    },
  }) satisfies WagmiUseReadContractReturnType<'owner', `0x${string}`>

  const isOwner = isConnected && address?.toLowerCase() === ownerAddress?.toLowerCase()

  // Basic loading state
  if (isConnected && isLoadingOwner) {
    return (
      <div className={classes.homePage}>
        <Card header={<h2>Lottery DApp</h2>}>
          <p>Loading owner information...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={classes.homePage}>
      <Card header={<h2>Lottery DApp</h2>}>
        {isConnected && ownerAddress && (
          <>
            {/* Conditionally render dashboards */}
            {isOwner ? <OwnerDashboard /> : <ParticipantDashboard />}
          </>
        )}
        {!address && (
          <>
            <div className={classes.connectWalletText}>
              <p>Please connect your wallet to get started.</p>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
