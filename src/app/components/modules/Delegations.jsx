/* eslint react/prop-types: 0 */
import React from 'react';
import { connect } from 'react-redux';
import tt from 'counterpart';
import WalletSubMenu from 'app/components/elements/WalletSubMenu';
import ConfirmDelegationTransfer from 'app/components/elements/ConfirmDelegationTransfer';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import * as userActions from 'app/redux/UserReducer';
import * as transactionActions from 'app/redux/TransactionReducer';
import * as appActions from 'app/redux/AppReducer';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';

class Delegations extends React.Component {
    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Delegations');
    }

    componentWillMount() {
        const { props } = this;
        props.vestingDelegationsLoading(true);
        props.getVestingDelegations(props.account.get('name'), (err, res) => {
            props.setVestingDelegations(res);
            props.vestingDelegationsLoading(false);
        });
    }

    render() {
        const {
            account,
            currentUser,
            vestingDelegations,
            totalVestingFund,
            totalVestingShares,
            vestingDelegationsPending,
            revokeDelegation,
            getVestingDelegations,
            setVestingDelegations,
            vestingDelegationsLoading,
        } = this.props;

        const convertVestsToSteem = (vests) => {
            return ((vests * totalVestingFund) / totalVestingShares).toFixed(2);
        };

        const isMyAccount =
            currentUser && currentUser.get('username') === account.get('name');
        // do not render if account is not loaded or available
        if (!account) return null;

        // do not render if state appears to contain only lite account info
        if (!account.has('vesting_shares')) return null;

        const showTransferHandler = (delegatee) => {
            const { accountProp } = this.props;
            const refetchCB = () => {
                vestingDelegationsLoading(true);
                getVestingDelegations(accountProp.get('name'), (err, res) => {
                    setVestingDelegations(res);
                    vestingDelegationsLoading(false);
                });
            };
            revokeDelegation(accountProp.get('name'), delegatee, refetchCB);
        };

        /// transfer log
        // https://github.com/steemit/steem-js/tree/master/doc#get-vesting-delegations
        const delegation_log = vestingDelegations ? (
            vestingDelegations.map((item) => {
                const vestsAsSteem = convertVestsToSteem(
                    parseFloat(item.vesting_shares)
                );
                return (
                    <tr
                        key={`${item.delegator}--${item.delegatee}--${item.min_delegation_time}`}
                    >
                        <td className="red">{vestsAsSteem} HP</td>
                        <td>{item.delegatee}</td>
                        <td>
                            <TimeAgoWrapper date={item.min_delegation_time} />
                        </td>
                        {isMyAccount && (
                            <td>
                                <button
                                    className="delegations__revoke button hollow"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        showTransferHandler(item.delegatee);
                                    }}
                                    type="button"
                                >
                                    {' '}
                                    {tt('delegations_jsx.revoke')}{' '}
                                </button>
                            </td>
                        )}
                    </tr>
                );
            })
        ) : (
            <tr>
                <td>No Delegations Found</td>
            </tr>
        );

        return (
            <div className="UserWallet">
                <div className="row">
                    <div className="columns small-10 medium-12 medium-expand">
                        <WalletSubMenu
                            accountname={account.get('name')}
                            isMyAccount={isMyAccount}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="column small-12">
                        <h4>{tt('delegations_jsx.delegations')}</h4>
                        {vestingDelegationsPending && (
                            <LoadingIndicator type="circle" />
                        )}
                        <table>
                            <tbody>{delegation_log}</tbody>
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
        const vestingDelegations = state.user.get('vestingDelegations');

        const vestingDelegationsPending = state.user.get(
            'vestingDelegationsLoading'
        );
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
            'total_vesting_fund_steem',
        ])
            ? parseFloat(
                  state.global
                      .getIn(['props', 'total_vesting_fund_steem'])
                      .split(' ')[0]
              )
            : 0;
        return {
            ...ownProps,
            vestingDelegations,
            totalVestingShares,
            totalVestingFund,
            vestingDelegationsPending,
        };
    },
    // mapDispatchToProps
    (dispatch) => ({
        getVestingDelegations: (account, successCallback) => {
            dispatch(
                userActions.getVestingDelegations({ account, successCallback })
            );
        },
        setVestingDelegations: (payload) => {
            dispatch(userActions.setVestingDelegations(payload));
        },
        vestingDelegationsLoading: (payload) => {
            dispatch(userActions.vestingDelegationsLoading(payload));
        },
        revokeDelegation: (username, to, refetchDelegations) => {
            const vests = parseFloat(0, 10).toFixed(6);
            const operation = {
                delegator: username,
                delegatee: to,
                // Revoke is always 0
                // eslint-disable-next-line no-useless-concat
                vesting_shares: `${vests} VESTS`,
            };

            const confirm = () => (
                <ConfirmDelegationTransfer operation={operation} amount={0.0} />
            );

            const transactionType = 'delegate_vesting_shares';
            const successCallback = () => {
                dispatch(
                    appActions.addNotification({
                        key: 'Revoke Delegation',
                        message: 'Delegation Successfully Revoked.',
                    })
                );
                refetchDelegations();
            };
            const errorCallback = () => {
                dispatch(
                    appActions.addNotification({
                        key: 'Revoke Delegation',
                        message: 'Delegation failed to revoke.',
                    })
                );
            };

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
)(Delegations);
