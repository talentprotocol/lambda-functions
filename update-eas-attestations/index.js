import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { Wallet } from "ethers";

const WALLET_PK = process.env.WALLET_PK;
const easContractAddress = "0x4200000000000000000000000000000000000021";
const schemaUID =
  "0x44bc7bd80aa45fcc8e4ff4bdf42fe4f0fbc450360df8d7df9f307203642a5ca9";

exports.handler = async (event) => {
  try {
    const signer = new Wallet(WALLET_PK);
    const eas = new EAS(easContractAddress);
    // Signer must be an ethers-like signer.
    eas.connect(signer);
    if (event.action === "create_attestations") {
      // Initialize SchemaEncoder with the schema string
      const schemaEncoder = new SchemaEncoder("bytes32 credential");
      const requests = [];

      for (let i = 0; i < event.credentials.length; i++) {
        const encodedData = schemaEncoder.encodeData([
          {
            name: "credential",
            value: event.credentials[i],
            type: "bytes32",
          },
        ]);
        requests.push({
          schema: schemaUID,
          data: {
            recipient: event.wallet_address,
            expirationTime: 0,
            revocable: true,
            data: encodedData,
          },
        });
      }

      const tx = await eas.multiAttest(requests);
      const uids = await tx.wait();

      return {
        statusCode: 200,
        body: {
          uids,
        },
      };
    } else if (event.action === "destroy_attestations") {
      const requests = [];

      for (let i = 0; i < event.uids.length; i++) {
        requests.push({
          schema: schemaUID,
          data: {
            uid: event.uids[i],
          },
        });
      }

      const tx = await eas.multiRevoke(event.attestations_id);
      const revokedAttestations = await tx.wait();

      return {
        statusCode: 200,
        body: {
          revokedAttestations,
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
