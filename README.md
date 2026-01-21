# Lambda function for creating and signing transactions

## Installation and launch

Run in terminal:
```
npm i
```

Then define a secret on AWS and put variables:
```
BTC_NETWORK=
BTC_MNEMONIC=
```

Then add the following to env:
```
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SECRET_ID=
```

For github actions define 2 secrets separately instead of `AWS_SECRET_ID`:
```
AWS_BTC_SECRET_ID_DEV=
AWS_BTC_SECRET_ID_PROD=
```

## Testing

For testing define also in env:
```
BTC_MNEMONIC=
```
with some test wallet mnemonic

For github actions define instead:
```
BTC_MNEMONIC_TEST=
AWS_SECRET_ID_TEST=
```