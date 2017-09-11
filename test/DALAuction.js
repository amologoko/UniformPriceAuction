import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const DALAuction = artifacts.require('DALAuction');
const DALVault = artifacts.require('DALVault');
const DALToken = artifacts.require('DALToken');

contract('DALAuction', function ([owner, purchaser, beneficiary]) {
  const AuctionPhase = {
      Open: 0,
      BookFrozen: 1,
      Finalized: 2 
  }
  const VaultState = {
      Active: 0,
      Refunding: 1,
      Closed: 2
  }
  
  const DECIMALS = 18;
  const GOAL = new BigNumber(50000000).shift(DECIMALS);
  const NAME = "leagiON Token";
  const SYMBOL = "DAL";
  const INITIAL_SUPPLY = new BigNumber(100000000).shift(DECIMALS);
  //const CAP  = ether(20);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime();
    this.endTime = this.startTime + duration.days(30);
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.auction = await DALAuction.new(owner, GOAL);
    this.vault = DALVault.at(await this.auction.vault());
    this.token = DALToken.at(await this.vault.token());
  });

  
  it('should create auction with correct parameters', async function () {
    this.auction.should.exist;
    this.vault.should.exist;
    this.token.should.exist;

    (await this.auction.phase()).should.be.bignumber.equal(AuctionPhase.Open);
    (await this.auction.endTime()).should.be.bignumber.least(this.endTime);

    (await this.vault.wallet()).should.be.equal(owner);
    (await this.vault.state()).should.be.bignumber.equal(VaultState.Active);
    (await this.vault.maxTokens()).should.be.bignumber.equal(GOAL);
    (await this.vault.tokensClaimed()).should.be.bignumber.equal(0);
    (await this.vault.price()).should.be.bignumber.equal(0);

    (await this.token.totalSupply()).should.be.bignumber.equal(INITIAL_SUPPLY);
    (await this.token.balanceOf(this.vault.address)).should.be.bignumber.equal(INITIAL_SUPPLY);
  });

  it('should process bids during the auction', async function () {

    await this.auction.placeBid({value: ether(1), from: beneficiary}).should.be.fulfilled;
    await this.auction.sendTransaction({value: ether(0.5), from: purchaser, gasPrice: 0}).should.be.fulfilled;

    (await this.auction.depositOf(beneficiary)).should.be.bignumber.equal(ether(1));
    (await this.auction.depositOf(purchaser)).should.be.bignumber.equal(ether(0.5));
    web3.eth.getBalance(this.vault.address).should.be.bignumber.equal(ether(1.5));

    await this.auction.freezeBook().should.be.fulfilled;
    (await this.auction.phase()).should.be.bignumber.equal(AuctionPhase.BookFrozen);
    (await this.vault.state()).should.be.bignumber.equal(VaultState.Refunding);

    await this.auction.setCutoff(1).should.be.fulfilled;
    (await this.vault.price()).should.be.bignumber.equal(1);

    await this.auction.processBid(beneficiary).should.be.fulfilled;
    await this.auction.processBid(purchaser).should.be.fulfilled;
    //await this.auction.processRefund(beneficiary).should.be.fulfilled;
    //await this.auction.processRefund(purchaser).should.be.fulfilled;
    await this.auction.claimTokens(beneficiary).should.be.fulfilled;
    await this.auction.claimTokens(purchaser, {from: purchaser}).should.be.fulfilled;
    await increaseTimeTo(this.afterEndTime);
    await this.auction.finalizeAuction().should.be.fulfilled;
    (await this.auction.depositOf(beneficiary)).should.be.bignumber.equal(0);
    (await this.auction.depositOf(purchaser)).should.be.bignumber.equal(0);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(ether(1));
    (await this.token.balanceOf(purchaser)).should.be.bignumber.equal(ether(0.5));
    (await this.token.balanceOf(this.vault.address)).should.be.bignumber.equal(INITIAL_SUPPLY.sub(ether(1.5)));
  });

});
