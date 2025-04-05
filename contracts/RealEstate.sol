//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract RealEstate is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public totalSupply;
    mapping(uint256=>address) public tokenOwners;

    constructor() ERC721("Real Estate", "REAL") {}

    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);           //_mint(recipient,tokenId);
        _setTokenURI(newItemId, tokenURI);      //_setTokenURI will map the tokenURI with newItemId

        tokenOwners[newItemId]=msg.sender;
        totalSupply++;

        return newItemId;
    }

    receive() external payable{
        distributeRent();
    } 

    function distributeRent() public payable{
        require(totalSupply>0,"No NFTs minted");
        uint256 rentShare=msg.value/totalSupply;

        for(uint256 i=1;i<=_tokenIds.current();i++){
            if(_exists(i)){
                address owner=ownerOf(i);
                (bool sent,)=payable(owner).call{value:rentShare}("");
                require(sent,"Failed to send the rent");
            }
        }
    }

    function getTokenCount() public view returns(uint256){
        return _tokenIds.current();
    }

    function getBalance() public view returns(uint256){
        return address(this).balance;
    }
}
