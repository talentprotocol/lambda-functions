import passportContract from "./PassportABI.json" with { type: "json" };

import { createPublicClient, http, getContract } from "viem";
import { baseSepolia, base } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { privateKeyToSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico";

const ENTRYPOINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const WALLET_PK = process.env.WALLET_PK;

export const handler = async (event) => {
  try {
    const jsonRpcUrl = event.json_rpc_url;
    const paymasterUrl = event.paymaster_url;
    const bundlerUrl = event.bundler_url;
    const passportRegistryAddress = event.passport_registry_address;
    const source = event.source;
    const environment = event.environment;
    const passportId = event.passport_id;
    let chain = baseSepolia;
    const primaryWallet = event.primary_wallet;

    if(environment == "mainnet") {
      chain = base;
    } 

    const publicClient = createPublicClient({
			transport: http(jsonRpcUrl),
		});

    console.log("Initialize adminSmartAccount");

    const adminSmartAccount = await privateKeyToSimpleSmartAccount(publicClient, {
			privateKey: WALLET_PK,
			entryPoint: ENTRYPOINT, // global entrypoint
			factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
		});

    console.log("Initialize paymasterClient");

    const paymasterClient = createPimlicoPaymasterClient({
      transport: http(paymasterUrl),
      entryPoint: ENTRYPOINT,
      chain,
    });
    
    console.log("Initialize adminSmartAccountClient");

    const adminSmartAccountClient = createSmartAccountClient({
      account: adminSmartAccount,
      entryPoint: ENTRYPOINT,
      chain,
      bundlerTransport: http(bundlerUrl),
      // IMPORTANT: Set up the Cloud Paymaster to sponsor your transaction
      middleware: {
        sponsorUserOperation: paymasterClient.sponsorUserOperation,
      },
    });

    console.log("Initialize Passport registry");

    const passportRegistry = getContract({
      address: passportRegistryAddress,
      abi: passportContract.abi,
      client: {
        public: publicClient,
        wallet: adminSmartAccountClient,
      },
    });

    console.log(`Call admin create for wallet: ${primaryWallet}`);

    const txHash = await passportRegistry.write.adminCreate([
      source,
      primaryWallet,
      passportId,
    ]);

    console.log(
      `UserOperation included: https://sepolia.basescan.org/tx/${txHash}`,
    );

    const transaction = await publicClient.waitForTransactionReceipt({
      confirmations: 5,
      hash: txHash,
    });

    const responseBody = {
      statusCode: 200,
      body: {
        tx_hash: transaction.hash
      }
    };

    console.log("responseBody", responseBody)

    return responseBody;
  } catch (error) {
    console.log("Error");
    console.error(error);
    return {
      statusCode: 500,
      body: { error: error}
    }
  }
};

export default handler;