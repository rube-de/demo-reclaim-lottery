// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ====================================================================
// Imports
// ====================================================================
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // Corrected path for OZ v5+
import {Sapphire} from "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol"; // Import Sapphire library

/**
 * @title Decentralized Lottery Contract
 * @dev A contract for managing a decentralized lottery system
 */
contract Lottery is Ownable, ReentrancyGuard {
    // ====================================================================
    // Libraries
    // ====================================================================
    using EnumerableSet for EnumerableSet.AddressSet;

    // ====================================================================
    // Custom Errors
    // ====================================================================
    error LotteryAlreadyActive();
    error LotteryNotActive();
    error LotteryNotEnded();
    error WinnerAlreadyPicked();
    error NoParticipants();
    error TransferFailed();
    error WinnerNotPickedYet();
    error LotteryFull();
    error AlreadyEntered();
    error InvalidRandomBytesLength();

    // ====================================================================
    // Types
    // ====================================================================
    enum LotteryStatus { Inactive, Active }

    // ====================================================================
    // State Variables
    // ====================================================================
    EnumerableSet.AddressSet private participants;
    LotteryStatus public lotteryStatus;
    uint256 public maxParticipants;
    uint256 public prizeAmount;
    bool public winnerPicked;
    address public lotteryWinner; // Variable to store the winner's address

    // ====================================================================
    // Events
    // ====================================================================
    event ParticipantEntered(address indexed participant);
    event LotteryStarted();
    event PrizeDeposited(uint256 amount);
    event LotteryEnded();
    event WinnerPicked(address indexed winner, uint256 prizeAmount);
    event LotteryReset();

    // ====================================================================
    // Constructor
    // ====================================================================
    constructor(uint256 _maxParticipants) Ownable(msg.sender) {
        lotteryStatus = LotteryStatus.Inactive;
        maxParticipants = _maxParticipants;
    }

    // ====================================================================
    // External Functions - State Changing (Owner)
    // ====================================================================

    /**
     * @dev Starts the lottery, allowing participants to enter
     * @notice Only callable by owner
     */
    function startLottery() external onlyOwner {
        require(lotteryStatus == LotteryStatus.Inactive, LotteryAlreadyActive());
        lotteryStatus = LotteryStatus.Active;
        emit LotteryStarted();
    }

    /**
     * @dev Allows owner to deposit ETH as prize
     * @notice Only callable by owner
     */
    function depositPrize() external payable onlyOwner {
        prizeAmount += msg.value;
        emit PrizeDeposited(msg.value);
    }

    /**
     * @dev Ends the active lottery
     * @notice Only callable by owner
     * @notice Requires lottery to be active
     */
    function endLottery() external onlyOwner {
        require(lotteryStatus == LotteryStatus.Active, LotteryNotActive());
        lotteryStatus = LotteryStatus.Inactive;
        emit LotteryEnded();
    }

    /**
     * @dev Picks a random winner and transfers the prize
     * @notice Only callable by owner after lottery has ended
     * @notice Uses Oasis Sapphire's secure randomness precompile on Sapphire networks.
     */
    function pickWinner() external onlyOwner nonReentrant {
        require(lotteryStatus == LotteryStatus.Inactive, LotteryNotEnded());
        require(!winnerPicked, WinnerAlreadyPicked());
        uint256 participantCount = participants.length();
        require(participantCount > 0, NoParticipants());

        // Get random index using the appropriate method for the network
        uint256 randomIndex = _getRandomIndex(participantCount);

        address winner = participants.at(randomIndex);
        uint256 prize = prizeAmount;

        // Reset state before transfer to prevent reentrancy
        winnerPicked = true;
        prizeAmount = 0;
        lotteryWinner = winner; // Store the winner's address

        // Transfer prize
        (bool success, ) = winner.call{value: prize}("");
        require(success, TransferFailed());

        emit WinnerPicked(winner, prize);
    }

     /**
     * @dev Resets the lottery for a new round
     * @notice Only callable by owner after winner is picked
     */
    function resetLottery() external onlyOwner {
        require(winnerPicked, WinnerNotPickedYet());

        // Reset all state
        while (participants.length() > 0) {
            participants.remove(participants.at(0));
        }
        lotteryStatus = LotteryStatus.Inactive;
        prizeAmount = 0;
        winnerPicked = false;
        lotteryWinner = address(0); // Reset winner address

        emit LotteryReset();
    }

    // ====================================================================
    // External Functions - State Changing (Public)
    // ====================================================================

    /**
     * @dev Allows an address to enter the lottery
     * @notice Only works when lottery is active
     * @notice Each address can only enter once
     * @notice Maximum participants is enforced
     */
    function enter() external {
        require(lotteryStatus == LotteryStatus.Active, LotteryNotActive());
        require(participants.length() < maxParticipants, LotteryFull());
        require(participants.add(msg.sender), AlreadyEntered());
        emit ParticipantEntered(msg.sender);
    }

    // ====================================================================
    // External Functions - View
    // ====================================================================

    /**
     * @dev Returns array of all participant addresses
     */
    function getParticipants() external view returns (address[] memory) {
        address[] memory participantArray = new address[](participants.length());
        for (uint256 i = 0; i < participants.length(); i++) {
            participantArray[i] = participants.at(i);
        }
        return participantArray;
    }

    /**
     * @dev Returns current number of participants
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length();
    }

    /**
     * @dev Returns key lottery details in one call
     * @return status Current lottery status
     * @return participantCount Number of participants
     * @return currentPrize Total prize amount
     * @return maxAllowedParticipants Maximum allowed participants
     * @return isWinnerPicked If winner was already selected
     */
    function getLotteryDetails() external view returns (
        LotteryStatus status,
        uint256 participantCount,
        uint256 currentPrize,
        uint256 maxAllowedParticipants,
        bool isWinnerPicked
    ) {
        return (
            lotteryStatus,
            participants.length(),
            prizeAmount,
            maxParticipants,
            winnerPicked
        );
    }

    // ====================================================================
    // Internal Functions
    // ====================================================================

    /**
     * @dev Internal function to check if the current network is a Sapphire network.
     * @return true if the chain ID matches Sapphire mainnet, testnet, or localnet, false otherwise.
     */
    function _isSapphireNetwork() internal view returns (bool) {
        uint256 chainId = block.chainid;
        // Chain IDs: 0x5afe (Mainnet), 0x5aff (Testnet), 0x5afd (Localnet)
        return chainId == 0x5afe || chainId == 0x5aff || chainId == 0x5afd;
    }

    /**
     * @dev Internal function to get a random index based on the network.
     * @param participantCount The total number of participants.
     * @return A pseudo-random or secure random index within the participant range.
     */
    function _getRandomIndex(uint256 participantCount) internal view returns (uint256) {
        if (_isSapphireNetwork()) {
            // Use Sapphire secure randomness
            bytes memory randomBytes = Sapphire.randomBytes(32, bytes(""));
            require(randomBytes.length == 32, InvalidRandomBytesLength());
            uint256 randomValue = uint256(abi.decode(randomBytes, (bytes32)));
            return randomValue % participantCount;
        } else {
            // Use insecure pseudo-randomness for non-Sapphire networks (e.g., Hardhat local)
            // Note: block.prevrandao replaced difficulty post-Merge
            return uint256(keccak256(abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                participantCount // Use participantCount for more variability
            ))) % participantCount;
        }
    }
}
