const isMainnet = import.meta.env.VITE_POLYGON_NETWORK === 'mainnet';

export const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '';
export const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS || '';
export const WEB3_ENABLED = import.meta.env.VITE_ENABLE_WEB3 === 'true';

/** Get Polygon explorer URL for a tx hash */
export const getTxUrl = (txHash) => {
  const base = isMainnet
    ? 'https://polygonscan.com/tx/'
    : 'https://amoy.polygonscan.com/tx/';
  return `${base}${txHash}`;
};

/** Get OpenSea URL for an NFT */
export const getOpenSeaUrl = (tokenId) => {
  const address = NFT_CONTRACT_ADDRESS;
  const base = isMainnet
    ? 'https://opensea.io/assets/matic/'
    : 'https://testnets.opensea.io/assets/amoy/';
  return `${base}${address}/${tokenId}`;
};

/** Convert ipfs:// URI to a public gateway URL for display in browser */
export const ipfsToHttp = (uri) => {
  if (!uri) return '';
  return uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
};
