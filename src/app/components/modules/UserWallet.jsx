/* eslint react/prop-types: 0 */
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import tt from 'counterpart';
import { List } from 'immutable';
import SavingsWithdrawHistory from 'app/components/elements/SavingsWithdrawHistory';
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import {
    numberWithCommas,
    vestingHive,
    delegatedHive,
    powerdownHive,
    pricePerHive,
} from 'app/utils/StateFunctions';
import WalletSubMenu from 'app/components/elements/WalletSubMenu';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import Tooltip from 'app/components/elements/Tooltip';
import { FormattedHTMLMessage } from 'app/Translator';
import {
    LIQUID_TOKEN,
    LIQUID_TICKER,
    DEBT_TOKENS,
    VESTING_TOKEN,
} from 'app/client_config';
import * as transactionActions from 'app/redux/TransactionReducer';
import * as globalActions from 'app/redux/GlobalReducer';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import { getAllTransferHistory } from 'app/utils/hiveApi';

const assetPrecision = 1000;

const VALID_OPERATION_TYPES = [
    'transfer',
    'transfer_to_vesting',
    'withdraw_vesting',
    'interest',
    'liquidity_reward',
    'transfer_to_savings',
    'transfer_from_savings',
    'escrow_transfer',
    'cancel_transfer_from_savings',
    'escrow_approve',
    'escrow_dispute',
    'escrow_release',
    'fill_convert_request',
    'fill_order',
    'claim_reward_balance',
];

class UserWallet extends React.Component {
    constructor() {
        super();
        this.state = {
            claimInProgress: false,
        };
        this.onShowDepositHive = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            // const name = this.props.currentUser.get('username');
            const new_window = window.open();
            new_window.opener = null;
            new_window.location =
                'https://blocktrades.us/?input_coin_type=eth&output_coin_type=hive&receive_address=' +
                name;
        };
        this.onShowWithdrawHive = (e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location =
                'https://blocktrades.us/unregistered_trade/hive/eth';
        };
        this.onShowDepositPower = (currentUserName, e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location =
                'https://blocktrades.us/?input_coin_type=eth&output_coin_type=hive_power&receive_address=' +
                currentUserName;
        };
        this.onShowDepositHBD = (currentUserName, e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location =
                'https://blocktrades.us/?input_coin_type=eth&output_coin_type=hbd&receive_address=' +
                currentUserName;
        };
        this.onShowWithdrawHBD = (e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location =
                'https://blocktrades.us/unregistered_trade/hbd/eth';
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'UserWallet');
    }

    handleClaimRewards = (account) => {
        this.setState({ claimInProgress: true }); // disable the claim button
        this.props.claimRewards(account);
    };

    getCurrentHpApr = (gprops) => {
        // The inflation was set to 9.5% at block 7m
        const initialInflationRate = 9.5;
        const initialBlock = 7000000;

        // It decreases by 0.01% every 250k blocks
        const decreaseRate = 250000;
        const decreasePercentPerIncrement = 0.01;

        // How many increments have happened since block 7m?
        const headBlock = gprops.head_block_number;
        const deltaBlocks = headBlock - initialBlock;
        const decreaseIncrements = deltaBlocks / decreaseRate;

        // Current inflation rate
        let currentInflationRate =
            initialInflationRate -
            decreaseIncrements * decreasePercentPerIncrement;

        // Cannot go lower than 0.95%
        if (currentInflationRate < 0.95) {
            currentInflationRate = 0.95;
        }

        // Now lets calculate the "APR"
        const vestingRewardPercent = gprops.vesting_reward_percent / 10000;
        const virtualSupply = gprops.virtual_supply.split(' ').shift();
        const totalVestingFunds = gprops.total_vesting_fund_hive
            .split(' ')
            .shift();
        return (
            (virtualSupply * currentInflationRate * vestingRewardPercent) /
            totalVestingFunds
        );
    };

    render() {
        const {
            onShowDepositHive,
            onShowWithdrawHive,
            onShowDepositHBD,
            onShowWithdrawHBD,
            onShowDepositPower,
        } = this;
        const {
            convertToHive,
            price_per_hive,
            savings_withdraws,
            account,
            currentUser,
            open_orders,
        } = this.props;
        const gprops = this.props.gprops.toJS();

        // do not render if account is not loaded or available
        if (!account) return null;

        // do not render if state appears to contain only lite account info
        if (!account.has('vesting_shares')) return null;

        const vesting_hive = vestingHive(account.toJS(), gprops);
        const delegated_hive = delegatedHive(account.toJS(), gprops);
        const powerdown_hive = powerdownHive(account.toJS(), gprops);

        const isMyAccount =
            currentUser && currentUser.get('username') === account.get('name');

        const disabledWarning = false;
        // isMyAccount = false; // false to hide wallet transactions

        const showTransfer = (asset, transferType, e) => {
            e.preventDefault();
            this.props.showTransfer({
                to: isMyAccount ? null : account.get('name'),
                asset,
                transferType,
            });
        };

        const savings_balance = account.get('savings_balance');
        const savings_hbd_balance = account.get('savings_hbd_balance');

        const powerDown = (cancel, e) => {
            e.preventDefault();
            const name = account.get('name');
            if (cancel) {
                const vesting_shares = cancel
                    ? '0.000000 VESTS'
                    : account.get('vesting_shares');
                this.setState({ toggleDivestError: null });
                const errorCallback = (e2) => {
                    this.setState({ toggleDivestError: e2.toString() });
                };
                const successCallback = () => {
                    this.setState({ toggleDivestError: null });
                };
                this.props.withdrawVesting({
                    account: name,
                    vesting_shares,
                    errorCallback,
                    successCallback,
                });
            } else {
                const to_withdraw = account.get('to_withdraw');
                const withdrawn = account.get('withdrawn');
                const vesting_shares = account.get('vesting_shares');
                const delegated_vesting_shares = account.get(
                    'delegated_vesting_shares'
                );
                this.props.showPowerdown({
                    account: name,
                    to_withdraw,
                    withdrawn,
                    vesting_shares,
                    delegated_vesting_shares,
                });
            }
        };

        // Sum savings withrawals
        let savings_pending = 0,
            savings_hbd_pending = 0;
        if (savings_withdraws) {
            savings_withdraws.forEach((withdraw) => {
                const [amount, asset] = withdraw.get('amount').split(' ');
                if (asset === 'HIVE') savings_pending += parseFloat(amount);
                else {
                    if (asset === 'HBD')
                        savings_hbd_pending += parseFloat(amount);
                }
            });
        }

        // Sum conversions
        let conversionValue = 0;
        const currentTime = new Date().getTime();
        const conversions = account
            .get('other_history', List())
            .reduce((out, item) => {
                if (item.getIn([1, 'op', 0], '') !== 'convert') return out;

                const timestamp = new Date(
                    item.getIn([1, 'timestamp'])
                ).getTime();
                const finishTime = timestamp + 86400000 * 3.5; // add 3.5day conversion delay
                if (finishTime < currentTime) return out;

                const amount = parseFloat(
                    item.getIn([1, 'op', 1, 'amount']).replace(' HBD', '')
                );
                conversionValue += amount;

                return out.concat([
                    <div key={item.get(0)}>
                        <Tooltip
                            t={tt('userwallet_jsx.conversion_complete_tip', {
                                date: new Date(finishTime).toLocaleString(),
                            })}
                        >
                            <span>
                                (+
                                {tt('userwallet_jsx.in_conversion', {
                                    amount: numberWithCommas(
                                        '$' + amount.toFixed(3)
                                    ),
                                })}
                                )
                            </span>
                        </Tooltip>
                    </div>,
                ]);
            }, []);

        const balance_hive = parseFloat(account.get('balance').split(' ')[0]);
        const saving_balance_hive = parseFloat(savings_balance.split(' ')[0]);
        const divesting =
            parseFloat(account.get('vesting_withdraw_rate').split(' ')[0]) >
            0.0;
        const hbd_balance = parseFloat(account.get('hbd_balance'));
        const hbd_balance_savings = parseFloat(
            savings_hbd_balance.split(' ')[0]
        );
        const hbdOrders =
            !open_orders || !isMyAccount
                ? 0
                : open_orders.reduce((o, order) => {
                      if (order.sell_price.base.indexOf('HBD') !== -1) {
                          o += order.for_sale;
                      }
                      return o;
                  }, 0) / assetPrecision;

        const hiveOrders =
            !open_orders || !isMyAccount
                ? 0
                : open_orders.reduce((o, order) => {
                      if (order.sell_price.base.indexOf('HIVE') !== -1) {
                          o += order.for_sale;
                      }
                      return o;
                  }, 0) / assetPrecision;

        // set displayed estimated value
        const total_hbd =
            hbd_balance +
            hbd_balance_savings +
            savings_hbd_pending +
            hbdOrders +
            conversionValue;
        const total_hive =
            vesting_hive +
            balance_hive +
            saving_balance_hive +
            savings_pending +
            hiveOrders;
        let total_value =
            '$' +
            numberWithCommas(
                (total_hive * price_per_hive + total_hbd).toFixed(2)
            );

        // format spacing on estimated value based on account state
        let estimate_output = <p>{total_value}</p>;
        if (isMyAccount) {
            estimate_output = <p>{total_value}&nbsp; &nbsp; &nbsp;</p>;
        }

        /// transfer log
        let idx = 0;
        const transfer_log = account
            .get('transfer_history')
            .map((item) => {
                const data = item.getIn([1, 'op', 1]);
                const type = item.getIn([1, 'op', 0]);

                if (!VALID_OPERATION_TYPES.includes(type)) return null;

                // Filter out rewards
                if (
                    type === 'curation_reward' ||
                    type === 'author_reward' ||
                    type === 'comment_benefactor_reward'
                ) {
                    return null;
                }

                if (
                    data.hbd_payout === '0.000 HBD' &&
                    data.vesting_payout === '0.000000 VESTS'
                )
                    return null;
                return (
                    <TransferHistoryRow
                        key={idx++}
                        op={item.toJS()}
                        context={account.get('name')}
                    />
                );
            })
            .filter((el) => !!el)
            .reverse();

        let hive_menu = [
            {
                value: tt('userwallet_jsx.transfer'),
                link: '#',
                onClick: showTransfer.bind(this, 'HIVE', 'Transfer to Account'),
            },
            {
                value: tt('userwallet_jsx.transfer_to_savings'),
                link: '#',
                onClick: showTransfer.bind(this, 'HIVE', 'Transfer to Savings'),
            },
            {
                value: tt('userwallet_jsx.power_up'),
                link: '#',
                onClick: showTransfer.bind(
                    this,
                    'VESTS',
                    'Transfer to Account'
                ),
            },
        ];
        const power_menu = [
            {
                value: tt('userwallet_jsx.power_down'),
                link: '#',
                onClick: powerDown.bind(this, false),
            },
            {
                value: tt('userwallet_jsx.delegate'),
                link: '#',
                onClick: showTransfer.bind(
                    this,
                    'DELEGATE_VESTS',
                    'Delegate to Account'
                ),
            },
        ];
        const dollar_menu = [
            {
                value: tt('g.transfer'),
                link: '#',
                onClick: showTransfer.bind(this, 'HBD', 'Transfer to Account'),
            },
            {
                value: tt('userwallet_jsx.transfer_to_savings'),
                link: '#',
                onClick: showTransfer.bind(this, 'HBD', 'Transfer to Savings'),
            },
            { value: tt('userwallet_jsx.market'), link: '/market' },
        ];
        if (isMyAccount) {
            hive_menu.push({
                value: tt('g.buy'),
                link: '#',
                onClick: onShowDepositHive.bind(
                    this,
                    currentUser.get('username')
                ),
            });
            hive_menu.push({
                value: tt('g.sell'),
                link: '#',
                onClick: onShowWithdrawHive,
            });
            hive_menu.push({
                value: tt('userwallet_jsx.market'),
                link: '/market',
            });
            // power_menu.push({
            //     value: tt('g.buy'),
            //     link: '#',
            //     onClick: onShowDepositPower.bind(
            //         this,
            //         currentUser.get('username')
            //     ),
            // });
            dollar_menu.push({
                value: tt('g.buy'),
                link: '#',
                onClick: onShowDepositHBD.bind(
                    this,
                    currentUser.get('username')
                ),
            });
            dollar_menu.push({
                value: tt('g.sell'),
                link: '#',
                onClick: onShowWithdrawHBD,
            });
        }
        if (divesting) {
            power_menu.push({
                value: 'Cancel Power Down',
                link: '#',
                onClick: powerDown.bind(this, true),
            });
        }

        const hive_balance_str = numberWithCommas(balance_hive.toFixed(3));
        const hive_orders_balance_str = numberWithCommas(hiveOrders.toFixed(3));
        const power_balance_str = numberWithCommas(vesting_hive.toFixed(3));
        const received_power_balance_str =
            (delegated_hive < 0 ? '+' : '') +
            numberWithCommas((-delegated_hive).toFixed(3));
        const powerdown_balance_str = numberWithCommas(
            powerdown_hive.toFixed(3)
        );
        const hbd_balance_str = numberWithCommas('$' + hbd_balance.toFixed(3)); // formatDecimal(account.sbd_balance, 3)
        const hbd_orders_balance_str = numberWithCommas(
            '$' + hbdOrders.toFixed(3)
        );
        const savings_balance_str = numberWithCommas(
            saving_balance_hive.toFixed(3) + ' HIVE'
        );
        const savings_hbd_balance_str = numberWithCommas(
            '$' + hbd_balance_savings.toFixed(3)
        );

        const savings_menu = [
            {
                value: tt('userwallet_jsx.withdraw_LIQUID_TOKEN', {
                    LIQUID_TOKEN,
                }),
                link: '#',
                onClick: showTransfer.bind(this, 'HIVE', 'Savings Withdraw'),
            },
        ];
        const savings_hbd_menu = [
            {
                value: tt('userwallet_jsx.withdraw_DEBT_TOKENS', {
                    DEBT_TOKENS,
                }),
                link: '#',
                onClick: showTransfer.bind(this, 'HBD', 'Savings Withdraw'),
            },
        ];
        // set dynamic secondary wallet values
        const hbdInterest = this.props.hbd_interest / 100;
        const hbdMessage = (
            <span>{tt('userwallet_jsx.tradeable_tokens_transferred')}</span>
        );

        const reward_hive =
            parseFloat(account.get('reward_hive_balance').split(' ')[0]) > 0
                ? account.get('reward_hive_balance')
                : null;
        const reward_hbd =
            parseFloat(account.get('reward_hbd_balance').split(' ')[0]) > 0
                ? account.get('reward_hbd_balance')
                : null;
        const reward_hp =
            parseFloat(account.get('reward_vesting_hive').split(' ')[0]) > 0
                ? account.get('reward_vesting_hive').replace('HIVE', 'HP')
                : null;

        const rewards = [];
        if (reward_hive) rewards.push(reward_hive);
        if (reward_hbd) rewards.push(reward_hbd);
        if (reward_hp) rewards.push(reward_hp);

        let rewards_str;
        switch (rewards.length) {
            case 3:
                rewards_str = `${rewards[0]}, ${rewards[1]} and ${rewards[2]}`;
                break;
            case 2:
                rewards_str = `${rewards[0]} and ${rewards[1]}`;
                break;
            case 1:
                rewards_str = `${rewards[0]}`;
                break;
        }

        let claimbox;
        if (currentUser && rewards_str && isMyAccount) {
            claimbox = (
                <div className="row">
                    <div className="columns small-12">
                        <div className="UserWallet__claimbox">
                            <span className="UserWallet__claimbox-text">
                                Your current rewards: {rewards_str}
                            </span>
                            <button
                                disabled={this.state.claimInProgress}
                                className="button"
                                onClick={(e) => {
                                    this.handleClaimRewards(account);
                                }}
                            >
                                {tt('userwallet_jsx.redeem_rewards')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        let hpApr;
        try {
            // TODO: occasionally fails. grops not loaded yet?
            hpApr = this.getCurrentHpApr(gprops);
        } catch (e) {}

        const exportHistoryToCsv = async () => {
            const reportButton = document.getElementById('generate-report-btn');
            const reportContainer = document.getElementById('report-download');
            const reportDays = parseInt(
                document.getElementById('reportDays').value
            );

            reportContainer.innerHTML = '';

            if (reportDays) {
                reportButton.innerHTML = `${tt(
                    'userwallet_jsx.generatingReport'
                )}...`;
                reportButton.disabled = true;
                let accountHistory = await getAllTransferHistory(
                    this.props.account.get('name'),
                    reportDays,
                    [
                        'curation_reward',
                        'author_reward',
                        'producer_reward',
                        'comment_reward',
                        'comment_benefactor_reward',
                        'interest',
                        'proposal_pay',
                        'sps_fund',
                        'transfer',
                    ]
                );

                const reportColumns = ['timestamp', 'opType'];
                const operations = [];

                for (let hi = 0; hi < accountHistory.length; hi += 1) {
                    const transaction = accountHistory[hi];
                    const transactionMetadata = transaction[1];
                    const { op, timestamp } = transactionMetadata;
                    const opType = op[0];
                    const opMetadata = op[1];
                    const opMetadataKeys = Object.keys(opMetadata);

                    const operation = { timestamp, opType, ...opMetadata };
                    operations.push(operation);

                    for (let mi = 0; mi < opMetadataKeys.length; mi += 1) {
                        const metadataKey = opMetadataKeys[mi];
                        if (reportColumns.indexOf(metadataKey) === -1) {
                            reportColumns.push(metadataKey);
                        }
                    }
                }

                accountHistory = undefined;

                let report = reportColumns.join(', ') + '\n';

                for (let oi = 0; oi < operations.length; oi += 1) {
                    const operation = operations[oi];
                    const operationKeys = Object.keys(operation);
                    const reportEntryItems = [];

                    for (let ci = 0; ci < reportColumns.length; ci += 1) {
                        const column = reportColumns[ci];
                        let foundValue = false;

                        for (let ki = 0; ki < operationKeys.length; ki += 1) {
                            const operationField = operationKeys[ki];

                            if (column === operationField) {
                                let fieldValue = operation[operationField];

                                if (
                                    typeof fieldValue === 'string' &&
                                    fieldValue.indexOf(',') !== -1
                                ) {
                                    fieldValue = `"${fieldValue.replace(
                                        /", ""/
                                    )}"`;
                                }

                                reportEntryItems.push(fieldValue);
                                foundValue = true;
                            }
                        }

                        if (foundValue === false) {
                            reportEntryItems.push('');
                        }
                    }

                    report += reportEntryItems.join(', ') + '\n';
                }

                const a = document.createElement('a');
                a.href = 'data:text/csv;charset=utf-8,' + encodeURI(report);
                a.download = 'hive-report.csv';
                a.target = '_blank';
                a.classList.add('button');
                a.innerHTML = 'Download report';
                reportContainer.appendChild(a);

                reportButton.innerHTML = tt('userwallet_jsx.generateReport');
                reportButton.disabled = false;
            } else {
                console.error('Report days input field missing');
            }
        };

        return (
            <div className="UserWallet">
                {claimbox}
                <div className="row">
                    <div className="columns small-10 medium-12 medium-expand">
                        <WalletSubMenu
                            accountname={account.get('name')}
                            isMyAccount={isMyAccount}
                        />
                    </div>
                    {
                        <div className="columns shrink">
                            {isMyAccount && (
                                <button
                                    className="UserWallet__buyhp button hollow"
                                    onClick={onShowDepositHive}
                                >
                                    {tt(
                                        'userwallet_jsx.buy_hive_or_hive_power'
                                    )}
                                </button>
                            )}
                        </div>
                    }
                </div>
                <div className="UserWallet__balance row">
                    <div className="column small-12 medium-8">
                        HIVE
                        <FormattedHTMLMessage
                            className="secondary"
                            id="tips_js.liquid_token"
                            params={{ LIQUID_TOKEN, VESTING_TOKEN }}
                        />
                    </div>
                    <div className="column small-12 medium-4">
                        {isMyAccount ? (
                            <DropdownMenu
                                className="Wallet_dropdown"
                                items={hive_menu}
                                el="li"
                                selected={hive_balance_str + ' HIVE'}
                            />
                        ) : (
                            hive_balance_str + ' HIVE'
                        )}
                        {hiveOrders ? (
                            <div
                                style={{
                                    paddingRight: isMyAccount
                                        ? '0.85rem'
                                        : null,
                                }}
                            >
                                <Link to="/market">
                                    <Tooltip t={tt('market_jsx.open_orders')}>
                                        (+{hive_orders_balance_str} HIVE)
                                    </Tooltip>
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="UserWallet__balance row zebra">
                    <div className="column small-12 medium-8">
                        HIVE POWER
                        <FormattedHTMLMessage
                            className="secondary"
                            id="tips_js.influence_token"
                        />
                        {delegated_hive != 0 ? (
                            <span className="secondary">
                                {tt(
                                    'tips_js.part_of_your_hive_power_is_currently_delegated',
                                    { user_name: account.get('name') }
                                )}
                            </span>
                        ) : null}
                        {hpApr && (
                            <FormattedHTMLMessage
                                className="secondary"
                                id="tips_js.hive_power_apr"
                                params={{ value: hpApr.toFixed(2) }}
                            />
                        )}{' '}
                    </div>
                    <div className="column small-12 medium-4">
                        {isMyAccount ? (
                            <DropdownMenu
                                className="Wallet_dropdown"
                                items={power_menu}
                                el="li"
                                selected={power_balance_str + ' HIVE'}
                            />
                        ) : (
                            power_balance_str + ' HIVE'
                        )}
                        {delegated_hive != 0 ? (
                            <div
                                style={{
                                    paddingRight: isMyAccount
                                        ? '0.85rem'
                                        : null,
                                }}
                            >
                                <Tooltip t="HIVE POWER delegated to/from this account">
                                    ({received_power_balance_str} HIVE)
                                </Tooltip>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="UserWallet__balance row">
                    <div className="column small-12 medium-8">
                        HIVE DOLLARS
                        <div className="secondary">{hbdMessage}</div>
                    </div>
                    <div className="column small-12 medium-4">
                        {isMyAccount ? (
                            <DropdownMenu
                                className="Wallet_dropdown"
                                items={dollar_menu}
                                el="li"
                                selected={hbd_balance_str}
                            />
                        ) : (
                            hbd_balance_str
                        )}
                        {hbdOrders ? (
                            <div
                                style={{
                                    paddingRight: isMyAccount
                                        ? '0.85rem'
                                        : null,
                                }}
                            >
                                <Link to="/market">
                                    <Tooltip t={tt('market_jsx.open_orders')}>
                                        (+{hbd_orders_balance_str})
                                    </Tooltip>
                                </Link>
                            </div>
                        ) : null}
                        {conversions}
                    </div>
                </div>
                <div className="UserWallet__balance row zebra">
                    <div className="column small-12 medium-8">
                        {tt('userwallet_jsx.savings')}
                        <div className="secondary">
                            <span>
                                {tt(
                                    'transfer_jsx.balance_subject_to_3_day_withdraw_waiting_period'
                                )}
                            </span>
                            <span>
                                <FormattedHTMLMessage
                                    className="secondary"
                                    id="tips_js.hbd_interest_rate"
                                    params={{
                                        value: (
                                            gprops.hbd_interest_rate / 100
                                        ).toFixed(2),
                                    }}
                                />
                            </span>
                        </div>
                    </div>
                    <div className="column small-12 medium-4">
                        {isMyAccount ? (
                            <DropdownMenu
                                className="Wallet_dropdown"
                                items={savings_menu}
                                el="li"
                                selected={savings_balance_str}
                            />
                        ) : (
                            savings_balance_str
                        )}
                        <br />
                        {isMyAccount ? (
                            <DropdownMenu
                                className="Wallet_dropdown"
                                items={savings_hbd_menu}
                                el="li"
                                selected={savings_hbd_balance_str}
                            />
                        ) : (
                            savings_hbd_balance_str
                        )}
                    </div>
                </div>
                <div className="UserWallet__balance row">
                    <div className="column small-12 medium-8">
                        {tt('userwallet_jsx.estimated_account_value')}
                        <div className="secondary">
                            {tt('tips_js.estimated_value', { LIQUID_TOKEN })}
                        </div>
                    </div>
                    <div className="column small-12 medium-4">
                        {estimate_output}
                    </div>
                </div>
                <div className="UserWallet__balance row">
                    <div className="column small-12">
                        {powerdown_hive != 0 && (
                            <span>
                                {tt(
                                    'userwallet_jsx.next_power_down_is_scheduled_to_happen'
                                )}{' '}
                                <TimeAgoWrapper
                                    date={account.get(
                                        'next_vesting_withdrawal'
                                    )}
                                />{' '}
                                {'(~' + powerdown_balance_str + ' HIVE)'}.
                            </span>
                        )}
                    </div>
                </div>
                {disabledWarning && (
                    <div className="row">
                        <div className="column small-12">
                            <div className="callout warning">
                                {tt(
                                    'userwallet_jsx.transfers_are_temporary_disabled'
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="row">
                    <div className="column small-12">
                        <hr />
                    </div>
                </div>

                {isMyAccount && <SavingsWithdrawHistory />}

                {isMyAccount && (
                    <div>
                        <div className="row">
                            <div className="column small-12">
                                <h4>{tt('userwallet_jsx.financialReport')}</h4>
                                <div className="secondary">
                                    {tt(
                                        'userwallet_jsx.financialReportDescription'
                                    )}
                                </div>
                                <div className="financial-report-cta">
                                    <select
                                        className="select-report-days"
                                        defaultValue={7}
                                        name="reportDays"
                                        id="reportDays"
                                    >
                                        <option value={7}>
                                            {tt('userwallet_jsx.last7days')}
                                        </option>
                                        <option value={14}>
                                            {tt('userwallet_jsx.last14days')}
                                        </option>
                                        <option value={30}>
                                            {tt('userwallet_jsx.last30days')}
                                        </option>
                                        <option value={60}>
                                            {tt('userwallet_jsx.last60days')}
                                        </option>
                                    </select>
                                    <button
                                        id="generate-report-btn"
                                        type="button"
                                        className="button"
                                        onClick={exportHistoryToCsv}
                                    >
                                        {tt('userwallet_jsx.generateReport')}
                                    </button>
                                    <div id="report-download" />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="column small-12">
                                <hr />
                            </div>
                        </div>
                    </div>
                )}

                <div className="row">
                    <div className="column small-12">
                        {/** history */}
                        <h4>{tt('userwallet_jsx.history')}</h4>
                        <div className="secondary">
                            <span>
                                {tt(
                                    'transfer_jsx.beware_of_spam_and_phishing_links'
                                )}
                            </span>
                            &nbsp;
                            <span>
                                {tt(
                                    'transfer_jsx.transactions_make_take_a_few_minutes'
                                )}
                            </span>
                        </div>
                        <table>
                            <tbody>{transfer_log}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const price_per_hive = pricePerHive(state);
        const savings_withdraws = state.user.get('savings_withdraws');
        const gprops = state.global.get('props');
        const hbd_interest = gprops.get('hbd_interest_rate');
        return {
            ...ownProps,
            open_orders: state.market.get('open_orders'),
            price_per_hive,
            savings_withdraws,
            hbd_interest,
            gprops,
        };
    },
    // mapDispatchToProps
    (dispatch) => ({
        claimRewards: (account) => {
            const username = account.get('name');
            const successCallback = () => {
                dispatch(
                    globalActions.getState({ url: `@${username}/transfers` })
                );
            };

            const operation = {
                account: username,
                reward_hive: account.get('reward_hive_balance'),
                reward_hbd: account.get('reward_hbd_balance'),
                reward_vests: account.get('reward_vesting_balance'),
            };

            dispatch(
                transactionActions.broadcastOperation({
                    type: 'claim_reward_balance',
                    operation,
                    successCallback,
                })
            );
        },
        convertToHive: (e) => {
            //post 2018-01-31 if no calls to this function exist may be safe to remove. Investigate use of ConvertToHive.jsx
            e.preventDefault();
            const name = 'convertToHive';
            dispatch(globalActions.showDialog({ name }));
        },
    })
)(UserWallet);
