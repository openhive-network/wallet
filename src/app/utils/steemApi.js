import { api } from '@hiveio/hive-js';

import stateCleaner from 'app/redux/stateCleaner';

async function getStateForTrending() {
    let result = {};
    result.content = {};
    result.accounts = {};
    result.props = await api.getDynamicGlobalPropertiesAsync();
    return result;
}

async function getStateForWitnesses() {
    let schedule = await api.getWitnessScheduleAsync();
    let witnesses = await api.getWitnessesByVoteAsync('', 100);
    let global_properties = await api.getDynamicGlobalPropertiesAsync();

    let result = {};
    result.current_route = '/~witnesses';
    result.props = global_properties;
    result.tag_idx = {};
    result.tag_idx.trending = [];
    result.tags = {};
    result.content = {};
    result.accounts = {};
    result.witnesses = witnesses;
    result.discussion_idx = {};
    result.witness_schedule = schedule;
    result.feed_price = {};
    result.error = '';

    return result;
}

export async function getStateAsync(url) {
    // strip off query string
    if (url === 'trending') {
        // [JES] For now, just fake a response. The front page for an unlogged in user doesn't need any of these properties to function
        let trending_state = await getStateForTrending();
        return stateCleaner(trending_state);
    } else if (url.includes('witness')) {
        let witness_state = await getStateForWitnesses();
        return stateCleaner(witness_state);
    } else if (url.includes('proposals')) {
        let proposals_state = await getStateForWitnesses();
        return stateCleaner(proposals_state);
    }
    let path = url.split('?')[0];
    let fetch_transfers = false;
    if (path.includes('transfers')) {
        fetch_transfers = true;
        //just convert path to be the username, hivemind won't accept the request if transfers is in the path
        let tokens = path.split('/');
        for (var token of tokens) {
            if (token.contains('@')) {
                path = token;
                break;
            }
        }
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
