import { api } from '@hiveio/hive-js';
import {
    ChainTypes,
    makeBitMaskFilter,
} from '@hiveio/hive-js/lib/auth/serializer';

import stateCleaner from 'app/redux/stateCleaner';

const op = ChainTypes.operations;
let wallet_operations_bitmask = makeBitMaskFilter([
    op.transfer,
    op.transfer_to_vesting,
    op.withdraw_vesting,
    op.interest,
    op.liquidity_reward,
    op.transfer_to_savings,
    op.transfer_from_savings,
    op.escrow_transfer,
    op.cancel_transfer_from_savings,
    op.escrow_approve,
    op.escrow_dispute,
    op.escrow_release,
    op.fill_convert_request,
    op.fill_order,
    op.claim_reward_balance,
]);

async function getStateForTrending() {
    let result = {};
    result.content = {};
    result.accounts = {};
    result.props = await api.getDynamicGlobalPropertiesAsync();
    return result;
}

async function getStateForWitnesses() {
    let schedule = await api.getWitnessScheduleAsync();
    let witnesses = await api.getWitnessesByVoteAsync('', 200);
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

async function getGenericState(user) {
    let result = {};
    result.accounts = {};
    result.content = {};
    result.props = await api.getDynamicGlobalPropertiesAsync();

    let user_to_check = user;
    //user should be an account
    if (user.startsWith('/')) {
        user_to_check = user.split('/')[1];
    }

    if (user_to_check.startsWith('@'))
        user_to_check = user_to_check.split('@')[1];
    let account_details = await api.getAccountsAsync([user_to_check]);
    result.accounts[user_to_check] = account_details[0];

    result.feed_price = {};
    let feed_data = await api.getFeedHistoryAsync();
    result.feed_price = feed_data.current_median_history;
    return result;
}

async function getTransferHistory(account)
{
    let transfer_history = null;
    let start_sequence = -1;

    try
    {
        transfer_history = await api.getAccountHistoryAsync(account, start_sequence, 500, ...wallet_operations_bitmask);
    }
    catch (err)
    {
        let error_string = err.toString();
        if (error_string.includes("start="))
        {
            let index = error_string.indexOf("=");
            start_sequence = error_string.substr(index+1);
            if (start_sequence.indexOf(".") > 0)
                start_sequence = start_sequence.substr(0, start_sequence.length - 1);
            try
            {
                transfer_history = await api.getAccountHistoryAsync(account, start_sequence, 500, ...wallet_operations_bitmask);
            }
            catch (err)
            {
                console.log("Unable to fetch account history for account: ", account, err);
            }
        }
    }

    return transfer_history;
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
        let tokens = url.split('/');
        for (var token of tokens) {
            if (token.includes('@')) {
                path = token;
                break;
            }
        }
    }
    let raw = await getGenericState(path);

    if (fetch_transfers) {
        let account_name = path.split('@')[1];
        let account_history = null;

        account_history = await getTransferHistory(account_name);
        let account = await api.getAccountsAsync([account_name]);
        account = account[0];
        account['transfer_history'] = account_history;
        raw['accounts'][account_name] = account;
    }

    const cleansed = stateCleaner(raw);

    return cleansed;
}
