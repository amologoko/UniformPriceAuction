module.exports = function (deployer) {
    // deployer.deploy(artifacts.require("./token/ERC20Basic.sol"))
    // deployer.deploy(artifacts.require("./token/ERC20.sol"))
    // deployer.deploy(artifacts.require("./token/BasicToken.sol"))
    // deployer.deploy(artifacts.require("./token/StandardToken.sol"))
    // deployer.deploy(artifacts.require("./math/SafeMath.sol"))
    // deployer.deploy(artifacts.require("./ownership/Ownable.sol"))
    //deployer.deploy(artifacts.require("./crowdsale/RefundVault.sol"))
    deployer.deploy(
        artifacts.require("./auction/DALToken.sol"),
        artifacts.require("./auction/DALVault.sol"),
        artifacts.require("./auction/DALAuction.sol"))
}
