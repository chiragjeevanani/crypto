import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

// ClaimNFTPage is deprecated in Web2 migration.
// Buying now happens on the NFT detail page directly.
// This stub redirects old URLs to the correct detail page.
const ClaimNFTPage = () => {
  const { auctionId } = useParams();
  return <Navigate to={`/nfts/${auctionId}`} replace />;
};

export default ClaimNFTPage;
