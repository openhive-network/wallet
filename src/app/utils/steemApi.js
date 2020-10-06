import { api } from '@hiveio/hive-js';

import stateCleaner from 'app/redux/stateCleaner';

export async function getStateAsync(url) {
    // strip off query string
    let path = url.split('?')[0];
    let fetch_transfers = false;
    if (path.includes("transfers"))
    {
        fetch_transfers = true;
        //just convert path to be the username, hivemind won't accept the request if transfers is in the path
        path = path.split('/')[1];
    }
    let raw = await api.getStateAsync(path);

    if (fetch_transfers)
    {
        let account_name = path.split('@')[1];
        let account_history = await api.getAccountHistoryAsync(account_name, -1, 1000);
        let account = await api.getAccountsAsync([account_name]);
        account = account[0];
        account["transfer_history"] = account_history;
        raw["accounts"][account_name] = account;
    }

    const cleansed = stateCleaner(raw);

    return cleansed;
}
