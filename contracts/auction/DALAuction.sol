pragma solidity ^0.4.11;


import '../math/SafeMath.sol';
import '../ownership/Ownable.sol';
import './DALVault.sol';

/**
 * @title DALAuction
 * @author Master-S
 */
contract DALAuction is Ownable {
  using SafeMath for uint256;

  enum Phase { Open, BookFrozen, Finalized }
  //Initial Phase
  Phase public phase = Phase.Open;
  // end of auction timestamp
  uint256 public endTime;

  /**
   * Event for token bid logging
   * @param beneficiary who will get the tokens
   * @param value weis paid for purchase
   */ 
  event Bid(address beneficiary, uint256 value);

  event BookFrozen();
  event Finalized();

  // refund vault used to hold funds while crowdsale is running
  DALVault public vault;

  modifier atPhase(Phase _phase) {
    require(phase == _phase);
    _;
  }

  function nextPhase() internal {
    phase = Phase(uint(phase) + 1);
  }

  function DALAuction(address _wallet, uint256 _goal) {
    vault = new DALVault(_wallet, _goal); 
    endTime = now + 30 days;
  }

  // fallback function can be used to bid for tokens
  function () payable {
    placeBid();
  }

  // auction bid
  function placeBid() payable atPhase(Phase.Open) {
    require(msg.value != 0);  
    vault.deposit.value(msg.value)(msg.sender);
    Bid(msg.sender, msg.value);
  }

  function freezeBook() onlyOwner atPhase(Phase.Open) {
    vault.enableRefunds();
    nextPhase();
    BookFrozen();
  }

  function setCutoff(uint256 _price) onlyOwner {
    vault.setPrice(_price);
  }

  function processBid(address _beneficiary) onlyOwner {
    vault.authorize(_beneficiary);
  }

  // After the book is closed bidders can initiate refunds here
  function getRefund(address _beneficiary) atPhase(Phase.BookFrozen) {
    vault.refund(_beneficiary);
  }

  // After the book is closed bidders can claim tokens here
  function claimTokens(address _beneficiary) atPhase(Phase.BookFrozen) {
    vault.claim(_beneficiary);
  }

  /**
   * @dev Must be called after crowdsale ends, to do some extra finalization work
   */
  function finalizeAuction() onlyOwner atPhase(Phase.BookFrozen) {
    vault.close();
    nextPhase();
    Finalized();
  }

  function depositOf(address _beneficiary) constant returns (uint256 balance) {
    return vault.deposited(_beneficiary);
  }
}
