import * as hive from '@hiveio/hive-js';
import { PrivateKey, Signature, hash } from '@hiveio/hive-js/lib/auth/ecc';
import { transaction } from '@hiveio/hive-js/lib/auth/serializer/src/operations';
import applyHiveChainConfig from './HiveChainConfig';

const MAINNET_CHAIN_ID = 'beeab0de00000000000000000000000000000000000000000000000000000000';
const MIRRORNET_CHAIN_ID = '4200000000000000000000000000000000000000000000000000000000000000';

const signingKey = PrivateKey.fromSeed('hive-chain-config-test');
const fixedTransaction = () => ({
    ref_block_num: 1234,
    ref_block_prefix: 56789,
    expiration: '2026-11-04T12:00:00',
    operations: [
        [
            'transfer',
            {
                from: 'alice',
                to: 'bob',
                amount: '1.000 HIVE',
                memo: '',
            },
        ],
    ],
    extensions: [],
});

function digestFor(chainId, trx) {
    return hash.sha256(Buffer.concat([Buffer.from(chainId, 'hex'), transaction.toBuffer(trx)]));
}

function signWithChain(chain) {
    applyHiveChainConfig(hive.config, chain);
    const signed = hive.auth.signTransaction(fixedTransaction(), [signingKey.toWif()]);
    return Signature.fromBuffer(Buffer.from(signed.signatures[0], 'hex'));
}

function loadConfig(env) {
    const saved = { ...process.env };
    Object.assign(process.env, env);
    jest.resetModules();
    const config = require('config');
    process.env = saved;
    return config;
}

describe('applyHiveChainConfig', () => {
    const original = {
        address_prefix: hive.config.get('address_prefix'),
        chain_id: hive.config.get('chain_id'),
    };
    afterEach(() => {
        hive.config.set('address_prefix', original.address_prefix);
        hive.config.set('chain_id', original.chain_id);
    });

    it('defaults to the chain id hive-js shipped with', () => {
        const config = loadConfig({});
        expect(config.get('chain_id')).toBe(MAINNET_CHAIN_ID);
        expect(original.chain_id).toBe(MAINNET_CHAIN_ID);
    });

    it('reads the chain id and address prefix from SDC_CHAIN_ID and SDC_ADDRESS_PREFIX', () => {
        const config = loadConfig({ SDC_CHAIN_ID: MIRRORNET_CHAIN_ID, SDC_ADDRESS_PREFIX: 'TST' });
        expect(config.get('chain_id')).toBe(MIRRORNET_CHAIN_ID);
        expect(config.get('address_prefix')).toBe('TST');
    });

    it('sets address_prefix and chain_id on the hive-js config', () => {
        applyHiveChainConfig(hive.config, { address_prefix: 'TST', chain_id: MIRRORNET_CHAIN_ID });
        expect(hive.config.get('address_prefix')).toBe('TST');
        expect(hive.config.get('chain_id')).toBe(MIRRORNET_CHAIN_ID);
    });

    it('signs for the mainnet chain id under the default config', () => {
        const config = loadConfig({});
        const sig = signWithChain({ address_prefix: config.get('address_prefix'), chain_id: config.get('chain_id') });
        const publicKey = signingKey.toPublicKey();
        expect(sig.verifyHash(digestFor(MAINNET_CHAIN_ID, fixedTransaction()), publicKey)).toBe(true);
    });

    it('signs for the configured mirrornet chain id and not for mainnet', () => {
        const config = loadConfig({ SDC_CHAIN_ID: MIRRORNET_CHAIN_ID, SDC_ADDRESS_PREFIX: 'STM' });
        const sig = signWithChain({ address_prefix: config.get('address_prefix'), chain_id: config.get('chain_id') });
        const publicKey = signingKey.toPublicKey();
        expect(sig.verifyHash(digestFor(MIRRORNET_CHAIN_ID, fixedTransaction()), publicKey)).toBe(true);
        expect(sig.verifyHash(digestFor(MAINNET_CHAIN_ID, fixedTransaction()), publicKey)).toBe(false);
    });

    it.each([[undefined], [''], ['beeab0de'], ['zz'.repeat(32)]])('rejects chain_id %p', (chainId) => {
        expect(() => applyHiveChainConfig(hive.config, { address_prefix: 'STM', chain_id: chainId })).toThrow(
            /Invalid chain_id/
        );
        expect(hive.config.get('chain_id')).toBe(original.chain_id);
    });
});
