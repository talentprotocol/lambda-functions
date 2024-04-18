//import your handler file or main file of Lambda
import { handler } from './index.js';

//Call your exports function with required params
//In AWS lambda these are event, content, and callback
//event and content are JSON object and callback is a function
//In my example i'm using empty JSON

const event = {
  "json_rpc_url": "https://api.developer.coinbase.com/rpc/v1/base-sepolia/Ip9cOQPtBOm81rN2I9_1rBiMXOfKBxii",
  "paymaster_url": "https://api.developer.coinbase.com/rpc/v1/base-sepolia/Ip9cOQPtBOm81rN2I9_1rBiMXOfKBxii",
  "bundler_url": "https://api.developer.coinbase.com/rpc/v1/base-sepolia/Ip9cOQPtBOm81rN2I9_1rBiMXOfKBxii",
  "passport_registry_address": "0x0fDD539a38B5ee3f077238e20d65177F3A5688Df",
  "source": "farcaster",
  "passport_id": 1003
}
handler(event, //event
    {}, //content
    function(err, payload) {
      console.log(err);
      console.log(payload);
  });