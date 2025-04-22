// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IReclaimVerifier
 * @dev Comprehensive interface for the Reclaim contract, including structs and all public/external functions.
 */
interface IReclaimVerifier {
    // Structs copied from Claims.sol and Reclaim.sol

    struct CompleteClaimData {
        bytes32 identifier;
        address owner;
        uint32 timestampS;
        uint32 epoch;
    }

    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }

    struct SignedClaim {
        CompleteClaimData claim;
        bytes[] signatures;
    }

    struct Proof {
        ClaimInfo claimInfo;
        SignedClaim signedClaim;
    }

    struct Witness {
        address addr;
        string host;
    }

    struct Epoch {
        uint32 id;
        uint32 timestampStart;
        uint32 timestampEnd;
        Witness[] witnesses;
        uint8 minimumWitnessesForClaimCreation;
    }

    // --- Public/external functions from Reclaim.sol ---

    function getProviderFromProof(Proof memory proof) external pure returns (string memory);

    function extractFieldFromContext(
        string memory data,
        string memory target
    ) external view returns (string memory);

    function verifyProof(Proof memory proof) external returns (bool);
}
