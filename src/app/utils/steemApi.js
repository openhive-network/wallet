import { api } from '@hiveio/hive-js';

import stateCleaner from 'app/redux/stateCleaner';

export async function getStateAsync(url) {
    // strip off query string
    if (url === 'trending') {
        // [JES] For now, just fake a response. The front page for an unlogged in user doesn't need any of these properties to function
        let response = {
            content: {},
            accounts: {},
            props: {
                time: '2020-10-15T17:05:36',
                hbd_print_rate: 10000,
                hbd_interest_rate: 0,
                head_block_number: 47750342,
                total_vesting_shares: '211898678748.819916 VESTS',
                total_vesting_fund_hive: '110135222.704 STEEM',
                last_irreversible_block_num: 47750327,
            },
        };
        return stateCleaner(response);
    }
    let path = url.split('?')[0];
    let fetch_transfers = false;
    if (path.includes('transfers')) {
        fetch_transfers = true;
        //just convert path to be the username, hivemind won't accept the request if transfers is in the path
        path = path.split('/')[1];
    }
    let raw = await api.getStateAsync(path);

    if (fetch_transfers) {
        let account_name = path.split('@')[1];
        let account_history = await api.getAccountHistoryAsync(
            account_name,
            -1,
            1000
        );
        let account = await api.getAccountsAsync([account_name]);
        account = account[0];
        account['transfer_history'] = account_history;
        raw['accounts'][account_name] = account;
    }

    const cleansed = stateCleaner(raw);

    return cleansed;
}
