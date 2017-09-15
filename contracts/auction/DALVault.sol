pragma solidity ^0.4.11;

import '../math/SafeMath.sol';
import './DALToken.sol';
import '../crowdsale/RefundVault.sol';

/**
 * @title DALVault
 * @author Master-S
 */
contract DALVault is RefundVault {
  using SafeMath for uint256;

  // The token being sold
  DALToken public token;
  // maximum number of token units on sale
  uint256 public maxTokens;
  // cumulative counter of token units already claimed
  uint256 public tokensClaimed;
  
  // how many token units a bidder gets per wei
  uint256 public price;
  mapping (address => uint256) public authorized;
  mapping (address => uint256) public claimed;
  
  event DALVaultCreated(address wallet, uint256 weiAmount);
  event PriceSet(uint256 px);
  event Authorized(address beneficiary, uint256 weiAmount, uint256 tokenUnits);
  event Claimed(address beneficiary, uint256 weiAmount, uint256 tokenUnits);

  function DALVault(address _wallet, uint256 _maxTokens) 
  RefundVault(_wallet)
  {
    require(_maxTokens > 0); 
    maxTokens = _maxTokens;
    token = new DALToken();
    DALVaultCreated(_wallet, _wallet.balance);
  }

  function setPrice(uint256 _price) onlyOwner {
    require(_price > 0);
    price = _price;
    PriceSet(price);
  }

  function authorize(address _beneficiary) onlyOwner {
    require(state == State.Refunding);
    uint256 depositedValue = deposited[_beneficiary];
    require(depositedValue > 0);
    require(price > 0);
    uint256 qty = depositedValue.div(price);
    authorized[_beneficiary] = qty;
    Authorized(_beneficiary, depositedValue, qty);
  }

  function claim(address _beneficiary) {
    require(state == State.Refunding);
    require(tokensClaimed < maxTokens);
    uint256 depositedValue = deposited[_beneficiary];
    require(depositedValue > 0);
    uint256 qty = authorized[_beneficiary];
    require(qty > 0);
    deposited[_beneficiary] = 0;
    authorized[_beneficiary] = 0;
    tokensClaimed = tokensClaimed.add(qty);
    assert(token.transfer(_beneficiary, qty));
    tokensClaimed = tokensClaimed.add(qty);
    claimed[_beneficiary] = claimed[_beneficiary].add(qty);
    Claimed(_beneficiary, depositedValue, qty);
  }

  function close() onlyOwner {
    require(state == State.Refunding);
    state = State.Closed;
    wallet.transfer(this.balance);
    assert(token.transfer(wallet, token.balanceOf(this)));
    Closed();
  }
}