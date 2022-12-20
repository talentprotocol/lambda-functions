const { ethers } = require("ethers");
const fs = require("fs");

const WALLET_PK = process.env.WALLET_PK;
const NFT_ADDRESS = process.env.NFT_ADDRESS;
const PROVIDER_URL = process.env.PROVIDER_URL;

TIERS = {
  "verified": 2, // USER
  "token_holder": 5, // TOKEN_HOLDER
  "talent_token": 6, // TALENT
}

exports.handler = async (event) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

    const rawdata = fs.readFileSync("./TalentNFT.json");
    const abi = JSON.parse(rawdata);

		const owner = new ethers.Wallet(WALLET_PK, provider);
		const contract = new ethers.Contract(
			NFT_ADDRESS,
			abi.abi,
			provider
		);

    const user_address = event.wallet_id;
    const level = event.level;

    if (user_address.length > 0) {
      const balance = await contract.balanceOf(user_address);

      if (balance.toNumber() > 0) {
        const tokenId = await contract.tokenOfOwnerByIndex(user_address, 0);
        return {
          statusCode: 400,
          body: {
            errorId: 2,
            error: "User already has the NFT",
            tokenId: tokenId.toString(),
            tokenAddress: NFT_ADDRESS
          }
        }
      }

      const currentLevel = await contract.checkAccountOrCodeTier(user_address, "");

      if (currentLevel >= TIERS[level]) {
        return {
          statusCode: 200,
          body: {
            message: "User already has a higher level"
          },
        };
      }

      const feeData = await provider.getFeeData();
      const tx = await contract.connect(owner)
        .whitelistAddress(user_address, TIERS[level], {
          gasPrice: feeData.gasPrice
        }).then((b) => console.log(b));

      const receipt = await tx.wait();
      return {
        statusCode: 200,
        body: {
          tx: receipt.transactionHash,
        },
      };

    } else {
      return {
        statusCode: 400,
        body: { errorId: 1, error: "No wallet id provided" }
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: error}
    }
  }
};
