/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from 'frog'
import { handle } from 'frog/vercel'
import { neynar } from 'frog/hubs'
import { erc20Abi, parseUnits } from 'viem';


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
          width: '100%',
          height: '100%',
          fontSize: 60,
        }}
      >
       Transfer(USD)
      </div>
    ),
    intents: [
      <TextInput placeholder="Value (USDC)" />,
      <Button.Transaction target="/send-ether">Send 🐐</Button.Transaction>,
    ],
  })
})

app.frame('/finish', (c) => {
  const { transactionId} = c
  //usdc amount by logs
  // const usdAmount = parseFloat(buttonValue as string);
  // const goats = Math.floor(usdAmount / 50); 
  // const goatEmojis = '🐐'.repeat(goats);
  return c.res({
    image: (
      <div
        style={{
          color: 'white',
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center',
          fontSize: 60,
        }}
      >
        Transaction ID: {transactionId} 
        {/* <div>Equivalent(🐐) amount # : {goatEmojis}</div>  */}
      </div>
    ),
  })
})

const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; 

app.transaction('/send-ether', (c) => {
  const { inputText = '' } = c
  const recipientAddress = '0xd075caa6e58702e028d0e43cb796b73d23ab3ea5';
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
