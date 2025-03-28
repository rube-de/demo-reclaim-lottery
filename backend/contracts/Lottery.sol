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
}
