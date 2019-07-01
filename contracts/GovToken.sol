pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "openzeppelin-solidity/contracts/access/roles/MinterRole.sol";

contract GovToken is ERC777("GovToken", "GTK", new address[](0)), MinterRole {

    enum Statuses { IN_ANALYSIS, APPROVED, DISAPPROVED } 

    struct FundRequest {
        uint amount;
        address addr;
        bytes32 documentHash;
        bytes32 category;
        bytes32 reason;
        Statuses status;
    }

    struct RedemptionRequest {
        uint amount;
        address addr;
        bytes32 documentHash;
        bytes32 reason;
        Statuses status;
    }

    struct LPInfo {
        uint identificationDocument;
        bytes32 ens;
        bytes32 signature;
        uint[] fundRequests;
        uint[] redemptionRequests;
    } 

    mapping(address => LPInfo) public lpsInfo;

    uint public fundRequestCount;
    mapping(uint => FundRequest) public fundRequests;

    uint public redemptionRequestCount;
    mapping(uint => RedemptionRequest) public redemptionRequests;
    address public institutionAdress;

    event AccountRegister(address _address, uint identificationDocument, bytes32 signature);

    event FundRequestSend(address _address, uint fundRequestId, bytes32 reason);
    event FundRequestApproved(address _address, uint fundRequestId, bytes32 reason);
    event FundRequestDisapproved(address _address, uint fundRequestId, bytes32 reason);

    event RedemptionRequestSend(address _address, uint fundRequestId, bytes32 reason);
    event RedemptionRequestSettle(address _address, uint fundRequestId, bytes32 reason);
    
    event Release(uint identificationDocument, uint256 value);
    event CompanyTransfer(uint fromIdentificationDocument, uint toIdentificationDocument, uint256 value);
    event Rescue(uint identificationDocument, uint256 value);

    constructor() public {
        fundRequestCount = 0;
        redemptionRequestCount = 0;
        institutionAdress = msg.sender;
    }

    //TODO: isGovernIntitution deveria pegar minters tb? Openzepellin abriu a possibilidade de adicionarmos novos minters
    function isGovernIntitution(address _addr) view public returns (bool) {
        return (_addr == institutionAdress);
    }

    // TOFO: Criar um modificador para as contas que estão disponíveis
    function isAvailableAccount(address _addr) view public returns (bool) {        
        return (!isGovernIntitution(_addr) && lpsInfo[_addr].identificationDocument == 0);       
    }

    /**************************REGISTRATION FUNCTIONS********************************/

    /** Associate a address to a identification document */
    function register(
            address addr, 
            uint _identificationDocument, 
            bytes32 ens,
            bytes32 signature
        ) public { 
        
        // Address could not be previous registered
        require(isAvailableAccount(addr), "Address could not be register twice");
        lpsInfo[addr] = LPInfo(
            _identificationDocument,
            ens,
            signature, 
            new uint[](0),
            new uint[](0)
        );
        emit AccountRegister(addr, _identificationDocument, signature);
    }

    function sendFundRequest(
            address addr,
            uint amount,
            bytes32 documentHash,
            bytes32 category,
            bytes32 reason
        ) public {
        
        require(lpsInfo[addr].identificationDocument != 0, "Address need to be registered to send funds");

        fundRequestCount += 1;
        fundRequests[fundRequestCount] = FundRequest( {
            amount: amount,
            addr: addr,
            documentHash: documentHash,
            category: category,
            reason: reason,
            status: Statuses.IN_ANALYSIS
        });
        lpsInfo[addr].fundRequests.push(fundRequestCount);

        emit FundRequestSend(addr, fundRequestCount, reason);
    }

    function sendRedemptionRequest(
            address addr,
            uint amount,
            bytes32 documentHash,
            bytes32 reason
        ) public {

        require(lpsInfo[addr].identificationDocument != 0, "Address need to be registered to send redemptions");
        require(balanceOf(addr) >= amount, "Address need to have balance to request redemption");
        // _transfer(addr, institutionAdress, amount);
        _send(addr, addr, institutionAdress, amount, "", "",true);

        redemptionRequestCount += 1;
        redemptionRequests[redemptionRequestCount] = RedemptionRequest( {
            amount: amount,
            addr: addr,
            documentHash: documentHash,
            reason: reason,
            status: Statuses.IN_ANALYSIS
        });
        lpsInfo[addr].redemptionRequests.push(redemptionRequestCount);

        emit RedemptionRequestSend(addr, redemptionRequestCount, reason);
    }
    

    function getIdentificationDocument(address _addr) public view returns (uint) {
        return lpsInfo[_addr].identificationDocument;
    }

    function getLPInfo (address _addr) 
        view public returns (
            uint, 
            bytes32,
            bytes32,
            uint[] memory,
            uint[] memory
        ) {
        return (
            lpsInfo[_addr].identificationDocument, 
            lpsInfo[_addr].ens,
            lpsInfo[_addr].signature,
            lpsInfo[_addr].fundRequests,
            lpsInfo[_addr].redemptionRequests
        );
    }

    function getFundRequest(
            uint fundRequestId
        ) view public returns ( 
            uint,
            address,
            bytes32,
            bytes32,
            bytes32,
            Statuses
        ) {
        return (
            fundRequests[fundRequestId].amount,
            fundRequests[fundRequestId].addr,
            fundRequests[fundRequestId].documentHash,
            fundRequests[fundRequestId].category,
            fundRequests[fundRequestId].reason,
            fundRequests[fundRequestId].status
        );
    }

    function getRedemptionRequest(
            uint redemptionRequestId
        ) view public returns ( 
            uint,
            address,
            bytes32,
            bytes32,
            Statuses
        ) {
        return (
            redemptionRequests[redemptionRequestId].amount,
            redemptionRequests[redemptionRequestId].addr,
            redemptionRequests[redemptionRequestId].documentHash,
            redemptionRequests[redemptionRequestId].reason,
            redemptionRequests[redemptionRequestId].status
        );
    }

    function getFundRequestCount() view public returns (uint256) {
        return fundRequestCount;
    }

    function getRedemptionRequestCount() view public returns (uint256) {
        return redemptionRequestCount;
    }

    function approveFundRequest(uint fundRequestId) public {
        require(fundRequestId <= fundRequestCount, "FundRequest not exists");
        require(fundRequests[fundRequestId].status != Statuses.DISAPPROVED, "FundRequest already disapproved");
        require(fundRequests[fundRequestId].status != Statuses.APPROVED, "FundRequest already approved");   
        fundRequests[fundRequestId].status = Statuses.APPROVED;
        // _mint(fundRequests[fundRequestId].addr, fundRequests[fundRequestId].amount);
        _mint(institutionAdress, fundRequests[fundRequestId].addr, fundRequests[fundRequestId].amount, "", "");

        emit FundRequestApproved(
            fundRequests[fundRequestId].addr,
            fundRequestId,
            fundRequests[fundRequestId].reason
        );
    }

    function disapproveFundRequest(uint fundRequestId) public {
        require(fundRequestId <= fundRequestCount, "FundRequest not exists");
        require(fundRequests[fundRequestId].status != Statuses.DISAPPROVED, "FundRequest already disapproved");
        require(fundRequests[fundRequestId].status != Statuses.APPROVED, "FundRequest already approved");
        fundRequests[fundRequestId].status = Statuses.DISAPPROVED;
        emit FundRequestDisapproved(
            fundRequests[fundRequestId].addr,
            fundRequestId,
            fundRequests[fundRequestId].reason
        );   
    }

    function settleRedemptionRequest(uint redemptionRequestId) public {
        require(redemptionRequestId <= redemptionRequestCount, "RedemptionRequest not exists");
        require(redemptionRequests[redemptionRequestId].status != Statuses.APPROVED, "RedemptionRequest already approved");
        redemptionRequests[redemptionRequestId].status = Statuses.APPROVED;
        // _burn(institutionAdress, redemptionRequests[redemptionRequestId].amount);
        _burn(institutionAdress, institutionAdress, redemptionRequests[redemptionRequestId].amount, "", "");

        emit RedemptionRequestSettle(
            redemptionRequests[redemptionRequestId].addr,
            redemptionRequestId,
            redemptionRequests[redemptionRequestId].reason
        );
    }
    
    /**************************TRANSACTION FUNCTIONS********************************/

    function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        // _mint(account, amount);
        _mint(account, account, amount, "", "");
        return true;
    }

    function transferValue(address _from, address _to, uint256 _value) public returns (bool) {
        // O cara não é louco de transferir para si mesmo!!!
        require(_from != _to, "Cannot transfer to himself");
        require(!isGovernIntitution(_from), "Cannot transfer from govern to company, should be make a fund request");
        require(!isGovernIntitution(_to),   "Cannot transfer from company to govern, should be make a redemption request");
        require(lpsInfo[_from].identificationDocument != 0, "Cannot transfer if sender is not registered");
        require(lpsInfo[_to].identificationDocument != 0, "Cannot transfer if receiver is not registered");

        emit CompanyTransfer(
            lpsInfo[_from].identificationDocument, 
            lpsInfo[_to].identificationDocument, 
            _value
        );

        // _transfer(_from, _to, _value);
        _send(_from, _from, _to, _value, "", "", true);
        return true;
    }    

}