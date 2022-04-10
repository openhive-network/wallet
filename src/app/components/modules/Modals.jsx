import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import CloseButton from 'app/components/elements/CloseButton';
import Reveal from 'app/components/elements/Reveal';
import { NotificationStack } from 'react-notification';
import tt from 'counterpart';
import * as userActions from 'app/redux/UserReducer';
import * as appActions from 'app/redux/AppReducer';
import * as transactionActions from 'app/redux/TransactionReducer';
import LoginForm from 'app/components/modules/LoginForm';
import ConfirmTransactionForm from 'app/components/modules/ConfirmTransactionForm';
import Transfer from 'app/components/modules/Transfer';
import DecodeMemo from 'app/components/modules/DecodeMemo';
import SignUp from 'app/components/modules/SignUp';
import Powerdown from 'app/components/modules/Powerdown';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import TermsAgree from 'app/components/modules/TermsAgree';

class Modals extends React.Component {
    static defaultProps = {
        username: '',
        notifications: undefined,
        removeNotification: () => {},
        show_terms_modal: false,
        show_signup_modal: false,
        show_bandwidth_error_modal: false,
        show_powerdown_modal: false,
        show_transfer_modal: false,
        show_decode_memo_modal: false,
        show_confirm_modal: false,
        show_login_modal: false,
        memo_message: '',
        show_hive_auth_modal: false,
        hideHiveAuthModal: () => {},
    };

    static propTypes = {
        show_login_modal: PropTypes.bool,
        show_confirm_modal: PropTypes.bool,
        show_transfer_modal: PropTypes.bool,
        show_decode_memo_modal: PropTypes.bool,
        show_powerdown_modal: PropTypes.bool,
        show_bandwidth_error_modal: PropTypes.bool,
        show_signup_modal: PropTypes.bool,
        hideLogin: PropTypes.func.isRequired,
        username: PropTypes.string,
        hideConfirm: PropTypes.func.isRequired,
        hideSignUp: PropTypes.func.isRequired,
        hideTransfer: PropTypes.func.isRequired,
        hidePowerdown: PropTypes.func.isRequired,
        hideBandwidthError: PropTypes.func.isRequired,
        // eslint-disable-next-line react/forbid-prop-types
        notifications: PropTypes.object,
        show_terms_modal: PropTypes.bool,
        removeNotification: PropTypes.func,
        memo_message: PropTypes.string,
        show_hive_auth_modal: PropTypes.bool,
        hideHiveAuthModal: PropTypes.func,
    };

    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Modals');
    }

    render() {
        const {
            show_login_modal,
            show_confirm_modal,
            show_transfer_modal,
            show_decode_memo_modal,
            show_powerdown_modal,
            show_signup_modal,
            show_bandwidth_error_modal,
            hideLogin,
            hideTransfer,
            hideDecodeMemo,
            hidePowerdown,
            hideConfirm,
            hideSignUp,
            show_terms_modal,
            notifications,
            removeNotification,
            hideBandwidthError,
            username,
            memo_message,
            show_hive_auth_modal,
            hideHiveAuthModal,
        } = this.props;

        const notifications_array = notifications
            ? notifications.toArray().map((n) => {
                  n.onClick = () => removeNotification(n.key);
                  return n;
              })
            : [];

        const buyHivePower = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location = 'https://blocktrades.us/en/trade' + username;
        };

        return (
            <div>
                {show_login_modal && (
                    <Reveal onHide={hideLogin} show={show_login_modal}>
                        <LoginForm onCancel={hideLogin} />
                    </Reveal>
                )}
                {show_confirm_modal && (
                    <Reveal onHide={hideConfirm} show={show_confirm_modal}>
                        <CloseButton onClick={hideConfirm} />
                        <ConfirmTransactionForm onCancel={hideConfirm} />
                    </Reveal>
                )}
                {show_transfer_modal && (
                    <Reveal onHide={hideTransfer} show={show_transfer_modal}>
                        <CloseButton onClick={hideTransfer} />
                        <Transfer />
                    </Reveal>
                )}
                {show_decode_memo_modal && (
                    <Reveal
                        onHide={hideDecodeMemo}
                        show={show_decode_memo_modal}
                    >
                        <CloseButton onClick={hideDecodeMemo} />
                        <DecodeMemo message={memo_message} />
                    </Reveal>
                )}
                {show_powerdown_modal && (
                    <Reveal onHide={hidePowerdown} show={show_powerdown_modal}>
                        <CloseButton onClick={hidePowerdown} />
                        <Powerdown />
                    </Reveal>
                )}
                {show_signup_modal && (
                    <Reveal onHide={hideSignUp} show={show_signup_modal}>
                        <CloseButton onClick={hideSignUp} />
                        <SignUp />
                    </Reveal>
                )}
                {show_terms_modal && (
                    <Reveal show={show_terms_modal}>
                        <TermsAgree onCancel={hideLogin} />
                    </Reveal>
                )}
                {show_bandwidth_error_modal && (
                    <Reveal
                        onHide={hideBandwidthError}
                        show={show_bandwidth_error_modal}
                    >
                        <div>
                            <CloseButton onClick={hideBandwidthError} />
                            <h4>{tt('modals_jsx.your_transaction_failed')}</h4>
                            <hr />
                            <h5>{tt('modals_jsx.out_of_bandwidth_title')}</h5>
                            <p>{tt('modals_jsx.out_of_bandwidth_reason')}</p>
                            <p>{tt('modals_jsx.out_of_bandwidth_reason_2')}</p>
                            <p>
                                {tt('modals_jsx.out_of_bandwidth_option_title')}
                            </p>
                            <ol>
                                <li>
                                    {tt('modals_jsx.out_of_bandwidth_option_4')}
                                </li>
                                <li>
                                    {tt('modals_jsx.out_of_bandwidth_option_1')}
                                </li>
                                <li>
                                    {tt('modals_jsx.out_of_bandwidth_option_2')}
                                </li>
                                <li>
                                    {tt('modals_jsx.out_of_bandwidth_option_3')}
                                </li>
                            </ol>
                            <button type="button" className="button" onClick={buyHivePower}>
                                {tt('g.buy_hive_power')}
                            </button>
                        </div>
                    </Reveal>
                )}
                {show_hive_auth_modal && (
                    <Reveal onHide={hideHiveAuthModal} show={!!show_hive_auth_modal}>
                        <CloseButton onClick={hideHiveAuthModal} />
                        <div>
                            <div className="hiveauth-banner">
                                <img
                                    src="/images/hiveauth-banner-light.png"
                                    alt="HiveAuth"
                                    width="100%"
                                />
                            </div>
                            <div
                                className="hiveauth-instructions"
                                id="hive-auth-instructions"
                            >
                                {tt('hiveauthservices.pleaseWait')}
                            </div>
                        </div>
                    </Reveal>
                )}
                <NotificationStack
                    notifications={notifications_array}
                    onDismiss={(n) => removeNotification(n.key)}
                />
            </div>
        );
    }
}

export default connect(
    (state) => {
        return {
            username: state.user.getIn(['current', 'username']),
            show_login_modal: state.user.get('show_login_modal'),
            show_confirm_modal: state.transaction.get('show_confirm_modal'),
            show_transfer_modal: state.user.get('show_transfer_modal'),
            show_decode_memo_modal: state.user.get('show_decode_memo_modal'),
            show_powerdown_modal: state.user.get('show_powerdown_modal'),
            show_signup_modal: state.user.get('show_signup_modal'),
            memo_message: state.user.get('memo_message'),
            notifications: state.app.get('notifications'),
            show_terms_modal: state.user.get('show_terms_modal')
                && state.routing.locationBeforeTransitions.pathname !== '/tos.html'
                && state.routing.locationBeforeTransitions.pathname !== '/privacy.html',
            show_bandwidth_error_modal: state.transaction.getIn(['errors', 'bandwidthError']),
            show_hive_auth_modal: state.user.get('show_hive_auth_modal'),
        };
    },
    (dispatch) => ({
        hideLogin: (e) => {
            if (e) e.preventDefault();
            dispatch(userActions.hideLogin());
        },
        hideConfirm: (e) => {
            if (e) e.preventDefault();
            dispatch(transactionActions.hideConfirm());
        },
        hideTransfer: (e) => {
            if (e) e.preventDefault();
            dispatch(userActions.hideTransfer());
        },
        hideDecodeMemo: (e) => {
            if (e) e.preventDefault();
            dispatch(userActions.hideDecodeMemo());
        },
        hidePowerdown: (e) => {
            if (e) e.preventDefault();
            dispatch(userActions.hidePowerdown());
        },
        hideSignUp: (e) => {
            if (e) e.preventDefault();
            dispatch(userActions.hideSignUp());
        },
        hideBandwidthError: (e) => {
            if (e) e.preventDefault();
            dispatch(
                transactionActions.dismissError({ key: 'bandwidthError' })
            );
        },
        hideHiveAuthModal: (e) => {
            if (e) e.preventDefault();
            dispatch(userActions.hideHiveAuthModal());
        },
        // example: addNotification: ({key, message}) => dispatch({type: 'ADD_NOTIFICATION', payload: {key, message}}),
        removeNotification: (key) => dispatch(appActions.removeNotification({ key })),
    })
)(Modals);
