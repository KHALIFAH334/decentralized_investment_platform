const web3 = require('@solana/web3.js');
const connection = new web3.Connection('https://api.devnet.solana.com');
const programId = new web3.PublicKey('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z');
async function run() {
  const accounts = await connection.getProgramAccounts(programId);
  console.log('Total accounts:', accounts.length);
  if (accounts.length > 0) {
    accounts.forEach(a => console.log('Account size:', a.account.data.length));
  }
}
run();
