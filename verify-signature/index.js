import { createPublicClient, http } from 'viem'
import * as all from 'viem/chains'
const { defineChain: _, ...chains } = all;

function getChain(chainId) {
  for (const chain of Object.values(chains)) {
    if (chain.id === chainId) {
      return chain;
    }
  }

  throw new Error(`Chain with id ${chainId} not found`);
}

export const handler = async (event) => {
  try {
    const address = event.address;
    const message = event.message;
    const signature = event.signature;
    const chainId = event.chain_id;

    const chain = getChain(chainId);

    const publicClient = createPublicClient({
      chain,
      transport: http()
    })

    const valid = await publicClient.verifyMessage({
      address,
      message,
      signature,
    })

    if(valid) {
      return { statusCode: 200, message: "Valid signature" }
    } else {
      return { statusCode: 400, message: "Invalid signature" }
    }
  } catch (error) {
    console.log("Error");
    console.error(error);
    return {
      statusCode: 500,
      message: error
    }
  }
};

export default handler;