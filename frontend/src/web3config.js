// web3config.js — DEPRECATED (Web3 → Web2 migration)
// This file is intentionally left empty. All blockchain references have been removed.
// Do not import from this file.

export const NFT_CONTRACT_ADDRESS = '';
export const VAULT_CONTRACT_ADDRESS = '';
export const WEB3_ENABLED = false;

export const getTxUrl = () => '#';
export const getOpenSeaUrl = () => '#';
export const ipfsToHttp = (uri) => {
  if (!uri) return '';
  return uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
};
