// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RecordAnchor
 * @notice Anchors tamper-evidence fingerprints for July Ledger records onto a
 *         public chain. Only the SHA-256 hash of a file/record is stored — never
 *         personal data, never the file itself. Anyone can independently verify
 *         that a given file matches what was anchored, and neither this
 *         organisation nor anyone else can silently alter the record afterwards.
 *
 * @dev Writes are `onlyOwner` (the backend's deployer wallet). This is
 *      deliberate: these records represent *this* organisation's verified data,
 *      so third parties must not be able to spam entries that would appear to
 *      carry the same provenance. Reads are open to everybody.
 */
contract RecordAnchor is Ownable {
    struct Record {
        string recordType; // e.g. "false_case_evidence", "victims"
        string recordId; // the Postgres UUID of the row this anchors
        address submitter; // who anchored it (the backend wallet)
        uint256 timestamp; // block time of anchoring
        bool exists;
    }

    /// @notice sha256 hash => anchored record
    mapping(bytes32 => Record) private records;

    /// @notice Emitted once per successfully anchored record.
    event RecordAnchored(
        bytes32 indexed sha256Hash,
        string recordType,
        string recordId,
        address indexed submitter,
        uint256 timestamp
    );

    error RecordAlreadyAnchored(bytes32 sha256Hash);
    error EmptyRecordType();
    error EmptyRecordId();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Anchor a record's SHA-256 fingerprint on-chain.
     * @param sha256Hash SHA-256 of the original file/record bytes.
     * @param recordType Which table/kind of record this is.
     * @param recordId The Postgres UUID identifying the row.
     */
    function anchorRecord(
        bytes32 sha256Hash,
        string calldata recordType,
        string calldata recordId
    ) external onlyOwner {
        if (records[sha256Hash].exists) {
            revert RecordAlreadyAnchored(sha256Hash);
        }
        if (bytes(recordType).length == 0) revert EmptyRecordType();
        if (bytes(recordId).length == 0) revert EmptyRecordId();

        records[sha256Hash] = Record({
            recordType: recordType,
            recordId: recordId,
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit RecordAnchored(
            sha256Hash,
            recordType,
            recordId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Look up an anchored record. Open to anyone — this is the whole
     *         point of anchoring: independent public verifiability.
     * @return exists Whether anything has been anchored under this hash.
     */
    function verifyRecord(
        bytes32 sha256Hash
    )
        external
        view
        returns (
            bool exists,
            string memory recordType,
            string memory recordId,
            address submitter,
            uint256 timestamp
        )
    {
        Record storage record = records[sha256Hash];
        return (
            record.exists,
            record.recordType,
            record.recordId,
            record.submitter,
            record.timestamp
        );
    }
}
