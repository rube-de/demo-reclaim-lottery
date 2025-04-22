// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IReclaimVerifier} from "../interfaces/IReclaimVerifier.sol";

/**
 * @title MockReclaimVerifier
 * @dev Mock contract for testing Reclaim proof verification logic.
 * Implements the necessary interface for the Lottery contract.
 */
contract MockReclaimVerifier is IReclaimVerifier {
    bool private _shouldSucceed = true;
    // Removed _mockClaimInfo as it's no longer returned

    /**
     * @dev Sets whether the mock verification should succeed or fail (revert).
     * @param shouldSucceed True to simulate success, false to simulate failure.
     */
    function setShouldSucceed(bool shouldSucceed) external {
        _shouldSucceed = shouldSucceed;
    }

    /**
     * @dev Sets the mock claim info to be returned on successful verification.
     * @param provider The mock provider string.
     * @param parameters The mock parameters string.
     * @param context The mock context string.
     * @param claimId The mock claim ID.
     * @param timestamp The mock timestamp.
     */
    // Removed setMockClaimInfo function as it's no longer needed

    /**
     * @dev Mock implementation of the verifyProof function.
     * Reverts if _shouldSucceed is false, otherwise does nothing.
     * @param _proof The proof data (ignored in mock).
     */
    function verifyProof(
        IReclaimVerifier.Proof calldata _proof
    ) external view override returns (bool) {
        _proof; // suppress unused warning
        return _shouldSucceed;
    }

    string private _mockScreenName;
    string private _mockFollowingStatus;

    /**
     * @dev Sets the mock screen name to be returned by extractFieldFromContext.
     * @param screenName The mock Twitter handle.
     */
    function setMockScreenName(string calldata screenName) external {
        _mockScreenName = screenName;
    }

    /**
     * @dev Sets the mock following status to be returned by extractFieldFromContext.
     * @param followingStatus The mock following status ("true" or "false").
     */
    function setMockFollowingStatus(string calldata followingStatus) external {
        _mockFollowingStatus = followingStatus;
    }

    /**
     * @dev Mock implementation of extractFieldFromContext.
     * @param data The context string (ignored in mock).
     * @param target The field name to extract ("screen_name" or "following").
     * @return The mock value for the requested field.
     */
    function extractFieldFromContext(
        string memory data,
        string memory target
    ) external view override returns (string memory) {
        data; // suppress unused warning
        if (keccak256(bytes(target)) == keccak256(bytes("screen_name"))) {
            return _mockScreenName;
        } else if (keccak256(bytes(target)) == keccak256(bytes("following"))) {
            return _mockFollowingStatus;
        } else {
            return "";
        }
    }

    // --- Unimplemented functions (not part of IReclaimVerifier interface) ---
    // Removed override keyword as these are not overriding anything from IReclaimVerifier

    function addEpoch(uint256 _epoch, bytes32 _merkleRoot) external pure {
        revert("MockReclaimVerifier: addEpoch not implemented");
    }

    function getMerkleRoot(uint256 _epoch) external pure returns (bytes32) {
        revert("MockReclaimVerifier: getMerkleRoot not implemented");
    }

    function updateMinimumEpoch() external pure {
        revert("MockReclaimVerifier: updateMinimumEpoch not implemented");
    }

    function minimumEpoch() external pure returns (uint256) {
        revert("MockReclaimVerifier: minimumEpoch not implemented");
    }

    function getProviderFromProof(
        Proof memory
    ) external pure override returns (string memory) {
        return "";
    }
}
