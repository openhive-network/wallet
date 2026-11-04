const CHAIN_ID_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * Point hive-js at the configured chain: the address prefix used for keys and
 * the chain id it prefixes to every transaction digest it signs.
 *
 * @param {{set: function(string, *)}} hiveConfig - hive-js `config`
 * @param {{address_prefix: string, chain_id: string}} chain
 * @throws {Error} when chain_id is not 32 bytes of hex
 */
export default function applyHiveChainConfig(hiveConfig, { address_prefix, chain_id }) {
    // hive-js decodes the chain id with Buffer.from(hex), which silently drops
    // invalid input and would produce signatures no node accepts.
    if (typeof chain_id !== 'string' || !CHAIN_ID_PATTERN.test(chain_id)) {
        throw new Error(`Invalid chain_id ${JSON.stringify(chain_id)}: expected 64 hex characters`);
    }
    hiveConfig.set('address_prefix', address_prefix);
    hiveConfig.set('chain_id', chain_id);
}
