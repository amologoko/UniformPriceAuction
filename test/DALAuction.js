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

contract('DALAuction', function ([owner, bidder1, bidder2]) {
    const AuctionPhase = {
        Open: 0,
        BookFrozen: 1,
        BookClosed: 2,
        Settled: 3
    }
    const VaultState = {
        Active: 0,
        Refunding: 1,
        Closed: 2
    }

    const DECIMALS = 18;
    const NAME = "leagiON Token";
    const SYMBOL = "DAL";
    const INITIAL_SUPPLY = new BigNumber(100000000).shift(DECIMALS);
    const TOKEN_RESERVE = new BigNumber(40000000).shift(DECIMALS);
    const TOKEN_GOAL = new BigNumber(60000000).shift(DECIMALS);

    before(async function () {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });

    beforeEach(async function () {
        this.startTime = latestTime();

        this.auction = await DALAuction.new(owner);
        this.vault = DALVault.at(await this.auction.vault());
        this.token = DALToken.at(await this.vault.token());

        this.ownerInitialBalance = web3.eth.getBalance(owner);
    });

    it('should create auction with correct parameters', async function () {
        this.auction.should.exist;
        this.vault.should.exist;
        this.token.should.exist;

        (await this.auction.phase()).should.be.bignumber.equal(AuctionPhase.Open);

        (await this.vault.wallet()).should.be.equal(owner);
        (await this.vault.state()).should.be.bignumber.equal(VaultState.Active);
        (await this.vault.tokensClaimed()).should.be.bignumber.equal(0);
        (await this.vault.price()).should.be.bignumber.equal(0);

        (await this.token.totalSupply()).should.be.bignumber.equal(INITIAL_SUPPLY);
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(TOKEN_RESERVE);
        (await this.token.balanceOf(this.vault.address)).should.be.bignumber.equal(TOKEN_GOAL);
    });

    it('should process bids and refunds during the auction', async function () {
        bidder1.should.exist;
        bidder2.should.exist;

        await this.auction.sendTransaction({value: ether(0.5), from: bidder1, gasPrice: 0}).should.be.fulfilled;
        await this.auction.placeBid({value: ether(1), from: bidder2}).should.be.fulfilled;
        await this.auction.getRefund({from: bidder1}).should.be.rejectedWith(EVMThrow);

        (await this.auction.depositOf(bidder1)).should.be.bignumber.equal(ether(0.5));
        (await this.auction.depositOf(bidder2)).should.be.bignumber.equal(ether(1));
        web3.eth.getBalance(this.vault.address).should.be.bignumber.equal(ether(1.5));

        await this.auction.freezeBook(1).should.be.fulfilled;
        (await this.auction.phase()).should.be.bignumber.equal(AuctionPhase.BookFrozen);
        (await this.vault.state()).should.be.bignumber.equal(VaultState.Active);
        (await this.vault.price()).should.be.bignumber.equal(1);

        await this.auction.getRefund({from: bidder1}).should.be.rejectedWith(EVMThrow);
        await this.auction.getTokens({from: bidder1}).should.be.fulfilled;
        await this.auction.getTokens({from: bidder2}).should.be.fulfilled;
        await this.auction.placeBid({value: ether(1), from: bidder2}).should.be.fulfilled;
        
        await this.auction.closeBook().should.be.fulfilled;
        (await this.auction.phase()).should.be.bignumber.equal(AuctionPhase.BookClosed);
        (await this.vault.state()).should.be.bignumber.equal(VaultState.Refunding);

        await this.auction.getTokens({from: bidder1}).should.be.rejectedWith(EVMThrow);
        await this.auction.getRefund({from: bidder2}).should.be.fulfilled;

        await this.auction.settleAuction().should.be.rejectedWith(EVMThrow);
        (await this.auction.phase()).should.be.bignumber.equal(AuctionPhase.BookClosed);
        (await this.vault.state()).should.be.bignumber.equal(VaultState.Refunding);

        await this.auction.placeBid({value: ether(1), from: bidder1}).should.be.rejectedWith(EVMThrow);
        await this.auction.sendTransaction({value: ether(1), from: bidder2, gasPrice: 0}).should.be.rejectedWith(EVMThrow);
    });

    it('should not allow freezing the book twice', async function () {
        await this.auction.freezeBook(1).should.be.fulfilled;
        await this.auction.freezeBook(1).should.be.rejectedWith(EVMThrow);
    });

    it('should reject claims that yield zero tokens', async function () {
        await this.auction.sendTransaction({value: 1, from: bidder1}).should.be.fulfilled;
        await this.auction.freezeBook(10).should.be.fulfilled;
        await this.auction.getTokens({from: bidder1}).should.be.rejectedWith(EVMThrow);
    });

    it('should not allow settlement before the book is closed', async function () {
        await this.auction.placeBid({value: ether(1), from: bidder1}).should.be.fulfilled;
        await this.auction.freezeBook(1).should.be.fulfilled;
        await this.auction.settleAuction().should.be.rejectedWith(EVMThrow);
    });

})
