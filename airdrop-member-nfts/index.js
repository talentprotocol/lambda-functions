const { ethers } = require("ethers");
const { NFTStorage, File } = require("nft.storage");
const { CeloProvider, CeloWallet } = require('@celo-tools/celo-ethers-wrapper');
const fs = require("fs");
const Axios = require('axios');
const mime = require("mime");

const WALLET_PK = process.env.WALLET_PK;
const NFT_ADDRESS = process.env.NFT_ADDRESS;
const PROVIDER_URL = process.env.PROVIDER_URL;
const TOKEN = process.env.NFT_STORAGE_TOKEN;
const SEASON = process.env.SEASON;

async function downloadImage(url, filepath) {
  const response = await Axios({
      url,
      method: 'GET',
      responseType: 'stream'
  });
  return new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(filepath))
          .on('error', reject)
          .once('close', () => resolve(filepath)); 
  });
}

async function fileFromPath(filePath) {
  const content = await fs.promises.readFile(filePath)
  const type = mime.getType(filePath)
  return new File([content], filePath.substring(5, filePath.length), { type })
}

exports.handler = async (event) => {
  try{
    const rawdata = fs.readFileSync("./CommunityMember.json");
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
        const tokenId = await contract.tokenOfOwnerByIndex(event.wallet_id, 0);
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

      const tokenId = transferEvent.args.tokenId.toNumber();

      if (event.image_url) {
        const client = new NFTStorage({ token: TOKEN });

        await downloadImage(event.image_url, `/tmp/${event.image_name}`);
        const image = await fileFromPath(`/tmp/${event.image_name}`)

        const metadata = await client.store({
          name: 'Talent Protocol Community Member NFT',
          description: 'Talent Protocol Community Member level NFT. Owners of this NFT are considered members of Talent Protocol',
          image,
          properties: {
            type: "image",
            season: SEASON,
          }
        })
  
        await contract.connect(owner).setTokenURI(tokenId, metadata.url);
      }

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
