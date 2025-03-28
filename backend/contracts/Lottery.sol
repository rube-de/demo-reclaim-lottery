// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Decentralized Lottery Contract
 * @dev A contract for managing a decentralized lottery system
 */
contract Lottery is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    enum LotteryStatus { Inactive, Active }

    EnumerableSet.AddressSet private participants;
    LotteryStatus public lotteryStatus;
    uint256 public maxParticipants;

    uint256 public prizeAmount;
    bool public winnerPicked;

    event ParticipantEntered(address indexed participant);
    event LotteryStarted();
    event PrizeDeposited(uint256 amount);
    event LotteryEnded();
    event WinnerPicked(address indexed winner, uint256 prizeAmount);
    event LotteryReset();

    constructor(uint256 _maxParticipants) {
        lotteryStatus = LotteryStatus.Inactive;
        maxParticipants = _maxParticipants;
    }

    /**
     * @dev Starts the lottery, allowing participants to enter
     * @notice Only callable by owner
     */
    function startLottery() external onlyOwner {
        require(lotteryStatus == LotteryStatus.Inactive, "Lottery already active");
        lotteryStatus = LotteryStatus.Active;
        emit LotteryStarted();
    }

    /**
     * @dev Allows an address to enter the lottery
     * @notice Only works when lottery is active
     * @notice Each address can only enter once
     * @notice Maximum participants is 1000
     */
    function enter() external {
        require(lotteryStatus == LotteryStatus.Active, "Lottery inactive");
        require(participants.length() < maxParticipants, "Lottery full");
        require(participants.add(msg.sender), "Already entered");
        emit ParticipantEntered(msg.sender);
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
        require(lotteryStatus == LotteryStatus.Active, "Lottery not active");
        lotteryStatus = LotteryStatus.Inactive;
        emit LotteryEnded();
    }

    /**
     * @dev Picks a random winner and transfers the prize
     * @notice Only callable by owner after lottery has ended
     * @notice Uses block.prevrandao for pseudo-randomness (not secure for production)
     */
    function pickWinner() external onlyOwner nonReentrant {
        require(lotteryStatus == LotteryStatus.Inactive, "Lottery not ended");
        require(!winnerPicked, "Winner already picked");
        require(participants.length() > 0, "No participants");

        // Get pseudo-random index (demo only - not secure for production!)
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            participants.length()
        ))) % participants.length();

        address winner = participants.at(randomIndex);
        uint256 prize = prizeAmount;

        // Reset state before transfer to prevent reentrancy
        winnerPicked = true;
        prizeAmount = 0;
        
        // Transfer prize
        (bool success, ) = winner.call{value: prize}("");
        require(success, "Transfer failed");

        emit WinnerPicked(winner, prize);
    }

    /**
     * @dev Resets the lottery for a new round
     * @notice Only callable by owner after winner is picked
     */
    function resetLottery() external onlyOwner {
        require(winnerPicked, "Winner not picked yet");
        
        // Reset all state
        while (participants.length() > 0) {
            participants.remove(participants.at(0));
        }
        lotteryStatus = LotteryStatus.Inactive;
        prizeAmount = 0;
        winnerPicked = false;
        
        emit LotteryReset();
    }

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
     * @return maxParticipants Maximum allowed participants
     * @return isWinnerPicked If winner was already selected
     */
    function getLotteryDetails() external view returns (
        LotteryStatus status,
        uint256 participantCount,
        uint256 currentPrize,
        uint256 maxParticipants,
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
}
