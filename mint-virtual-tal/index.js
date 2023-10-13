const { ethers } = require("ethers");
const fs = require("fs");

const WALLET_PK = process.env.WALLET_PK;

exports.handler = async (event) => {
  try {
    const user_address = event.wallet_id;
    const reason = event.reason;
    const amount = event.amount;
    const virtual_tal_address = event.virtual_tal_address;
    const provider_url = event.provider_url;

    const provider = new ethers.providers.JsonRpcProvider(provider_url);

    const rawdata = fs.readFileSync("./VirtualTalABI.json");
    const abi = JSON.parse(rawdata);

		const owner = new ethers.Wallet(WALLET_PK, provider);
		const virtualTalContract = new ethers.Contract(
			virtual_tal_address,
			abi.abi,
			provider
		);


    const feeData = await provider.getFeeData();
    const tx = await virtualTalContract.connect(owner).adminMint(user_address, ethers.utils.parseUnits(amount), reason, {gasPrice: feeData.gasPrice})

    return {
      statusCode: 200,
      body: {
        tx: tx.hash,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: { error: error}
    }
  }
};
