import { expect } from "chai";
import { network } from "hardhat";
import { keccak256, toUtf8Bytes, ZeroAddress } from "ethers";

const { ethers } = await network.getOrCreate();

/** Stand-in SHA-256-shaped values (32 bytes) — content doesn't matter here. */
function hash(seed: string): string {
  return keccak256(toUtf8Bytes(seed));
}

describe("RecordAnchor", function () {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("RecordAnchor");
    const contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();
    return { contract, owner, other };
  }

  it("anchors a record and emits RecordAnchored", async function () {
    const { contract, owner } = await deploy();
    const h = hash("evidence-1");

    await expect(
      contract.anchorRecord(h, "false_case_evidence", "uuid-1111")
    )
      .to.emit(contract, "RecordAnchored")
      .withArgs(
        h,
        "false_case_evidence",
        "uuid-1111",
        owner.address,
        (t: bigint) => t > 0n
      );
  });

  it("verifyRecord returns the anchored data", async function () {
    const { contract, owner } = await deploy();
    const h = hash("evidence-2");
    await contract.anchorRecord(h, "victims", "uuid-2222");

    const [exists, recordType, recordId, submitter, timestamp] =
      await contract.verifyRecord(h);

    expect(exists).to.equal(true);
    expect(recordType).to.equal("victims");
    expect(recordId).to.equal("uuid-2222");
    expect(submitter).to.equal(owner.address);
    expect(timestamp).to.be.greaterThan(0n);
  });

  it("verifyRecord reports exists=false for an unknown hash", async function () {
    const { contract } = await deploy();

    const [exists, recordType, recordId, submitter, timestamp] =
      await contract.verifyRecord(hash("never-anchored"));

    expect(exists).to.equal(false);
    expect(recordType).to.equal("");
    expect(recordId).to.equal("");
    expect(submitter).to.equal(ZeroAddress);
    expect(timestamp).to.equal(0n);
  });

  it("reverts when the same hash is anchored twice", async function () {
    const { contract } = await deploy();
    const h = hash("duplicate");
    await contract.anchorRecord(h, "victims", "uuid-3333");

    await expect(contract.anchorRecord(h, "victims", "uuid-4444"))
      .to.be.revertedWithCustomError(contract, "RecordAlreadyAnchored")
      .withArgs(h);
  });

  it("reverts when a non-owner tries to anchor", async function () {
    const { contract, other } = await deploy();

    await expect(
      contract
        .connect(other)
        .anchorRecord(hash("not-mine"), "victims", "uuid-5555")
    )
      .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("rejects empty recordType and recordId", async function () {
    const { contract } = await deploy();

    await expect(
      contract.anchorRecord(hash("empty-type"), "", "uuid-6666")
    ).to.be.revertedWithCustomError(contract, "EmptyRecordType");

    await expect(
      contract.anchorRecord(hash("empty-id"), "victims", "")
    ).to.be.revertedWithCustomError(contract, "EmptyRecordId");
  });
});
