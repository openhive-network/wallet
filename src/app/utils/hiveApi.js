import { api } from '@hiveio/hive-js';
import {
    ChainTypes,
    makeBitMaskFilter,
} from '@hiveio/hive-js/lib/auth/serializer';
import Moment from 'moment';

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

async function getStateForWitnessesAndProposals() {
    let schedule = await api.getWitnessScheduleAsync();
    let witnesses = await api.getWitnessesByVoteAsync('', 200);
    let global_properties = await api.getDynamicGlobalPropertiesAsync();

    let result = {};
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

export async function getAllTransferHistory(
    account,
    fetchDays = 60,
    opTypes = ['transfer'],
    accountHistory = [],
    start = -1
) {
    if (fetchDays > 60) {
        fetchDays = 60;
    }

    const transactions = await api.getAccountHistoryAsync(
        account,
        start,
        start < 0 ? 1000 : Math.min(start, 1000)
    );

    if (transactions.length > 0) {
        const lastTransaction = transactions[0];
        const lastTransactionTimestamp = lastTransaction[1].timestamp;
        const lastTransactionTime = Moment.utc(lastTransactionTimestamp);
        const now = Moment(Date.now());
        const daysAgo = now.diff(lastTransactionTime, 'days');
        const filteredTransactions = transactions.filter((transaction) => {
            const opType = transaction[1].op[0];
            return opTypes.indexOf(opType) !== -1;
        });

        if (filteredTransactions.length > 0) {
            accountHistory = accountHistory.concat(filteredTransactions);
        }

        if (
            daysAgo <= fetchDays &&
            lastTransaction[0] > 0 &&
            lastTransaction[0] !== start
        ) {
            accountHistory = await getAllTransferHistory(
                account,
                fetchDays,
                opTypes,
                accountHistory,
                lastTransaction[0]
            );
        }
    }

    return accountHistory;
}

async function getTransferHistory(account) {
    let transfer_history = null;
    let start_sequence = -1;

    try {
        transfer_history = await api.getAccountHistoryAsync(
            account,
            start_sequence,
            500,
            ...wallet_operations_bitmask
        );
    } catch (err) {
        let error_string = err.toString();
        if (error_string.includes('start=')) {
            let index = error_string.indexOf('=');
            start_sequence = error_string.substr(index + 1);
            if (start_sequence.indexOf('.') > 0)
                start_sequence = start_sequence.substr(
                    0,
                    start_sequence.length - 1
                );
            try {
                transfer_history = await api.getAccountHistoryAsync(
                    account,
                    start_sequence,
                    500,
                    ...wallet_operations_bitmask
                );
            } catch (err) {
                console.log(
                    'Unable to fetch account history for account: ',
                    account,
                    err
                );
                transfer_history = [];
            }
        }
    }

    if (transfer_history === null || transfer_history === undefined)
        transfer_history = [];
    return transfer_history;
}

export async function getStateAsync(url) {
    if (url === 'trending') {
        return stateCleaner(await getStateForTrending());
    }
    if (url === '/~witnesses' || url === '/proposals') {
        return stateCleaner(await getStateForWitnessesAndProposals());
    }
    // strip off query string
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
