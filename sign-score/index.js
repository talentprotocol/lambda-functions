import ethers from "ethers";

const WALLET_PK = process.env.WALLET_PK;

export const handler = async (event) => {
  try {
    const { score, passport_id } = event;

    const wallet = new ethers.Wallet(WALLET_PK);

    const numberHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [score, passport_id]
    );

    const signature = await wallet.signMessage(
      ethers.utils.arrayify(numberHash)
    );

    const responseBody = {
      statusCode: 200,
      body: {
        signature,
        passport_id,
        score,
      },
    };

    return responseBody;
  } catch (error) {
    console.log("Error");
    console.error(error);
    return {
      statusCode: 500,
      body: { error: error },
    };
  }
};

export default handler;
