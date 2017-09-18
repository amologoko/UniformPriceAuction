# The leagiON DAL smart contracts and tests

### Compilation, deployment. and testing using truffle + ethereumjs-testrpc

Navigate to project root directory and run `npm i` to install dependencies.

Make sure that test network configured correctly in `truffle-config.js`.

Compile smart contracts:

```
npm run compile
```

Deploy smart contracts to blockchain (this code refreshes all contracts regardless of their state):

```
npm run deploy
```

In a separate console run Ethereum TestRPC.

```
npm run testrpc
```

Run all test suits:

```
npm run test
```