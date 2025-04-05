// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

/// @title Escrow Contract for Fractional Real Estate Investment via ERC721
contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector allowed");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller allowed");
        _;
    }

    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    struct FractionalBuyer {
        uint256 contribution; // in wei
        uint256 share; // percentage in basis points (e.g. 1000 = 10%)
    }

    struct Listing {
        bool isListed;
        uint256 nftID;
        uint256 purchasePrice;
        uint256 escrowRequired;
        bool inspectionPassed;
        bool finalized;
        mapping(address => FractionalBuyer) buyers;
        address[] buyerAddresses;
        mapping(address => bool) approvals;
    }

    mapping(uint256 => Listing) public listings;

    // ---------- Listing Setup ----------
    function listProperty(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowRequired
    ) external onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        Listing storage listing = listings[_nftID];
        listing.isListed = true;
        listing.nftID = _nftID;
        listing.purchasePrice = _purchasePrice;
        listing.escrowRequired = _escrowRequired;
    }

    // ---------- Fractional Investment ----------
    function investInProperty(uint256 _nftID) external payable {
        Listing storage listing = listings[_nftID];
        require(listing.isListed, "Not listed");
        require(!listing.finalized, "Already finalized");

        FractionalBuyer storage investor = listing.buyers[msg.sender];

        investor.contribution += msg.value;
        investor.share = (investor.contribution * 10000) / listing.purchasePrice;

        // Track new investor address
        if (investor.share == (msg.value * 10000) / listing.purchasePrice) {
            listing.buyerAddresses.push(msg.sender);
        }
    }

    // ---------- Approval & Inspection ----------
    function updateInspection(uint256 _nftID, bool _passed) external onlyInspector {
        listings[_nftID].inspectionPassed = _passed;
    }

    function approveSale(uint256 _nftID) external {
        listings[_nftID].approvals[msg.sender] = true;
    }

    function allApprovalsReceived(uint256 _nftID) public view returns (bool) {
        Listing storage listing = listings[_nftID];

        if (!listing.approvals[seller] || !listing.approvals[lender]) {
            return false;
        }

        for (uint256 i = 0; i < listing.buyerAddresses.length; i++) {
            if (!listing.approvals[listing.buyerAddresses[i]]) {
                return false;
            }
        }

        return true;
    }

    // ---------- Finalize ----------
    function finalizeSale(uint256 _nftID) external {
        Listing storage listing = listings[_nftID];

        require(listing.inspectionPassed, "Inspection failed");
        require(allApprovalsReceived(_nftID), "Not all parties approved");
        require(address(this).balance >= listing.purchasePrice, "Insufficient balance");

        listing.finalized = true;

        // Pay the seller
        (bool success,) = seller.call{value: listing.purchasePrice}("");
        require(success, "Payment to seller failed");
    }

    // ---------- Rental Distribution ----------
    function distributeRentalIncome(uint256 _nftID) external payable {
        Listing storage listing = listings[_nftID];
        require(listing.finalized, "Sale not finalized");

        for (uint256 i = 0; i < listing.buyerAddresses.length; i++) {
            address investor = listing.buyerAddresses[i];
            uint256 shareAmount = (msg.value * listing.buyers[investor].share) / 10000;
            payable(investor).transfer(shareAmount);
        }
    }

    // ---------- Emergency ----------
    function cancelSale(uint256 _nftID) external {
        Listing storage listing = listings[_nftID];
        require(!listing.finalized, "Already finalized");

        for (uint256 i = 0; i < listing.buyerAddresses.length; i++) {
            address investor = listing.buyerAddresses[i];
            payable(investor).transfer(listing.buyers[investor].contribution);
        }

        listing.isListed = false;
        IERC721(nftAddress).transferFrom(address(this), seller, _nftID);
    }

    // ---------- Utility ----------
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getBuyerContribution(uint256 _nftID, address _buyer) external view returns (uint256, uint256) {
    Listing storage listing = listings[_nftID];
    FractionalBuyer storage buyer = listing.buyers[_buyer];
    return (buyer.contribution, buyer.share);
}


}