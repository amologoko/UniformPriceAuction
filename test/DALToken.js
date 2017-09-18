const BigNumber = web3.BigNumber,
    DECIMALS = 18,
    DALToken = artifacts.require("./auction/DALToken.sol"),
    INITIAL_SUPPLY = new BigNumber(100000000).shift(DECIMALS)

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

contract('DALToken', function ([owner, holder]) {
    it("should create fund owner account with DAL tokens amount equal to the initial supply", async function () {
        const token = await DALToken.new()
        assert.equal((await token.totalSupply()).valueOf(), INITIAL_SUPPLY.valueOf(), "Invalid total supply");
        assert.equal((await token.balanceOf(owner)).valueOf(), INITIAL_SUPPLY.valueOf(), "Invalid initial balance")
    })

    it("should return correct balances after transfer", async function () {
        const token = await DALToken.new(),
            ownerBalanceBeforeTransfer = await token.balanceOf(owner),
            holderBalanceBforeTransfer = await token.balanceOf(holder)

        const transfer = await token.transfer(holder, 100)

        assert.equal((await token.balanceOf(owner)).valueOf(), ownerBalanceBeforeTransfer.add(- 100).valueOf())
        assert.equal((await token.balanceOf(holder)).valueOf(), holderBalanceBforeTransfer.add(100).valueOf())
    })
})