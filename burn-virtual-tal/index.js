const { ethers } = require("ethers");
const fs = require("fs");

const WALLET_PK = process.env.WALLET_PK;

exports.handler = async (event) => {
  try {
    const userAddress = event.wallet_id;
    const amount = event.amount;
    const virtualTALAddress = event.virtual_tal_address;
    const providerUrl = event.provider_url;

    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const feeData = await provider.getFeeData();

    const rawdata = fs.readFileSync("./VirtualTAL.json");
    const abi = JSON.parse(rawdata);

		const owner = new ethers.Wallet(WALLET_PK, provider);
		const contract = new ethers.Contract(
			virtualTALAddress,
			abi.abi,
			provider
		);

    const tx = await contract.connect(owner).adminBurn(userAddress, ethers.utils.parseUnits(amount), {gasPrice: feeData.gasPrice});

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
