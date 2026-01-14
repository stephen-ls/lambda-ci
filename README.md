# Lambda function for creating and signing BTC transactions

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
AWS_SECRET_ID_DEV=
AWS_SECRET_ID_PROD=
```