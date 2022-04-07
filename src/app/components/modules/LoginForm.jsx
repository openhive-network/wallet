/* global $STM_Config */
/* eslint react/prop-types: 0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Map } from 'immutable';
import * as transactionActions from 'app/redux/TransactionReducer';
import * as globalActions from 'app/redux/GlobalReducer';
import { validate_account_name } from 'app/utils/ChainValidation';
import { hasCompatibleKeychain } from 'app/utils/HiveKeychain';
import runTests from 'app/utils/BrowserTests';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import reactForm from 'app/utils/ReactForm';
import { serverApiRecordEvent } from 'app/utils/ServerApiClient';
import tt from 'counterpart';
import { APP_URL } from 'app/client_config';
import { PrivateKey, PublicKey } from '@hiveio/hive-js/lib/auth/ecc';
import { SIGNUP_URL } from 'shared/constants';
import { hiveSignerClient } from 'app/utils/HiveSigner';
import { getQueryStringParams } from 'app/utils/Links';

import { connect } from 'react-redux';
import * as userActions from '../../redux/UserReducer';

class LoginForm extends Component {
    static propTypes = {
        loginError: PropTypes.string,
        onCancel: PropTypes.func,
    };

    static defaultProps = {
        loginError: '',
        onCancel: undefined,
    };

    constructor(props) {
        super();
        const cryptoTestResult = runTests();
        let cryptographyFailure = false;
        const isHiveSigner = false;
        this.SignUp = this.SignUp.bind(this);
        if (cryptoTestResult !== undefined) {
            console.error(
                'CreateAccount - cryptoTestResult: ',
                cryptoTestResult
            );
            cryptographyFailure = true;
        }

        this.state = { cryptographyFailure, isHiveSigner, isProcessingHiveAuth: false };
        this.usernameOnChange = (e) => {
            const value = e.target.value.toLowerCase();
            this.state.username.props.onChange(value);
        };
        this.onCancel = (e) => {
            if (e.preventDefault) e.preventDefault();
            const { onCancel, loginBroadcastOperation } = this.props;
            const errorCallback = loginBroadcastOperation && loginBroadcastOperation.get('errorCallback');
            if (errorCallback) errorCallback('Canceled');
            if (onCancel) onCancel();
        };
        this.qrReader = () => {
            const { qrReader } = props;
            const { password } = this.state;
            qrReader((data) => {
                password.props.onChange(data);
            });
        };
        this.initForm(props);
    }

    componentWillMount() {
        this.loginWithHiveSigner();
    }

    componentDidMount() {
        if (this.refs.username && !this.refs.username.value) this.refs.username.focus();
        if (this.refs.username && this.refs.username.value) this.refs.pw.focus();
    }

    componentDidUpdate() {
        const { loginError } = this.props;
        if (loginError && this.state.isProcessingHiveAuth) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({ isProcessingHiveAuth: false });
        }
    }

    shouldComponentUpdate = shouldComponentUpdate(this, 'LoginForm');

    initForm(props) {
        reactForm({
            name: 'login',
            instance: this,
            fields: ['username', 'password', 'saveLogin:checked', 'useKeychain:checked', 'useHiveAuth:checked'],
            initialValues: props.initialValues,
            validation: (values) => ({
                username: !values.username
                    ? tt('g.required')
                    : validate_account_name(values.username.split('/')[0]),
                password: values.useKeychain
                    ? null
                    : values.useHiveAuth
                        ? null
                        : !values.password
                            ? tt('g.required')
                            : PublicKey.fromString(values.password)
                                ? tt('loginform_jsx.you_need_a_private_password_or_key')
                                : null,
            }),
        });
    }

    SignUp() {
        const opAction = document.getElementsByClassName('OpAction')[0];
        const onType = opAction ? opAction.textContent : 'Login';
        serverApiRecordEvent('FreeMoneySignUp', onType);
        window.location.href = SIGNUP_URL;
    }

    SignIn() {
        const opAction = document.getElementsByClassName('OpAction')[0];
        const onType = opAction ? opAction.textContent : 'Login';
        serverApiRecordEvent('SignIn', onType);
    }

    useKeychainToggle = () => {
        const { useKeychain, useHiveAuth } = this.state;
        useKeychain.props.onChange(!useKeychain.value);
        useHiveAuth.props.onChange(false);
    };

    useHiveAuthToggle = () => {
        const { useHiveAuth, useKeychain } = this.state;
        useHiveAuth.props.onChange(!useHiveAuth.value);
        useKeychain.props.onChange(false);
    };

    saveLoginToggle = () => {
        const { saveLogin } = this.state;
        saveLoginDefault = !saveLoginDefault;
        localStorage.setItem('saveLogin', saveLoginDefault ? 'yes' : 'no');
        saveLogin.props.onChange(saveLoginDefault); // change UI
    };

    showChangePassword = () => {
        const { username, password } = this.state;
        this.props.showChangePassword(username.value, password.value);
    };

    onClickHiveSignerBtn = () => {
        const { saveLogin } = this.state;
        const { afterLoginRedirectToWelcome } = this.props;
        hiveSignerClient.login({
            state: JSON.stringify({
                lastPath: window.location.pathname,
                saveLogin: saveLogin.value,
                afterLoginRedirectToWelcome,
            }),
        });
    };

    loginWithHiveSigner = () => {
        const path = window.location.pathname;
        if (path === '/login/hivesigner') {
            this.setState({
                isHiveSigner: true,
            });
            const params = getQueryStringParams(window.location.search);
            const {
              username, access_token, expires_in, state
            } = params;
            const {
                saveLogin,
                afterLoginRedirectToWelcome,
                lastPath,
            } = JSON.parse(decodeURI(state));
            const { reallySubmit, loginBroadcastOperation } = this.props;
            const data = {
                username,
                access_token,
                expires_in,
                saveLogin,
                loginBroadcastOperation,
                useHiveSigner: true,
                lastPath,
            };
            console.log('login:hivesigner', data);
            reallySubmit(data, afterLoginRedirectToWelcome);
        }
    };

    render() {
        const loginType = this.props.loginType;

        if (!process.env.BROWSER) {
            return (
                <div className="row">
                    <div className="column">
                        <p>
                            loading
                            ...
                        </p>
                    </div>
                </div>
            );
        }
        if (this.state.cryptographyFailure) {
            return (
                <div className="row">
                    <div className="column">
                        <div className="callout alert">
                            <h4>
                                {tt('loginform_jsx.cryptography_test_failed')}
                            </h4>
                            <p>{tt('loginform_jsx.unable_to_log_you_in')}</p>
                            <p>
                                {tt('loginform_jsx.the_latest_versions_of')}
                                {' '}
                                <a href="https://www.google.com/chrome/">
                                    Chrome
                                </a>
                                {' '}
                                {tt('g.and')}
                                {' '}
                                <a href="https://www.mozilla.org/en-US/firefox/new/">
                                    Firefox
                                </a>
                                {' '}
                                {tt(
                                    'loginform_jsx.are_well_tested_and_known_to_work_with',
                                    { APP_URL }
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if ($STM_Config.read_only_mode) {
            return (
                <div className="row">
                    <div className="column">
                        <div className="callout alert">
                            <p>
                                {tt('loginform_jsx.due_to_server_maintenance')}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        const { loginBroadcastOperation, dispatchSubmit, msg } = this.props;
        const {
            username, password, useKeychain, useHiveAuth, saveLogin
        } = this.state;
        const { valid, handleSubmit } = this.state.login;
        const submitting = this.state.login.submitting || this.state.isHiveSigner || this.state.isProcessingHiveAuth;
        const { usernameOnChange, onCancel /*qrReader*/ } = this;
        const disabled = submitting || !valid;
        const opType = loginBroadcastOperation
            ? loginBroadcastOperation.get('type')
            : null;
        let postType = '';
        if (opType === 'vote') {
            postType = tt('loginform_jsx.login_to_vote');
        } else if (loginBroadcastOperation) {
            // check for post or comment in operation
            postType = loginBroadcastOperation.getIn(['operation', 'title'])
                ? tt('loginform_jsx.login_to_post')
                : tt('g.confirm_password');
        }
        const title = postType ? postType : tt('g.login');
        const authType = /^vote|comment/.test(opType)
            ? tt('loginform_jsx.posting')
            : tt('loginform_jsx.active_or_owner');
        const submitLabel = loginBroadcastOperation
            ? tt('g.sign_in')
            : tt('g.login');
        let error = password.touched && password.error
                ? password.error
                : this.props.loginError;
        if (error === 'owner_login_blocked') {
            error = (
                <span>
                    {tt(
                        'loginform_jsx.this_password_is_bound_to_your_account_owner_key'
                    )}
                    {tt('loginform_jsx.however_you_can_use_it_to')}
                    <a role="link" tabIndex={0} onClick={this.showChangePassword}>
                        {tt('loginform_jsx.update_your_password')}
                    </a>
                    {' '}
                    {tt('loginform_jsx.to_obtain_a_more_secure_set_of_keys')}
                </span>
            );
        } else if (error === 'active_login_blocked') {
            error = (
                <span>
                    {tt(
                        'loginform_jsx.this_password_is_bound_to_your_account_active_key'
                    )}
                    {' '}
                    {tt(
                        'loginform_jsx.you_may_use_this_active_key_on_other_more'
                    )}
                </span>
            );
        }
        let message = null;
        if (msg) {
            if (msg === 'accountcreated') {
                message = (
                    <div className="callout primary">
                        <p>
                            {tt(
                                'loginform_jsx.you_account_has_been_successfully_created'
                            )}
                        </p>
                    </div>
                );
            } else if (msg === 'accountrecovered') {
                message = (
                    <div className="callout primary">
                        <p>
                            {tt(
                                'loginform_jsx.you_account_has_been_successfully_recovered'
                            )}
                        </p>
                    </div>
                );
            } else if (msg === 'passwordupdated') {
                message = (
                    <div className="callout primary">
                        <p>
                            {tt('loginform_jsx.password_update_success', {
                                accountName: username.value,
                            })}
                        </p>
                    </div>
                );
            }
        }
        const password_info = !useKeychain.value && !useHiveAuth.value && checkPasswordChecksum(password.value) === false
            ? tt('loginform_jsx.password_info')
            : null;

        const isTransfer = Map.isMap(loginBroadcastOperation)
            && loginBroadcastOperation.has('type')
            && loginBroadcastOperation
                .get('type')
                .toLowerCase()
                .indexOf('transfer') >= 0;

        let titleText;
        if (isTransfer) {
            titleText = (
                <h3>
                    <span className="OpAction">
                        {tt('loginform_jsx.sign_transfer')}
                    </span>
                </h3>
            );
        } else if (loginType === 'basic') {
            titleText = <h3>{tt('loginform_jsx.login_to_wallet')}</h3>;
        } else {
            titleText = (
                <h3>
                    {tt('loginform_jsx.returning_users')}
                    <span className="OpAction">{title}</span>
                </h3>
            );
        }

        const signupLink = (
            <div className="sign-up">
                <hr />
                <p>{tt('loginform_jsx.dont_have_an_account')}</p>
                <button
                    type="button"
                    className="button hollow"
                    onClick={this.SignUp}
                >
                    {tt('loginform_jsx.sign_up_get_hive')}
                </button>
            </div>
        );

        const form = (
            <form
                onSubmit={handleSubmit(({ data }) => {
                    // bind redux-form to react-redux
                    console.log('Login: dispatchSubmit', useKeychain.value, useHiveAuth.value);

                    if (useHiveAuth.value) {
                        this.setState({ isProcessingHiveAuth: true });
                    }

                    return dispatchSubmit(
                        data,
                        useKeychain.value,
                        useHiveAuth.value,
                        loginBroadcastOperation
                    );
                })}
                onChange={this.props.clearError}
                method="post"
            >
                <div className="input-group">
                    <span className="input-group-label">@</span>
                    <input
                        className="input-group-field"
                        type="text"
                        required
                        placeholder={tt('loginform_jsx.enter_your_username')}
                        ref="username"
                        {...username.props}
                        onChange={usernameOnChange}
                        autoComplete="on"
                        disabled={submitting || isTransfer}
                    />
                </div>
                {username.touched && username.blur && username.error ? (
                    <div className="error">
                        {username.error}
&nbsp;
                    </div>
                ) : null}

                {useKeychain.value || useHiveAuth.value ? (
                    <div>
                        {error && (
                            <div className="error">
                                {error}
&nbsp;
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <input
                            type="password"
                            required
                            ref="pw"
                            placeholder={
                                loginType === 'basic'
                                    ? tt('loginform_jsx.enter_hive_key')
                                    : tt('loginform_jsx.password_or_wif')
                            }
                            {...password.props}
                            autoComplete="on"
                            disabled={submitting}
                        />
                        {error && (
                        <div className="error">
                            {error}
&nbsp;
                        </div>
)}
                        {error && password_info && (
                            <div className="warning">
                                {password_info}
&nbsp;
                            </div>
                        )}
                    </div>
                )}
                {loginBroadcastOperation && (
                    <div>
                        <div className="info">
                            {tt(
                                'loginform_jsx.this_operation_requires_your_key_or_master_password',
                                { authType }
                            )}
                        </div>
                    </div>
                )}
                {hasCompatibleKeychain() && (
                    <div>
                        <label
                            className="LoginForm__save-login"
                            htmlFor="useKeychain"
                        >
                            <input
                                id="useKeychain"
                                type="checkbox"
                                {...useKeychain.props}
                                onChange={this.useKeychainToggle}
                                disabled={submitting}
                            />
                            &nbsp;
                            <img src="/images/hivekeychain.png" alt="Hive Keychain" width="16" />
                            &nbsp;
                            {tt('loginform_jsx.use_keychain')}
                        </label>
                    </div>
                )}
                <div>
                    <label className="LoginForm__save-login" htmlFor="useHiveAuth">
                        <input
                            id="useHiveAuth"
                            type="checkbox"
                            ref="pw"
                            {...useHiveAuth.props}
                            onChange={this.useHiveAuthToggle}
                            disabled={!hasError && submitting}
                        />
                        &nbsp;
                        <img src="/images/hiveauth.png" alt="HiveAuth" width="16" />
                        &nbsp;
                        {tt('loginform_jsx.use_hiveauth')}
                    </label>
                </div>
                <div>
                    <label
                        className="LoginForm__save-login"
                        htmlFor="saveLogin"
                    >
                        <input
                            id="saveLogin"
                            type="checkbox"
                            ref="pw"
                            {...saveLogin.props}
                            onChange={this.saveLoginToggle}
                            disabled={submitting}
                        />
                        &nbsp;
                        {tt('loginform_jsx.keep_me_logged_in')}
                    </label>
                </div>
                <div className="login-modal-buttons">
                    <br />
                    <button
                        type="submit"
                        disabled={submitting || disabled}
                        className="button"
                        onClick={this.SignIn}
                    >
                        {submitLabel}
                    </button>
                    {this.props.onCancel && (
                        <button
                            type="button"
                            disabled={submitting}
                            className="button hollow float-right"
                            onClick={onCancel}
                        >
                            {tt('g.cancel')}
                        </button>
                    )}
                </div>
                <div className="hiveauth_info">
                    <div id="hiveauth-instructions" className="hiveauth_instructions" />
                    <a
                        href="#"
                        id="hiveauth-qr-link"
                        className="hiveauth_qr"
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        <canvas id="hiveauth-qr" />
                    </a>
                </div>
            </form>
        );

        const moreLoginMethods = (
            <div className="row buttons">
                <div className="column">
                    <a
                        role="link"
                        tabIndex={0}
                        id="btn-hivesigner"
                        className="button"
                        onClick={this.onClickHiveSignerBtn}
                        disabled={submitting}
                    >
                        <img src="/images/hivesigner.svg" alt="Sign-in with HiveSigner" />
                    </a>
                </div>
            </div>
        );

        return (
            <div className="LoginForm">
                <div className="row">
                    <div className="column">
                        {message}
                        {titleText}
                        {form}
                    </div>
                </div>
                <div className="divider">
                    <span>{tt('loginform_jsx.more_login_methods')}</span>
                </div>
                <br />
                {moreLoginMethods}
                {!isTransfer && signupLink}
            </div>
        );
    }
}

let hasError;
let saveLoginDefault = true;
if (process.env.BROWSER) {
    const s = localStorage.getItem('saveLogin');
    if (s === 'no') saveLoginDefault = false;
}

function urlAccountName() {
    let suggestedAccountName = '';
    const account_match = window.location.hash.match(/account=([\w\d\-.]+)/);
    if (account_match && account_match.length > 1) suggestedAccountName = account_match[1];
    return suggestedAccountName;
}

function checkPasswordChecksum(password) {
    // A Hive generated password is a WIF prefixed with a P ..
    // It is possible to login directly with a WIF
    const wif = /^P/.test(password) ? password.substring(1) : password;

    if (!/^5[HJK].{45,}/i.test(wif)) {
        // 51 is the wif length
        // not even close
        return undefined;
    }

    return PrivateKey.isWif(wif);
}
export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const loginType = ownProps.loginType || state.user.get('login_type');
        const loginError = state.user.get('login_error');
        const currentUser = state.user.get('current');
        const loginBroadcastOperation = state.user.get('loginBroadcastOperation');
        const initialValues = {
            saveLogin: saveLoginDefault,
            useKeychain: hasCompatibleKeychain(),
            useHiveAuth: false,
        };

        // The username input has a value prop, so it should not use initialValues
        const initialUsername = currentUser && currentUser.has('username')
                ? currentUser.get('username')
                : urlAccountName();
        const loginDefault = state.user.get('loginDefault');
        if (loginDefault) {
            const { username, authType } = loginDefault.toJS();
            if (username && authType) initialValues.username = username + '/' + authType;
        } else if (initialUsername) {
            initialValues.username = initialUsername;
        }
        const offchainUser = state.offchain.get('user');
        if (!initialUsername && offchainUser && offchainUser.get('account')) {
            initialValues.username = offchainUser.get('account');
        }
        let msg = '';
        const msg_match = window.location.hash.match(/msg=([\w]+)/);
        if (msg_match && msg_match.length > 1) msg = msg_match[1];
        hasError = !!loginError;
        return {
            loginType,
            loginError,
            loginBroadcastOperation,
            initialValues,
            initialUsername,
            msg,
            offchain_user: state.offchain.get('user'),
        };
    },

    // mapDispatchToProps
    (dispatch) => ({
        dispatchSubmit: (data, useKeychain, useHiveAuth, loginBroadcastOperation) => {
            const { password, saveLogin } = data;
            const username = data.username.trim().toLowerCase();
            if (loginBroadcastOperation) {
                const {
                    type,
                    operation,
                    successCallback,
                    errorCallback,
                } = loginBroadcastOperation.toJS();
                dispatch(
                    transactionActions.broadcastOperation({
                        type,
                        operation,
                        username,
                        password,
                        useKeychain,
                        useHiveAuth,
                        successCallback,
                        errorCallback,
                    })
                );
                dispatch(
                    userActions.usernamePasswordLogin({
                        username,
                        password,
                        useKeychain,
                        useHiveAuth,
                        saveLogin,
                        operationType: type,
                    })
                );

                dispatch(userActions.closeLogin());
            } else {
                dispatch(
                    userActions.usernamePasswordLogin({
                        username,
                        password,
                        useKeychain,
                        useHiveAuth,
                        saveLogin,
                    })
                );
            }
        },
        reallySubmit: (
            {
                username,
                password,
                saveLogin,
                loginBroadcastOperation,
                access_token,
                expires_in,
                useHiveSigner,
                lastPath,
            },
            afterLoginRedirectToWelcome
        ) => {
            const { type } = loginBroadcastOperation
                ? loginBroadcastOperation.toJS()
                : {};

            serverApiRecordEvent('SignIn', type);

            dispatch(
                userActions.usernamePasswordLogin({
                    username,
                    password,
                    access_token,
                    expires_in,
                    lastPath,
                    useHiveSigner,
                    saveLogin,
                    afterLoginRedirectToWelcome,
                })
            );
        },
        clearError: () => {
            if (hasError) dispatch(userActions.loginError({ error: null }));
        },
        qrReader: (dataCallback) => {
            dispatch(
                globalActions.showDialog({
                    name: 'qr_reader',
                    params: { handleScan: dataCallback },
                })
            );
        },
        showChangePassword: (username, defaultPassword) => {
            dispatch(userActions.closeLogin());

            dispatch(globalActions.remove({ key: 'changePassword' }));
            dispatch(
                globalActions.showDialog({
                    name: 'changePassword',
                    params: { username, defaultPassword },
                })
            );
        },
    })
)(LoginForm);
