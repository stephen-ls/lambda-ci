const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');

bitcoin.initEccLib(ecc);

const network = bitcoin.networks.testnet;

const mnemonic = bip39.generateMnemonic(128);
const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);

const root = BIP32Factory(ecc).fromSeed(new Uint8Array(seedBuffer), network);

const path = `m/84'/1'/0'/0/0`;
const keyPair = root.derivePath(path);

const signerPublicKey = Buffer.from(keyPair.publicKey);

const { address } = bitcoin.payments.p2wpkh({
  pubkey: signerPublicKey,
  network,
});

console.log({
  mnemonic,
  path,
  privateKeyWIF: keyPair.toWIF(),
  publicKeyHex: signerPublicKey.toString('hex'),
  address,
});
