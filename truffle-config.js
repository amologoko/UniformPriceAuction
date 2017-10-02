require('babel-register')
require('babel-polyfill')

module.exports = {
    networks: {
        kovan: {
            network_id: '42',
            host: 'localhost',
            port: 8545,
            from: '0x003bF04E2242006833C207617f9fFD1908e395d2',
            gas: 400000
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
