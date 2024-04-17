/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from 'frog'
import { handle } from 'frog/vercel'
import { neynar } from 'frog/hubs'
import { erc20Abi, parseUnits } from 'viem';
import { ethers } from 'ethers';
import { FrameRequest, getFrameHtmlResponse, getFrameMessage } from '@coinbase/onchainkit'
import axios from 'axios';

async function getTokenPrice() {
  const options = {
    method: 'GET',
    url: 'https://api.coingecko.com/api/v3/simple/token_price/base',
    params: {
      contract_addresses: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      vs_currencies: 'usd'
    },
    headers: {
      accept: 'application/json',
      'x-cg-demo-api-key': `${process.env.COINGECKO_API}`
    }
  };

  try {
    const response = await axios.request(options);
    const tokenPrice = response.data['0x4ed4e862860bed51a9570b96d89af5e1b0efefed'].usd;
    return tokenPrice;
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching token price');
  }
}

const app = new Frog({
  basePath: '/api',
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY as string}),
  verify:'silent',
})

app.frame('/', (c) => {
  return c.res({
    action: '/finish',
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/goat.jpeg`,
    imageAspectRatio:"1.91:1",
    headers:{
      'Content-Type': 'image/jpeg'
    },
    intents: [
      <TextInput placeholder="($USDC | $DEGEN)" />,
      <Button.Transaction  target={`/send-usdc`}>Send USDC 🐐</Button.Transaction>,
      <Button.Transaction   target={`/send-degen`}>Send DEGEN 🐐</Button.Transaction>,
    ]
  })
})

const recipientAddress = '0xd075caa6e58702e028d0e43cb796b73d23ab3ea5';

app.transaction('/send-usdc', (c) => {
  const { inputText = '' } = c
  return c.contract({
    // @ts-ignore
    abi:erc20Abi,
    chainId: 'eip155:8453',
    //@ts-ignore
    functionName: 'transfer',
    args: [
      // @ts-ignore
    recipientAddress,
      parseUnits(inputText, 6)
    ],
    // @ts-ignore
    to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  })
})

app.transaction('/send-degen', (c) => {
  const { inputText = '' } = c
  const degenContractAddress = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; 
  return c.contract({
    // @ts-ignore
    abi:erc20Abi,
    chainId: 'eip155:8453',
    //@ts-ignore
    functionName: 'transfer',
    args: [
      // @ts-ignore
    recipientAddress,
      parseUnits(inputText, 18)
    ],
    to: degenContractAddress,
  })
})


const fetchLatestTransferValue = async (transactionId:any, fromAddress:any, toAddress:any) => {
  try {
    const response = await axios.post(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API}`, {
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
    throw error; 
  }
};

const fetchLatestDegenTransferValue = async (transactionId:any, fromAddress:any, toAddress:any) => {
  try {
    const response = await axios.post(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API}`, {
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
            "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
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
    throw error; 
  }
};

app.frame('/finish',async (c) => {
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
       {transactionId
            ? `tnx : ${transactionId.slice(0, 4)}...${transactionId.slice(-4)}`
            : 'Transaction going through ...'}
            
      </div>

    ),
    action: `/usdc/${transactionId}`,
    intents: [<Button value="U">Your 🐐 $USDC Contributions</Button>,
             <Button value="D">Your 🐐 $DEGEN Contributions</Button>]
  })
})

let total=0;
app.frame('/usdc/:transactionId',async (c)=>{
  const { buttonValue} = c

  const id = c.req.param('transactionId')
  const body: FrameRequest = await c.req.json()
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API
  })

const wallets = message?.interactor.verified_accounts;
console.log(wallets)
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
Not connected wallet
      </div>
      )
  })
}

let goatEmoji
if (buttonValue==="U"){
let totalUsdcValue = 0;
for (const wallet of wallets) {
  try {
    const usdcValue = await fetchLatestTransferValue(id, wallet, '0xd075caa6e58702e028d0e43cb796b73d23ab3ea5');
    totalUsdcValue += usdcValue;
    total+=usdcValue;
  } catch (error:any) {
    console.error(`Error processing wallet ${wallet}:`, error.message);
  }
}

  const usdAmount = totalUsdcValue;
  const goats = Math.floor(usdAmount /50); 
 goatEmoji = '🐐'.repeat(goats);
 return c.res({
  image: (
    <div 
      style={{
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyItems: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        height: '100%',
        fontSize: 60,
      }}
    >
  <p> Thank You {goatEmoji} </p>
  <p>Total Contributions: {total}$USDC</p>
    </div>
    )
})
}

else{
  let totalDegenValue = 0;
for (const wallet of wallets) {
  try {
    const degenValue = await fetchLatestDegenTransferValue(id, wallet, '0xd075caa6e58702e028d0e43cb796b73d23ab3ea5');
    totalDegenValue += degenValue;
    total+=degenValue;
  } catch (error:any) {
    console.error(`Error processing wallet ${wallet}:`, error.message);
  }
}
  const price=await getTokenPrice();
  const usdAmount = totalDegenValue*price;
  const goats = Math.floor(usdAmount /50); 
 goatEmoji = '🐐'.repeat(goats);

 return c.res({
  image: (
    <div 
      style={{
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyItems: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        height: '100%',
        fontSize: 60,
      }}
    >
  <p> Thank You {goatEmoji} </p>
  <p>Total Contributions: {total}$DEGEN</p>
    </div>
    )
})
}


  
})



export const GET = handle(app)
export const POST = handle(app)
