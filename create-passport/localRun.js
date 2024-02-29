//import your handler file or main file of Lambda
import { handler } from './index.js';

//Call your exports function with required params
//In AWS lambda these are event, content, and callback
//event and content are JSON object and callback is a function
//In my example i'm using empty JSON

const event = {
  "json_rpc_url": "",
  "paymaster_url": "",
  "bundler_url": "",
  "passport_registry_address": "0xC10C745a8103B5154c2F654660C1109Fa34E4825",
  "source": "farcaster"
}
handler(event, //event
    {}, //content
    function(err, payload) {
      console.log(err);
      console.log(payload);
  });