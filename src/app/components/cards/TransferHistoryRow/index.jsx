import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Memo from 'app/components/elements/Memo';
import { numberWithCommas, vestsToHp } from 'app/utils/StateFunctions';
import tt from 'counterpart';
import GDPRUserList from 'app/utils/GDPRUserList';

class TransferHistoryRow extends React.Component {
    render() {
        const {
            op,
            context,
            curation_reward,
            author_reward,
            benefactor_reward,
            powerdown_vests,
            reward_vests,
            socialUrl,
            incoming,
            outgoing,
            formValue,
            fromUser,
            toUser,
            excludeLessThan1,
            autocomplete,
        } = this.props;
        // context -> account perspective

        const type = op[1].op[0];
        const data = op[1].op[1];
        let getRewards = [];
        /* All transfers involve up to 2 accounts, context and 1 other. */
        let message = '';

        if (type === 'transfer_to_vesting') {
            const amount = data.amount.split(' ')[0];

            if (data.from === context) {
                if (data.to === '') {
                    message = tt(
                        'transferhistoryrow_jsx.transfer_to_vesting.from_self.no_to',
                        { amount }
                    );
                    // tt('g.transfer') + amount + tt('g.to') + 'HIVE POWER';
                } else {
                    message = (
                        <span>
                            {tt(
                                'transferhistoryrow_jsx.transfer_to_vesting.from_self.to_someone',
                                { amount }
                            )}
                            {otherAccountLink(data.to)}
                        </span>
                    );
                    // tt('g.transfer') + amount + ' HIVE POWER' + tt('g.to');
                }
            } else if (data.to === context) {
                message = (
                    <span>
                        {tt(
                            'transferhistoryrow_jsx.transfer_to_vesting.to_self',
                            { amount }
                        )}
                        {otherAccountLink(data.from)}
                    </span>
                );
                // tt('g.receive') + amount + ' HIVE POWER' + tt('g.from');
            } else {
                message = (
                    <span>
                        {tt(
                            'transferhistoryrow_jsx.transfer_to_vesting.from_user_to_user',
                            {
                                amount,
                                from: data.from,
                            }
                        )}
                        {otherAccountLink(data.to)}
                    </span>
                );
                // tt('g.transfer') + amount + ' HIVE POWER' + tt('g.from') +data.from + tt('g.to');
            }
        } else if (
            /^transfer$|^transfer_to_savings$|^transfer_from_savings$/.test(
                type
            )
        ) {
            // transfer_to_savings
            const fromWhere =
                type === 'transfer_to_savings'
                    ? 'to_savings'
                    : type === 'transfer_from_savings'
                    ? 'from_savings'
                    : 'not_savings';

            if (data.from === context) {
                // Semi-bad behavior - passing `type` to translation engine -- @todo better somehow?
                // type can be to_savings, from_savings, or not_savings
                // Also we can't pass React elements (link to other account) so its order is fixed :()
                message = (
                    <span>
                        {tt(
                            [
                                'transferhistoryrow_jsx',
                                'transfer',
                                'from_self',
                                fromWhere,
                            ],
                            { amount: data.amount }
                        )}
                        {otherAccountLink(data.to)}
                        {data.request_id &&
                            tt('transferhistoryrow_jsx.request_id', {
                                request_id: data.request_id,
                            })}
                    </span>
                );
                // tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.to');
            } else if (data.to === context) {
                message = (
                    <span>
                        {tt(
                            [
                                'transferhistoryrow_jsx',
                                'transfer',
                                'to_self',
                                fromWhere,
                            ],
                            { amount: data.amount }
                        )}
                        {otherAccountLink(data.from)}
                        {data.request_id &&
                            tt('transferhistoryrow_jsx.request_id', {
                                request_id: data.request_id,
                            })}
                    </span>
                );
                // tt('g.receive') + `${fromWhere} ${data.amount}` + tt('g.from');
            } else {
                // Removing the `from` link from this one -- only one user is linked anyways.
                message = (
                    <span>
                        {tt(
                            [
                                'transferhistoryrow_jsx',
                                'transfer',
                                'to_someone_from_someone',
                                fromWhere,
                            ],
                            {
                                amount: data.amount,
                                from: data.from,
                                to: data.to,
                            }
                        )}
                        {data.request_id &&
                            ' ' +
                                tt('transferhistoryrow_jsx.request_id', {
                                    request_id: data.request_id,
                                })}
                    </span>
                );
                // tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.from');
            }
        } else if (type === 'cancel_transfer_from_savings') {
            message = tt(
                'transferhistoryrow_jsx.cancel_transfer_from_savings',
                {
                    request_id: data.request_id,
                }
            );
            // `${tt('transferhistoryrow_jsx.cancel_transfer_from_savings')} (${tt('g.request')} ${data.request_id})`;
        } else if (type === 'withdraw_vesting') {
            if (data.vesting_shares === '0.000000 VESTS')
                message = tt('transferhistoryrow_jsx.stop_power_down');
            else
                message = tt('transferhistoryrow_jsx.withdraw_vesting', {
                    powerdown_vests,
                });
            // tt('transferhistoryrow_jsx.start_power_down_of') + ' ' + powerdown_vests + ' HIVE';
        } else if (type === 'curation_reward') {
            message = (
                <span>
                    {tt('transferhistoryrow_jsx.curation_reward', {
                        curation_reward,
                    })}
                    {postLink(
                        socialUrl,
                        data.comment_author,
                        data.comment_permlink
                    )}
                </span>
            );
            // `${curation_reward} HIVE POWER` + tt('g.for');
        } else if (type === 'author_reward') {
            let hive_payout = '';
            if (data.hive_payout !== '0.000 HIVE')
                hive_payout = ', ' + data.hive_payout;
            message = (
                <span>
                    {tt('transferhistoryrow_jsx.author_reward', {
                        author_reward,
                        hive_payout,
                        hbd_payout: data.hbd_payout,
                    })}
                    {postLink(socialUrl, data.author, data.permlink)}
                </span>
            );
            // `${data.sbd_payout}${hive_payout}, ${tt( 'g.and' )} ${author_reward} HIVE POWER ${tt('g.for')}`;
        } else if (type === 'claim_reward_balance') {
            const rewards = [];
            getRewards.push(rewards);
            if (parseFloat(data.reward_hive.split(' ')[0]) > 0)
                rewards.push(data.reward_hive);
            if (parseFloat(data.reward_hbd.split(' ')[0]) > 0)
                rewards.push(data.reward_hbd);
            if (parseFloat(data.reward_vests.split(' ')[0]) > 0)
                rewards.push(`${reward_vests} HIVE POWER`);
            switch (rewards.length) {
                case 3:
                    message = tt(
                        'transferhistoryrow_jsx.claim_reward_balance.three_rewards',
                        {
                            first_reward: rewards[0],
                            second_reward: rewards[1],
                            third_reward: rewards[2],
                        }
                    );
                    // `${rewards[0]}, ${rewards[1]} and ${ rewards[2] }`;
                    break;
                case 2:
                    message = tt(
                        'transferhistoryrow_jsx.claim_reward_balance.two_rewards',
                        { first_reward: rewards[0], second_reward: rewards[1] }
                    );
                    // `${rewards[0]} and ${rewards[1]}`;
                    break;
                case 1:
                    message = tt(
                        'transferhistoryrow_jsx.claim_reward_balance.one_reward',
                        { reward: rewards[0] }
                    );
                    // `${rewards[0]}`;
                    break;

                default:
                    console.error(
                        `Not sure how to handle rewards length of ${rewards.length}`
                    );
                    break;
            }
        } else if (type === 'interest') {
            message = tt('transferhistoryrow_jsx.interest', {
                interest: data.interest,
            });
            // `${tt( 'transferhistoryrow_jsx.receive_interest_of' )} ${data.interest}`;
        } else if (type === 'fill_convert_request') {
            message = tt('transferhistoryrow_jsx.fill_convert_request', {
                amount_in: data.amount_in,
                amount_out: data.amount_out,
            });
            // `Fill convert request: ${data.amount_in} for ${ data.amount_out }`;
        } else if (type === 'fill_order') {
            if (data.open_owner == context) {
                // my order was filled by data.current_owner
                message = tt(
                    'transferhistoryrow_jsx.fill_order.filled_by_current_owner',
                    {
                        open_pays: data.open_pays,
                        current_pays: data.current_pays,
                    }
                );
                // `Paid ${data.open_pays} for ${  data.current_pays }`
            } else {
                // data.open_owner filled my order
                message = tt(
                    'transferhistoryrow_jsx.fill_order.open_owner_filled_my_order',
                    {
                        open_pays: data.open_pays,
                        current_pays: data.current_pays,
                    }
                );
                // `Paid ${data.current_pays} for ${ data.open_pays }`;
            }
        } else if (type === 'comment_benefactor_reward') {
            message = tt('transferhistoryrow_jsx.comment_benefactor_reward', {
                benefactor_reward,
                author: data.author,
                permlink: data.permlink,
            });
            // `${benefactor_reward} HIVE POWER for ${ data.author }/${data.permlink}`;
        } else {
            message = JSON.stringify({ type, ...data }, null, 2);
        }

        ///Filters

        //received from usernames
        const isFromNamesEqual = autocomplete.filter(
            (name) => name === data.from
        );
        const isFromNamesEqualToString =
            String(isFromNamesEqual) !== '' && String(isFromNamesEqual);
        //transfer to usernames
        const isToNamesEqual = autocomplete.filter((name) => name === data.to);
        const isToNamesEqualToString =
            String(isToNamesEqual) !== '' && String(isToNamesEqual);

        // received and transfer usernames
        const isNamesEqual = autocomplete.filter(
            (name) => name === data.from || name === data.to
        );

        const isNamesEqualToString =
            String(isNamesEqual) !== '' && String(isNamesEqual);

        //filter less than 1 hive/hbd
        const firstAmountChar = String(data.amount)[0];
        //filter less than 1 rewards
        const firstRewardsChar = String(getRewards[0])[0];

        function handleIncomingOutgoingFilters() {
            if (incoming === outgoing) {
                return ' Trans';
            }
            if (
                (data.to !== context && incoming) ||
                (incoming === true &&
                    excludeLessThan1 === true &&
                    firstAmountChar === '0')
            ) {
                return 'hidden';
            }
            if (
                (data.from !== context && outgoing === true) ||
                (outgoing === true &&
                    excludeLessThan1 === true &&
                    firstAmountChar === '0')
            ) {
                return 'hidden';
            } else {
                return 'Trans';
            }
        }

        function handleExcludeLessThan1Filter() {
            if (excludeLessThan1 === true) {
                if (firstAmountChar === '0' || firstRewardsChar === '0') {
                    return 'hidden';
                }
            } else return 'Trans';
        }

        function handleFromFilterSearch() {
            if (formValue !== '') {
                if (isFromNamesEqualToString) {
                    return 'Trans';
                } else {
                    return 'hidden';
                }
            } else return 'Trans';
        }

        function handleToFilterSearch() {
            if (formValue !== '') {
                if (isToNamesEqualToString) {
                    return 'Trans';
                } else {
                    return 'hidden';
                }
            } else return 'Trans';
        }

        function handleFilterSearch() {
            if (formValue !== '') {
                if (isNamesEqualToString) {
                    return 'Trans';
                } else {
                    return 'hidden';
                }
            } else return 'Trans';
        }

        function useFilters() {
            if (incoming || outgoing || (incoming && outgoing)) {
                return handleIncomingOutgoingFilters();
            }
            if (fromUser === true) {
                if (firstAmountChar === '0' && excludeLessThan1 === true) {
                    return 'hidden';
                }
                return handleFromFilterSearch();
            }
            if (toUser === true) {
                if (firstAmountChar === '0' && excludeLessThan1 === true) {
                    return 'hidden';
                }
                return handleToFilterSearch();
            }
            if (excludeLessThan1 === true) {
                return handleExcludeLessThan1Filter();
            }
            if (toUser === fromUser) {
                return handleFilterSearch();
            }
        }

        return (
            <tr key={op[0]} className={useFilters()}>
                <td>
                    <TimeAgoWrapper date={op[1].timestamp} />
                </td>
                <td
                    className="TransferHistoryRow__text"
                    style={{ maxWidth: '40rem' }}
                >
                    {message}
                </td>
                <td
                    className="show-for-medium"
                    style={{
                        maxWidth: '40rem',
                        wordWrap: 'break-word',
                    }}
                >
                    <Memo text={data.memo} username={context} />
                </td>
            </tr>
        );
    }
}

const otherAccountLink = (username) => {
    return GDPRUserList.includes(username) ? (
        <span>{username}</span>
    ) : (
        <Link to={`/@${username}`}>{username}</Link>
    );
};

const postLink = (socialUrl, author, permlink) => (
    <a
        href={`${socialUrl}/@${author}/${permlink}`}
        target="_blank"
        rel="noopener noreferrer"
    >
        {author}/{permlink}
    </a>
);

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const { op } = ownProps;
        const [type, data] = op[1].op;
        const powerdown_vests =
            type === 'withdraw_vesting'
                ? numberWithCommas(vestsToHp(state, data.vesting_shares))
                : undefined;
        const reward_vests =
            type === 'claim_reward_balance'
                ? numberWithCommas(vestsToHp(state, data.reward_vests))
                : undefined;
        const curation_reward =
            type === 'curation_reward'
                ? numberWithCommas(vestsToHp(state, data.reward))
                : undefined;
        const author_reward =
            type === 'author_reward'
                ? numberWithCommas(vestsToHp(state, data.vesting_payout))
                : undefined;
        const benefactor_reward =
            type === 'comment_benefactor_reward'
                ? numberWithCommas(vestsToHp(state, data.reward))
                : undefined;
        const socialUrl = state.app.get('socialUrl');
        return {
            ...ownProps,
            curation_reward,
            author_reward,
            benefactor_reward,
            powerdown_vests,
            reward_vests,
            socialUrl,
        };
    }
)(TransferHistoryRow);
