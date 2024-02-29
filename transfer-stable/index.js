const { ethers } = require("ethers");
const fs = require("fs");

const WALLET_PK = process.env.WALLET_PK;

exports.handler = async (event) => {
  try {
    const userAddress = event.wallet;
    const amount = event.amount;
    const stableAddress = event.stable_address;
    const providerUrl = event.provider_url;
    const decimals = event.decimals;

    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const feeData = await provider.getFeeData();

    const rawdata = fs.readFileSync("./StableToken.json");
    const abi = JSON.parse(rawdata);

		const owner = new ethers.Wallet(WALLET_PK, provider);
		const stableContract = new ethers.Contract(
			stableAddress,
			abi.abi,
			provider
		);

    const tx = await stableContract.connect(owner).transfer(userAddress, ethers.utils.parseUnits(amount, decimals), {gasPrice: feeData.gasPrice?.mul(120).div(100)});

    return {
      statusCode: 200,
      body: { tx: tx.hash }
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: { error: error}
    }
  }
};
