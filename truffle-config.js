require('babel-register')
require('babel-polyfill')

module.exports = {
    networks: {
        kovan: {
            network_id: '42',
            host: 'localhost',
            port: 8545,
            //from: '0x4a1c95d5e46edc88ffe16f373f6cb7a15c7d8b3d'
        },
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*'
        },
        coverage: {
            host: "localhost",
            network_id: "*",
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        }
    },
    mocha: {
        useColors: true
    }
}
