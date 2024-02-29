import passportContract from "./PassportABI.json" with { type: "json" };

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { privateKeyToSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico";

const ENTRYPOINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export const handler = async (event) => {
  try {
    const jsonRpcUrl = event.json_rpc_url;
    const paymasterUrl = event.paymaster_url;
    const bundlerUrl = event.bundler_url;
    const passportRegistryAddress = event.passport_registry_address;
    const source = event.source;
    let privateKey = event.private_key;

    if(!privateKey) {
      privateKey = generatePrivateKey();
    }
		const eoaAccount = privateKeyToAccount(privateKey);

    const eoaWallet = {
      private_key: privateKey,
      public_address: eoaAccount.address,
      wallet_type: "externally_owned_account"
    }

		const publicClient = createPublicClient({
			transport: http(jsonRpcUrl),
		});

		const smartAccount = await privateKeyToSimpleSmartAccount(publicClient, {
			privateKey,
			entryPoint: ENTRYPOINT, // global entrypoint
			factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
		});

    const scaWallet = {
      public_address: smartAccount.address,
      wallet_type: "smart_contract_account"
    }

    const paymasterClient = createPimlicoPaymasterClient({
      transport: http(paymasterUrl),
      entryPoint: ENTRYPOINT,
      chain: baseSepolia,
    });

    console.log("paymasterClient");

    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain: baseSepolia,
      bundlerTransport: http(bundlerUrl),
      // IMPORTANT: Set up the Cloud Paymaster to sponsor your transaction
      middleware: {
        sponsorUserOperation: paymasterClient.sponsorUserOperation,
      },
    });

    console.log("smartAccountClient", smartAccountClient.account);

    const callData = encodeFunctionData({
      abi: passportContract.abi,
      functionName: "create",
      args: [source],
    });

    console.log("Generated callData:", callData);

    // Send the sponsored transaction!
    const txHash = await smartAccountClient.sendTransaction({
      account: smartAccountClient.account,
      to: passportRegistryAddress,
      data: callData,
      value: BigInt(0),
    });

    console.log(
      `UserOperation included: https://sepolia.basescan.org/tx/${txHash}`,
    );

    const passportId = await publicClient.readContract({
      address: passportRegistryAddress,
      abi: passportContract.abi,
      functionName: "passportId",
      args: [smartAccount.address],
    });

    const transaction = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const txBlockNumber = transaction.blockNumber;

    const block = await publicClient.getBlock({
      blockNumber: txBlockNumber
    })

    const blockTimestamp = block?.timestamp;

    const responseBody = {
      statusCode: 200,
      body: {
        tx_hash: txHash,
        tx_timestamp: blockTimestamp.toString(),
        passport_id: passportId.toString(),
        eoa_wallet: eoaWallet,
        sca_wallet: scaWallet
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