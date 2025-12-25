# Lambda function for creating and signing BTC transactions

## Development installation

Run in terminal:
```
npm i && cp .env.sample .env
```

then update env variables. 

AWS_... variables can be skipped in case of local testing. If you want ot test real lambda, define a secret and put 
```
BTC_NETWORK=
BTC_MNEMONIC=
```

in the secret, also update `AWS_SECRET_ID` with secret name  

## Production launch:

Define a secret on AWS and put variables:

```
BTC_NETWORK=
BTC_MNEMONIC=
```
there. Then add the following: 
```
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<aws access key id>
AWS_SECRET_ACCESS_KEY=< aws secret access key>
AWS_SECRET_ID_DEV=<dev_secret_name>
AWS_SECRET_ID_PROD=<prod_secret_name>
```
on github actions secrets