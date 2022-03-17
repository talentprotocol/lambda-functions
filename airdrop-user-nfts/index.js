const { ethers } = require("ethers");
const { CeloProvider, CeloWallet } = require('@celo-tools/celo-ethers-wrapper');
const fs = require("fs");

const WALLET_PK = process.env.WALLET_PK;
const NFT_ADDRESS = process.env.NFT_ADDRESS;
const PROVIDER_URL = process.env.PROVIDER_URL;

exports.handler = async (event) => {
  try{
    const rawdata = fs.readFileSync("./CommunityUser.json");
    const abi = JSON.parse(rawdata);

    const provider = new CeloProvider(PROVIDER_URL);
    const owner = new CeloWallet(WALLET_PK, provider);
    const contract = new ethers.Contract(
      NFT_ADDRESS,
      abi.abi,
      provider
    );

    if (event.wallet_id.length > 0) {
      const balance = await contract.balanceOf(event.wallet_id);

      if (balance > 0) {
        const tokenId = contract.tokenOfOwnerByIndex(event.wallet_id, 0);
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
      const tx = await contract.connect(owner).airdrop([event.wallet_id]);
      const receipt = await tx.wait();

      const transferEvent = receipt.events?.find((e) => {
        return e.event === "Transfer";
      });

      const tokenId = transferEvent.args.tokenId.toString();

      return {
        statusCode: 200,
        body: {
          tokenId: tokenId,
          tokenAddress: NFT_ADDRESS,
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
