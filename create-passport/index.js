import passportContract from "./PassportABI.json" with { type: "json" };

import { createPublicClient, http, encodeFunctionData } from "viem";
import { baseSepolia, base } from "viem/chains";
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
    const environment = event.environment;
    const passports = event.passports;
    let chain = baseSepolia;
    let walletPK = process.env.SEPOLIA_WALLET_PK;

    console.log("Uploading: ", passports)

    if(environment == "mainnet") {
      console.log("Mainnet")
      chain = base;
      walletPK = process.env.WALLET_PK
    } 

    const publicClient = createPublicClient({
			transport: http(jsonRpcUrl),
		});

    console.log("Initialize adminSmartAccount");

    const adminSmartAccount = await privateKeyToSimpleSmartAccount(publicClient, {
			privateKey: walletPK,
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

    console.log("adminSmartAccount Address", adminSmartAccount.address);


    const sponsoredTransactions = passports.map((passport) => { 
      return {
        to: passportRegistryAddress,
        data: encodeFunctionData({abi: passportContract.abi, functionName: "adminCreate", args: [passport.source, passport.wallet, passport.id]}),
        value: BigInt(0)
      }
    })

    console.log("Send batch transactions");

    const txHash = await adminSmartAccountClient.sendTransactions({
      transactions: sponsoredTransactions
    })

    console.log(
      `UserOperation included: https://sepolia.basescan.org/tx/${txHash}`,
    );

    const transaction = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    console.log("transaction:", transaction);

    const responseBody = {
      statusCode: 200,
      body: {
        tx_hash: transaction.transactionHash
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