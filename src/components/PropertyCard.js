// src/components/PropertyCard.js

import React from 'react';

const PropertyCard = ({ property, escrow, signer, account }) => {
  return (
    <div className="border p-4 rounded shadow-md">
      <h2 className="text-xl font-bold">Property #{property.id}</h2>
      <p>Price: {property.price} ETH</p>
      <p>Status: {property.listed ? 'Listed' : 'Not Listed'}</p>
      {/* You can add more details or buttons for investing, etc. */}
    </div>
  );
};

export default PropertyCard;
