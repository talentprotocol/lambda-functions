import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { Wallet } from "ethers";

const WALLET_PK = process.env.WALLET_PK;
const easContractAddress = "0x4200000000000000000000000000000000000021";
const schemaUID =
  "0x44bc7bd80aa45fcc8e4ff4bdf42fe4f0fbc450360df8d7df9f307203642a5ca9";

exports.handler = async (event) => {
  try {
    if (event.wallet_id.length > 0) {
      const signer = new Wallet(WALLET_PK);
      const eas = new EAS(easContractAddress);
      // Signer must be an ethers-like signer.
      eas.connect(signer);
      // Initialize SchemaEncoder with the schema string
      const schemaEncoder = new SchemaEncoder("bytes32 credential");
      const requests = [];

      for (let i = 0; i < event.credentials_id.length; i++) {
        const encodedData = schemaEncoder.encodeData([
          {
            name: "credential",
            value: event.credentials_id[i],
            type: "bytes32",
          },
        ]);
        requests.push({
          schema: schemaUID,
          data: {
            recipient: event.wallet_id,
            expirationTime: 0,
            revocable: true,
            data: encodedData,
          },
        });
      }

      const tx = await eas.multiAttest(requests);
      const newAttestationsUID = await tx.wait();

      return {
        statusCode: 200,
        body: {
          newAttestationsUID,
        },
      };
    } else {
      return {
        statusCode: 400,
        body: { errorId: 1, error: "No wallet id provided" },
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: error },
    };
  }
};
