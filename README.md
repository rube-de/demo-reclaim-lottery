# Oasis Sapphire Lottery dApp

This is a decentralized lottery dApp built on Oasis Sapphire blockchain with Reclaim Protocol integration:

- `backend` contains the Lottery Solidity contract and Hardhat tasks for deployment and management
- `frontend` contains a React-based web application for interacting with the lottery contract

The lottery requires Twitter follower verification through Reclaim Protocol before participants can enter.

This monorepo is set up for `pnpm`. Install dependencies by running:

```sh
pnpm install
```

## Backend

Move to the `backend` folder and build smart contracts:

```sh
pnpm build
```

### Localnet deployment and Testing

Spin up the [Sapphire Localnet] image:

```shell
docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
```

Once Localnet is ready, deploy the lottery contract using the first test account:

```shell
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
npx hardhat deploy-all --network sapphire-localnet
```

This will deploy both the MockReclaimVerifier and Lottery contracts. You can also deploy them separately:

```shell
# Deploy only the mock verifier
npx hardhat deploy-mock-verifier --network sapphire-localnet

# Deploy only the lottery contract (requires verifier address)
npx hardhat deploy-lottery --network sapphire-localnet --verifier-address 0x... --max-participants 100
```

Run tests on Localnet:

```shell
npx hardhat test --network sapphire-localnet
```

### Lottery Management

Once deployed, you can manage the lottery using various tasks:

```shell
# Check lottery status
npx hardhat lottery-status --network sapphire-localnet --address 0x...

# Deposit prize (owner only)
npx hardhat lottery-deposit-prize --network sapphire-localnet --address 0x... --amount 1.0

# Start lottery (owner only)
npx hardhat lottery-start --network sapphire-localnet --address 0x...

# View participants
npx hardhat lottery-participants --network sapphire-localnet --address 0x...

# End lottery and pick winner (owner only)
npx hardhat lottery-end --network sapphire-localnet --address 0x...
npx hardhat lottery-pick-winner --network sapphire-localnet --address 0x...
```

### Production deployment

Prepare your hex-encoded private key for paying the deployment gas fee and store
it as an environment variable:

```shell
export PRIVATE_KEY=0x...
```

Alternative CMD command for Windows:

```powershell
set PRIVATE_KEY=0x...
```

To deploy the contract on Testnet or Mainnet:

```shell
npx hardhat deploy-all --network sapphire-testnet --max-participants 1000 --required-screen-name yourtwitterhandle
npx hardhat deploy-all --network sapphire --max-participants 1000 --required-screen-name yourtwitterhandle
```

[Sapphire Localnet]: https://github.com/oasisprotocol/oasis-web3-gateway/pkgs/container/sapphire-localnet

## Frontend

Once the contract is deployed, the Lottery address will be reported. Store it
inside the `frontend` folder's `.env.development` (for Localnet) or
`.env.production` (for Testnet or Mainnet - uncomment the appropriate network),
for example:

```
VITE_LOTTERY_CONTRACT_ADDR=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Run locally

Run the hot-reload version of the frontend configured in `.env.development` by
running:

```sh
pnpm dev
```

Navigate to http://localhost:5173 with your browser to view your dApp. Some
browsers (e.g. Brave) may require https connection and a CA-signed certificate
to access the wallet. In this case, read the section below on how to properly
deploy your dApp.

Note: If you use the same MetaMask accounts in your browser and restart the
sapphire-localnet docker image, don't forget to _clear your MetaMask activity_
each time to fetch correct account nonce.

### Production deployment

Build assets for deployment by running:

```sh
pnpm build
```

`dist` folder will contain the generated HTML files that can be hosted.

#### Different Website Base

If run dApp on a non-root base dir, add

```
BASE_DIR=/my/public/path
```

to `.env.production` and bundle the app with

```
pnpm build-only --base=/my/public/path/
```

Then copy the `dist` folder to a place of your `/my/public/path` location.
