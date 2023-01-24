const { ethers } = require("ethers");

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

exports.handler = async (event) => {
  try {
    const network = event.env == "production" ? "mainnet" : "goerli";
    const provider = new ethers.providers.EtherscanProvider(network, ETHERSCAN_API_KEY);
    const ownerAddress = await provider.resolveName(event.domain);
    return {
      statusCode: 200,
      body: {
        wallet: ownerAddress
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: error }
    }
  }
};
