import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import reactForm from 'app/utils/ReactForm';
import { Map, List, OrderedSet } from 'immutable';
import Autocomplete from 'react-autocomplete';
import tt from 'counterpart';

import * as transactionActions from 'app/redux/TransactionReducer';
import * as userActions from 'app/redux/UserReducer';
import * as globalActions from 'app/redux/GlobalReducer';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import ConfirmTransfer from 'app/components/elements/ConfirmTransfer';
import ConfirmDelegationTransfer from 'app/components/elements/ConfirmDelegationTransfer';
import runTests, { browserTests } from 'app/utils/BrowserTests';
import {
    validate_account_name_with_memo,
    validate_memo_field,
} from 'app/utils/ChainValidation';
import { countDecimals } from 'app/utils/ParsersAndFormatters';
import { APP_NAME, LIQUID_TOKEN, VESTING_TOKEN } from 'app/client_config';

/** Warning .. This is used for Power UP too. */
class TransferForm extends Component {
    static propTypes = {
        // redux
        currentUser: PropTypes.object.isRequired,
        toVesting: PropTypes.bool.isRequired,
        toDelegate: PropTypes.bool.isRequired,
        currentAccount: PropTypes.object.isRequired,
        following: PropTypes.object.isRequired,
        totalVestingFund: PropTypes.number.isRequired,
        totalVestingShares: PropTypes.number.isRequired,
    };

    static defaultProps = {
        following: OrderedSet([]),
    };

    constructor(props) {
        super();
        const { transferToSelf } = props;
        this.state = {
            advanced: !transferToSelf,
            transferTo: false,
            autocompleteUsers: [],
        };
        this.initForm(props);
    }

    componentDidMount() {
        setTimeout(() => {
            const { advanced } = this.state;
            if (advanced) this.to.focus();
            else ReactDOM.findDOMNode(this.refs.amount).focus();
        }, 300);

        runTests();

        this.buildTransferAutocomplete();
    }

    buildTransferAutocomplete() {
        // Get names for the recent account transfers
        const labelPreviousTransfers = tt(
            'transfer_jsx.autocomplete_previous_transfers'
        );
        const labelFollowingUser = tt(
            'transfer_jsx.autocomplete_user_following'
        );

        const transferToLog = this.props.currentAccount
            .get('transfer_history', List())
            .reduce((acc, cur) => {
                if (cur.getIn([1, 'op', 0]) === 'transfer') {
                    const username = cur.getIn([1, 'op', 1, 'to']);
                    const numTransfers = acc.get(username)
                        ? acc.get(username).numTransfers + 1
                        : 1;
                    return acc.set(username, {
                        username,
                        label: `${numTransfers} ${labelPreviousTransfers}`,
                        numTransfers,
                    });
                }
                return acc;
            }, Map())
            .remove(this.props.currentUser.get('username'));

        // Build a combined list of users you follow & have previously transferred to,
        // and sort it by 1. desc the number of previous transfers 2. username asc.
        this.setState({
            autocompleteUsers: this.props.following
                .toOrderedMap()
                .map((username) => ({
                    username,
                    label: labelFollowingUser,
                    numTransfers: 0,
                }))
                .merge(transferToLog)
                .sortBy(null, (a, b) => {
                    //prioritize sorting by number of transfers
                    if (a.numTransfers > b.numTransfers) {
                        return -1;
                    }
                    if (b.numTransfers > a.numTransfers) {
                        return 1;
                    }
                    //if transfer number is the same, sort by username
                    if (a.username > b.username) {
                        return 1;
                    }
                    if (b.username > a.username) {
                        return -1;
                    }
                    return 0;
                })
                .toArray(),
        });
    }

    matchAutocompleteUser(item, value) {
        return item.username.toLowerCase().indexOf(value.toLowerCase()) > -1;
    }

    onAdvanced = (e) => {
        e.preventDefault(); // prevent form submission!!
        const username = this.props.currentUser.get('username');
        this.state.to.props.onChange(username);
        // setTimeout(() => {ReactDOM.findDOMNode(this.refs.amount).focus()}, 300)
        this.setState({ advanced: !this.state.advanced });
    };

    initForm(props) {
        const { transferType, isDelegate } = props.initialValues;
        const insufficientFunds = (asset, amount) => {
            const { currentAccount } = props;
            const isWithdraw =
                transferType && transferType === 'Savings Withdraw';
            const balanceValue =
                !asset || asset === 'HIVE'
                    ? isWithdraw
                        ? currentAccount.get('savings_balance')
                        : currentAccount.get('balance')
                    : asset === 'HBD'
                    ? isWithdraw
                        ? currentAccount.get('savings_hbd_balance')
                        : currentAccount.get('hbd_balance')
                    : null;
            if (!balanceValue) return false;
            const balance = balanceValue.split(' ')[0];
            return parseFloat(amount) > parseFloat(balance);
        };
        const { toVesting, toDelegate } = props;
        const fields = toVesting ? ['to', 'amount'] : ['to', 'amount', 'asset'];
        if (
            !toVesting &&
            transferType !== 'Transfer to Savings' &&
            transferType !== 'Savings Withdraw'
        )
            if (!toDelegate) {
                fields.push('memo');
            }
        reactForm({
            name: 'transfer',
            instance: this,
            fields,
            initialValues: props.initialValues,
            validation: (values) => {
                let asset = props.toVesting
                    ? null
                    : !values.asset
                    ? tt('g.required')
                    : null;

                const validationResult = {
                    to: !values.to
                        ? tt('g.required')
                        : validate_account_name_with_memo(
                              values.to,
                              values.memo
                          ),
                    amount: !values.amount
                        ? 'Required'
                        : !/^\d+(\.\d+)?$/.test(values.amount)
                        ? tt('transfer_jsx.amount_is_in_form')
                        : insufficientFunds(values.asset, values.amount)
                        ? tt('transfer_jsx.insufficient_funds')
                        : countDecimals(values.amount) > 3
                        ? tt('transfer_jsx.use_only_3_digits_of_precison')
                        : null,
                    asset,
                    memo: values.memo
                        ? validate_memo_field(
                              values.memo,
                              props.currentUser.get('username'),
                              props.currentAccount.get('memo_key')
                          )
                        : values.memo &&
                          !browserTests.memo_encryption &&
                          /^#/.test(values.memo)
                        ? 'Encrypted memos are temporarily unavailable (issue #98)'
                        : null,
                };
                return validationResult;
            },
        });
    }

    clearError = () => {
        this.setState({ trxError: undefined });
    };

    errorCallback = (estr) => {
        this.setState({ trxError: estr, loading: false });
    };

    balanceValue() {
        const { transferType } = this.props.initialValues;
        const {
            currentAccount,
            toDelegate,
            totalVestingShares,
            totalVestingFund,
        } = this.props;
        const { asset } = this.state;
        const isWithdraw = transferType && transferType === 'Savings Withdraw';
        let balanceValue =
            !asset || asset.value === 'HIVE'
                ? isWithdraw
                    ? currentAccount.get('savings_balance')
                    : currentAccount.get('balance')
                : asset.value === 'HBD'
                ? isWithdraw
                    ? currentAccount.get('savings_hbd_balance')
                    : currentAccount.get('hbd_balance')
                : null;
        if (toDelegate) {
            balanceValue = currentAccount.get('savings_balance');
            const vestingShares = parseFloat(
                currentAccount.get('vesting_shares')
            );
            const toWithdraw = parseFloat(currentAccount.get('to_withdraw'));
            const withdrawn = parseFloat(currentAccount.get('withdrawn'));
            const delegatedVestingShares = parseFloat(
                currentAccount.get('delegated_vesting_shares')
            );

            // Available Vests Calculation.
            const avail =
                vestingShares -
                (toWithdraw - withdrawn) / 1e6 -
                delegatedVestingShares;
            // Representation of available Vests as Hive.
            const vestSteem = totalVestingFund * (avail / totalVestingShares);

            balanceValue = `${vestSteem.toFixed(3)} HIVE`;
        }
        return balanceValue;
    }

    assetBalanceClick = (e) => {
        e.preventDefault();
        const { state } = this;
        state.amount.props.onChange(parseFloat(this.balanceValue()).toFixed(3));
    };

    render() {
        const transferTips = {
            'Transfer to Account': tt(
                'transfer_jsx.move_funds_to_another_account',
                { APP_NAME }
            ),
            'Transfer to Savings': tt(
                'transfer_jsx.protect_funds_by_requiring_a_3_day_withdraw_waiting_period'
            ),
            'Savings Withdraw': tt(
                'transfer_jsx.withdraw_funds_after_the_required_3_day_waiting_period'
            ),
        };
        const powerTip3 = tt(
            'tips_js.converted_VESTING_TOKEN_can_be_sent_to_yourself_but_can_not_transfer_again',
            { LIQUID_TOKEN, VESTING_TOKEN }
        );
        const { to, amount, asset, memo } = this.state;
        const { loading, trxError, advanced } = this.state;

        const {
            currentUser,
            currentAccount,
            toVesting,
            toDelegate,
            transferToSelf,
            dispatchSubmit,
            totalVestingFund,
            totalVestingShares,
        } = this.props;
        const { transferType } = this.props.initialValues;
        const { submitting, valid, handleSubmit } = this.state.transfer;
        // const isMemoPrivate = memo && /^#/.test(memo.value); -- private memos are not supported yet
        const isMemoPrivate = false;

        const form = (
            <form
                onSubmit={handleSubmit(({ data }) => {
                    this.setState({ loading: true });
                    dispatchSubmit({
                        ...data,
                        errorCallback: this.errorCallback,
                        currentUser,
                        toVesting,
                        toDelegate,
                        transferType,
                        totalVestingShares,
                        totalVestingFund,
                    });
                })}
                onChange={this.clearError}
            >
                {toVesting && (
                    <div className="row">
                        <div className="column small-12">
                            <p>{tt('tips_js.influence_token')}</p>
                            <p>
                                {tt('tips_js.non_transferable', {
                                    LIQUID_TOKEN,
                                    VESTING_TOKEN,
                                })}
                            </p>
                        </div>
                    </div>
                )}
                {!toVesting && (
                    <div>
                        <div className="row">
                            <div className="column small-12">
                                {transferTips[transferType]}
                            </div>
                        </div>
                        <br />
                    </div>
                )}

                <div className="row">
                    <div className="column small-2" style={{ paddingTop: 5 }}>
                        {tt('transfer_jsx.from')}
                    </div>
                    <div className="column small-10">
                        <div
                            className="input-group"
                            style={{ marginBottom: '1.25rem' }}
                        >
                            <span className="input-group-label">@</span>
                            <input
                                className="input-group-field bold"
                                type="text"
                                disabled
                                value={currentUser.get('username')}
                            />
                        </div>
                    </div>
                </div>

                {advanced && (
                    <div className="row">
                        <div
                            className="column small-2"
                            style={{ paddingTop: 5 }}
                        >
                            {tt('transfer_jsx.to')}
                        </div>
                        <div className="column small-10">
                            <div
                                className="input-group"
                                style={{ marginBottom: '1.25rem' }}
                            >
                                <span className="input-group-label">@</span>
                                <Autocomplete
                                    wrapperStyle={{
                                        display: 'inline-block',
                                        width: '100%',
                                    }}
                                    inputProps={{
                                        type: 'text',
                                        className: 'input-group-field',
                                        autoComplete: 'off',
                                        autoCorrect: 'off',
                                        autoCapitalize: 'off',
                                        spellCheck: 'false',
                                        disabled: loading,
                                    }}
                                    renderMenu={(items) => (
                                        <div
                                            className="react-autocomplete-input"
                                            children={items}
                                        />
                                    )}
                                    ref={(el) => (this.to = el)}
                                    getItemValue={(item) => item.username}
                                    items={this.state.autocompleteUsers}
                                    shouldItemRender={
                                        this.matchAutocompleteUser
                                    }
                                    renderItem={(item, isHighlighted) => (
                                        <div
                                            className={
                                                isHighlighted ? 'active' : ''
                                            }
                                        >
                                            {`${item.username} (${item.label})`}
                                        </div>
                                    )}
                                    value={this.state.to.value || ''}
                                    onChange={(e) => {
                                        this.setState({
                                            to: {
                                                ...this.state.to,
                                                touched: true,
                                                value: e.target.value,
                                            },
                                        });
                                    }}
                                    onSelect={(val) =>
                                        this.setState({
                                            to: {
                                                ...this.state.to,
                                                value: val,
                                            },
                                        })
                                    }
                                />
                            </div>
                            {to.touched && to.error ? (
                                <div className="error">{to.error}&nbsp;</div>
                            ) : (
                                <p>{toVesting && powerTip3}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="row">
                    <div className="column small-2" style={{ paddingTop: 5 }}>
                        {tt('g.amount')}
                    </div>
                    <div className="column small-10">
                        <div
                            className="input-group"
                            style={{ marginBottom: 5 }}
                        >
                            <input
                                type="text"
                                placeholder={tt('g.amount')}
                                {...amount.props}
                                ref="amount"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                disabled={loading}
                            />
                            {asset && asset.value !== 'VESTS' && (
                                <span
                                    className="input-group-label"
                                    style={{ paddingLeft: 0, paddingRight: 0 }}
                                >
                                    <select
                                        {...asset.props}
                                        placeholder={tt('transfer_jsx.asset')}
                                        disabled={loading}
                                        style={{
                                            minWidth: '5rem',
                                            height: 'inherit',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                        }}
                                    >
                                        <option value="HIVE">HIVE</option>
                                        <option value="HBD">HBD</option>
                                    </select>
                                </span>
                            )}
                            {asset && asset.value === 'VESTS' && (
                                <span
                                    className="input-group-label"
                                    style={{ paddingLeft: 0, paddingRight: 0 }}
                                >
                                    <select
                                        {...asset.props}
                                        placeholder={tt('transfer_jsx.asset')}
                                        disabled={loading}
                                        style={{
                                            minWidth: '5rem',
                                            height: 'inherit',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                        }}
                                    >
                                        <option value="HIVE">HIVE</option>
                                    </select>
                                </span>
                            )}
                        </div>
                        <div style={{ marginBottom: '0.6rem' }}>
                            <AssetBalance
                                balanceValue={this.balanceValue()}
                                onClick={this.assetBalanceClick}
                            />
                        </div>
                        {(asset && asset.touched && asset.error) ||
                        (amount.touched && amount.error) ? (
                            <div className="error">
                                {asset &&
                                    asset.touched &&
                                    asset.error &&
                                    asset.error}
                                &nbsp;
                                {amount.touched && amount.error && amount.error}
                                &nbsp;
                            </div>
                        ) : null}
                    </div>
                </div>

                {memo && (
                    <div className="row">
                        <div
                            className="column small-2"
                            style={{ paddingTop: 33 }}
                        >
                            {tt('g.memo')}
                        </div>
                        <div className="column small-10">
                            <small>
                                {isMemoPrivate
                                    ? tt('transfer_jsx.this_memo_is_private')
                                    : tt('transfer_jsx.this_memo_is_public')}
                            </small>
                            <input
                                type="text"
                                placeholder={tt('g.memo')}
                                {...memo.props}
                                ref="memo"
                                autoComplete="on"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                disabled={loading}
                            />
                            <div className="error">
                                {memo.touched && memo.error && memo.error}&nbsp;
                            </div>
                        </div>
                    </div>
                )}
                <div className="row">
                    <div className="column">
                        {loading && (
                            <span>
                                <LoadingIndicator type="circle" />
                                <br />
                            </span>
                        )}
                        {!loading && (
                            <span>
                                {trxError && (
                                    <div className="error">{trxError}</div>
                                )}
                                <button
                                    type="submit"
                                    disabled={submitting || !valid}
                                    className="button"
                                >
                                    {toVesting
                                        ? tt('g.power_up')
                                        : tt('g.next')}
                                </button>
                                {transferToSelf && (
                                    <button
                                        className="button hollow no-border"
                                        disabled={submitting}
                                        onClick={this.onAdvanced}
                                    >
                                        {advanced
                                            ? tt('g.basic')
                                            : tt('g.advanced')}
                                    </button>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </form>
        );
        return (
            <div>
                <div className="row">
                    <h3 className="column">
                        {toVesting
                            ? tt('transfer_jsx.convert_to_VESTING_TOKEN', {
                                  VESTING_TOKEN,
                              })
                            : transferType}
                    </h3>
                </div>
                {form}
            </div>
        );
    }
}

const AssetBalance = ({ onClick, balanceValue }) => {
    return (
        <a
            onClick={onClick}
            style={{ borderBottom: '#A09F9F 1px dotted', cursor: 'pointer' }}
        >
            {tt('g.balance', { balanceValue })}
        </a>
    );
};

import { connect } from 'react-redux';

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const totalVestingShares = state.global.getIn([
            'props',
            'total_vesting_shares',
        ])
            ? parseFloat(
                  state.global
                      .getIn(['props', 'total_vesting_shares'])
                      .split(' ')[0]
              )
            : 0;

        const totalVestingFund = state.global.getIn([
            'props',
            'total_vesting_fund_hive',
        ])
            ? parseFloat(
                  state.global
                      .getIn(['props', 'total_vesting_fund_hive'])
                      .split(' ')[0]
              )
            : 0;

        const initialValues = state.user.get('transfer_defaults', Map()).toJS();
        const toVesting = initialValues.asset === 'VESTS';
        const toDelegate = initialValues.asset === 'DELEGATE_VESTS';
        if (toDelegate) {
            initialValues.asset = 'VESTS';
        }
        const currentUser = state.user.getIn(['current']);
        const currentAccount = state.global.getIn([
            'accounts',
            currentUser.get('username'),
        ]);

        if (!toVesting && !initialValues.transferType)
            initialValues.transferType = 'Transfer to Account';

        let transferToSelf =
            toVesting ||
            /Transfer to Savings|Savings Withdraw/.test(
                initialValues.transferType
            );
        if (transferToSelf && !initialValues.to)
            initialValues.to = currentUser.get('username');

        if (initialValues.to !== currentUser.get('username'))
            transferToSelf = false; // don't hide the to field

        return {
            ...ownProps,
            currentUser,
            currentAccount,
            toVesting,
            toDelegate,
            transferToSelf,
            initialValues,
            following: state.global.getIn([
                'follow',
                'getFollowingAsync',
                currentUser.get('username'),
                'blog_result',
            ]),
            totalVestingFund,
            totalVestingShares,
        };
    },

    // mapDispatchToProps
    (dispatch) => ({
        dispatchSubmit: ({
            to,
            amount,
            asset,
            memo,
            transferType,
            toVesting,
            toDelegate,
            currentUser,
            errorCallback,
            totalVestingFund,
            totalVestingShares,
        }) => {
            if (
                !toVesting &&
                !/Transfer to Account|Transfer to Savings|Delegate to Account|Savings Withdraw/.test(
                    transferType
                )
            )
                throw new Error(
                    `Invalid transfer params: toVesting ${toVesting}, transferType ${transferType}`
                );

            const username = currentUser.get('username');
            const successCallback = () => {
                // refresh transfer history
                dispatch(
                    globalActions.getState({ url: `@${username}/transfers` })
                );
                if (/Savings Withdraw/.test(transferType)) {
                    dispatch(userActions.loadSavingsWithdraw({}));
                }
                dispatch(userActions.hideTransfer());
            };
            let asset2 = toVesting ? 'HIVE' : asset;
            // If toDelegate, there is no asset to...
            if (toDelegate) {
                asset2 = 'VESTS';
            }
            let operation = {
                from: username,
                to,
                amount: parseFloat(amount, 10).toFixed(3) + ' ' + asset2,
                memo: toVesting ? undefined : memo ? memo : '',
            };
            let confirm = () => <ConfirmTransfer operation={operation} />;
            if (transferType === 'Savings Withdraw')
                operation.request_id = Math.floor(
                    (Date.now() / 1000) % 4294967295
                );

            let transactionType = toVesting
                ? 'transfer_to_vesting'
                : transferType === 'Transfer to Account'
                ? 'transfer'
                : transferType === 'Transfer to Savings'
                ? 'transfer_to_savings'
                : transferType === 'Savings Withdraw'
                ? 'transfer_from_savings'
                : null;

            if (toDelegate) {
                // Convert amount in steem to vests...
                const amountSteemAsVests =
                    (amount * totalVestingShares) / totalVestingFund;
                operation = {
                    delegator: username,
                    delegatee: to,
                    vesting_shares:
                        parseFloat(amountSteemAsVests, 10).toFixed(6) +
                        ' ' +
                        asset2,
                };

                confirm = () => (
                    <ConfirmDelegationTransfer
                        operation={operation}
                        amount={amount}
                    />
                );

                transactionType = 'delegate_vesting_shares';
            }

            dispatch(
                transactionActions.broadcastOperation({
                    type: transactionType,
                    operation,
                    successCallback,
                    errorCallback,
                    confirm,
                })
            );
        },
    })
)(TransferForm);
