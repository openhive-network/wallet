import * as hive from '@hiveio/hive-js';

hive.config.set('address_prefix', 'STM');

let chain_id = '';
for (let i = 0; i < 32; i++) chain_id += '00';

module.exports = {
    address_prefix: 'STM',
    expire_in_secs: 15,
    chain_id,
};
