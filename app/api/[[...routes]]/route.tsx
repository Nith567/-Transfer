/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from 'frog'
import { handle } from 'frog/vercel'
import { neynar } from 'frog/hubs'
import { erc20Abi, parseUnits } from 'viem';
import { ethers } from 'ethers';
import { FrameRequest, getFrameHtmlResponse, getFrameMessage } from '@coinbase/onchainkit'
import axios from 'axios';




const fetchData = async (fromAddress:any, toAddress:any) => {
  try {
    const response = await axios.post('https://base-mainnet.g.alchemy.com/v2/GDdizg674pEASxiW2RYFBA0Ievr8rdVj', {
      "id": 1,
      "jsonrpc": "2.0",
      "method": "alchemy_getAssetTransfers",
      "params": [
        {
          "fromBlock": "0x0",
          "toBlock": "latest",
          "toAddress": toAddress,
          "withMetadata": false,
          "excludeZeroValue": true,
          "maxCount": "0x3e8",
          "fromAddress": fromAddress,
          "contractAddresses": [
            "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
          ],
          "category": [
            "erc20"
          ]
        }
      ]
    });

    // Extracting latest transfer
    const latestTransfer = response.data.result.transfers[response.data.result.transfers.length - 1];

    // Displaying the latest transfer
    console.log(latestTransfer);

    return latestTransfer;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error; // Re-throw the error for handling at a higher level
  }
};

const app = new Frog({
  basePath: '/api',
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY as string}),
})

app.frame('/', (c) => {
  return c.res({
    action: '/finish',
    image: (
      <div 
        style={{
          color: 'white',
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          fontSize: 90,
        }}
      >
       Transfer(USDC)
      </div>
    ),
    intents: [
      <TextInput placeholder="Value (USDC)" />,
      <Button.Transaction target="/send-ether">Send 🐐</Button.Transaction>,
    ],
  })
})
const fetchLatestTransferValue = async (transactionId:any, fromAddress:any, toAddress:any) => {
  try {
    const response = await axios.post('https://base-mainnet.g.alchemy.com/v2/GDdizg674pEASxiW2RYFBA0Ievr8rdVj', {
      "id": 1,
      "jsonrpc": "2.0",
      "method": "alchemy_getAssetTransfers",
      "params": [
        {
          "fromBlock": "0x0",
          "toBlock": "latest",
          "toAddress": toAddress,
          "withMetadata": false,
          "excludeZeroValue": true,
          "maxCount": "0x3e8",
          "fromAddress": fromAddress,
          "contractAddresses": [
            "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
          ],
          "category": [
            "erc20"
          ]
        }
      ]
    });
    const transfer = response.data.result.transfers.find((transfer:any) => transfer.hash === transactionId);

    if (!transfer) {
      throw new Error(`Transfer with transaction ID ${transactionId} not found.`);
    }
    const value = transfer.value;
    return value;
  } catch (error:any) {
    console.error('Error fetching data:', error.message);
    throw error; // Re-throw the error for handling at a higher level
  }
};

app.frame('/finish', (c) => {
  
  const { transactionId} = c
  return c.res({
    image: (
      <div
        style={{
          color: 'white',
          display: 'flex',  
          flexDirection: 'column', 
          justifyItems: 'center',
          alignItems: 'center',
          fontSize: 60,
        }}
      >
        Transaction ID: {transactionId} 

       with using 
      </div>
    ),
    action: `/usdc/${transactionId}`,
    intents: [<Button value="transactionId">View your Goat</Button>]
  })

})


app.frame('/usdc/:transactionId',async (c)=>{
  const id = c.req.param('transactionId')
  const body: FrameRequest = await c.req.json()
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API
  })
//   const wallets = message?.interactor.verified_accounts
//   console.log("asss , hole , ",wallets)
//   const { frameData } = c
// if(!wallets){
//   console.log('error');
// }
//   // let usdc:string=await fetchLatestTransferValue(id,wallets?.map(e=>console.log(e)) , '0x7f2377647cff7f30ec8fd3af8353c8a0ab1a91c0')
//   const usdcValuesPromises = wallets?.map(async (wallet) => {
//     const usdcValue = await fetchLatestTransferValue(id, wallet, '0x7f2377647cff7f30ec8fd3af8353c8a0ab1a91c0');
//     return { wallet, usdcValue };
//   });
const wallets = message?.interactor.verified_accounts;
console.log("Wallets:", wallets); // Ensure that wallets is not undefined here
if (!wallets || wallets.length === 0) {
  return c.res({
    image: (
      <div 
        style={{
          color: 'white',
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          fontSize: 90,
        }}
      >
NO connected wallet
      </div>
      )
  })
}


let totalUsdcValue = 0;

for (const wallet of wallets) {
  try {
    const usdcValue = await fetchLatestTransferValue(id, wallet, '0xd075caa6e58702e028d0e43cb796b73d23ab3ea5');
    totalUsdcValue += usdcValue;
  } catch (error:any) {
    console.error(`Error processing wallet ${wallet}:`, error.message);
    // You can choose to continue processing other wallets or handle the error differently
  }
}

    const usdAmount = totalUsdcValue;
  const goats = Math.floor(usdAmount /50); 
  const goatEmojis = '🐐'.repeat(goats);
  console.log(totalUsdcValue)

return c.res({
  image: (
    <div 
      style={{
        color: 'white',
        display: 'flex',
        justifyItems: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        height: '100%',
        fontSize: 90,
      }}
    >
    {goatEmojis}
    </div>
    )
})
  
})


const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; 

app.transaction('/send-ether', (c) => {
  const { inputText = '' } = c
  const recipientAddress = '0x7f2377647cff7f30ec8fd3af8353c8a0ab1a91c0';

  return c.contract({
    // @ts-ignore
    abi:erc20Abi,
    chainId: 'eip155:8453',
    //@ts-ignore
    functionName: 'transfer',
    args: [
      recipientAddress, 
      parseUnits(inputText, 6)
    ],
    to: usdcContractAddress,
  })
})



export const GET = handle(app)
export const POST = handle(app)
