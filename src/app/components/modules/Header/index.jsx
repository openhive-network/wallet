import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { browserHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import tt from 'counterpart';
import Tooltip from "react-tooltip-lite";

import resolveRoute from 'app/ResolveRoute';
import { APP_NAME } from 'app/client_config';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import * as userActions from 'app/redux/UserReducer';
import * as appActions from 'app/redux/AppReducer';
import Userpic from 'app/components/elements/Userpic';
import { SIGNUP_URL } from 'shared/constants';
import HiveLogo from 'app/components/elements/HiveLogo';
import normalizeProfile from 'app/utils/NormalizeProfile';
import UserpicInfoWrapper from 'app/components/elements/UserpicInfoWrapper';
import { extractLoginData } from 'app/utils/UserUtil';

const propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    account_meta: PropTypes.object,
    pathname: PropTypes.string,
};

const defaultProps = {
    account_meta: {},
    pathname: '',
};

class Header extends React.Component {
    componentDidUpdate(prevProps) {
        const { loggedIn } = this.props;
        if (prevProps.loggedIn && !loggedIn) {
            if (process.env.BROWSER) {
                browserHistory.replace(`/`);
            }
        }
    }

    render() {
        const {
            pathname,
            username,
            showLogin,
            logout,
            loggedIn,
            nightmodeEnabled,
            toggleNightmode,
            showSidePanel,
            account_meta,
            login_with_keychain,
            login_with_hivesigner,
            login_with_hiveauth,
        } = this.props;

        /*Set the document.title on each header render.*/
        const route = resolveRoute(pathname);
        let page_title = route.page;

        if (route.page === 'Privacy') {
            page_title = tt('navigation.privacy_policy');
        } else if (route.page == 'Tos') {
            page_title = tt('navigation.terms_of_service');
        } else if (route.page === 'ChangePassword') {
            page_title = tt('header_jsx.change_account_password');
        } else if (route.page === 'CreateAccount') {
            page_title = tt('header_jsx.create_account');
        } else if (route.page === 'Approval') {
            page_title = `Account Confirmation`;
        } else if (route.page === 'RecoverAccountStep1' || route.page === 'RecoverAccountStep2') {
            page_title = tt('header_jsx.stolen_account_recovery');
        } else if (route.page === 'Proposals') {
            page_title = tt('header_jsx.steem_proposals');
        } else if (route.page === 'UserProfile') {
            const user_name = route.params[0].slice(1);
            const name = account_meta && !_.isEmpty(account_meta)
                ? normalizeProfile(account_meta.toJS()).name
                : null;
            const user_title = name ? `${name} (@${user_name})` : user_name;
            page_title = user_title;
            if (route.params[1] === 'curation-rewards') {
                page_title = tt('header_jsx.curation_rewards_by', {
                    username: user_title,
                });
            }
            if (route.params[1] === 'author-rewards') {
                page_title = tt('header_jsx.author_rewards_by', {
                    username: user_title,
                });
            }
        } else {
            page_title = ''; //page_title = route.page.replace( /([a-z])([A-Z])/g, '$1 $2' ).toLowerCase();
        }

        // Format first letter of all titles and lowercase user name
        if (route.page !== 'UserProfile') {
            page_title = page_title.charAt(0).toUpperCase() + page_title.slice(1);
        }

        if (
            process.env.BROWSER
            && route.page !== 'Post'
            && route.page !== 'PostNoCategory'
        ) {
            document.title = page_title + ' — ' + APP_NAME;
        }

        const wallet_link = `/@${username}/transfers`;
        const reset_password_link = `/@${username}/password`;
        const settings_link = `/@${username}/settings`;

        const user_menu = [
            {
                link: wallet_link,
                icon: 'wallet',
                value: tt('g.wallet'),
            },
            {
                link: '#',
                icon: 'eye',
                onClick: toggleNightmode,
                value: tt('g.toggle_nightmode'),
            },
            {
                link: reset_password_link,
                icon: 'key',
                value: tt('g.change_password'),
            },
            { link: settings_link, icon: 'cog', value: tt('g.settings') },
            loggedIn
                ? {
                      link: '#',
                      icon: 'enter',
                      onClick: logout,
                      value: tt('g.logout'),
                  }
                : { link: '#', onClick: showLogin, value: tt('g.login') },
        ];

        let loginProvider;
        let loginProviderLogo;
        switch(true) {
            case !!login_with_keychain:
                loginProvider = 'Hive Keychain';
                loginProviderLogo = '/images/hivekeychain.png';
                break;

            case !!login_with_hiveauth:
                loginProvider = 'HiveAuth';
                loginProviderLogo = '/images/hiveauth.png';
                break;

            case !!login_with_hivesigner:
                loginProvider = 'Hive Signer';
                loginProviderLogo = '/images/hivesigner.svg';
                break;

            default:
                loginProvider = 'Hive private key';
                loginProviderLogo = '/images/hive-blog-logo.svg';
                break;
        }

        return (
            <header className="Header">
                <nav className="row Header__nav">
                    <div className="small-5 large-6 columns Header__logotype">
                        {/*LOGO*/}
                        <Link to="/">
                            <HiveLogo nightmodeEnabled={nightmodeEnabled} />
                        </Link>
                    </div>

                    <div className="small-7 large-6 columns Header__buttons">
                        {/*NOT LOGGED IN SIGN UP LINK*/}
                        {!loggedIn && (
                            <span className="Header__user-signup show-for-medium">
                                <a
                                    className="Header__login-link"
                                    href="/login.html"
                                    onClick={showLogin}
                                >
                                    {tt('g.login')}
                                </a>
                                <a
                                    className="Header__signup-link"
                                    href={SIGNUP_URL}
                                >
                                    {tt('g.sign_up')}
                                </a>
                            </span>
                        )}
                        {/*USER AVATAR */}
                        {loggedIn && (
                            <DropdownMenu
                                className="Header__usermenu"
                                items={user_menu}
                                title={(
                                    <div>
                                        {username}
                                        {' '}
                                        <Tooltip
                                            content={`Logged in with ${loginProvider}`}
                                            eventOff="onClick"
                                            className="login-provider-tooltip"
                                        >
                                            <img
                                                alt={loginProvider}
                                                width="16"
                                                src={loginProviderLogo}
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                                el="span"
                                selected={tt('g.rewards')}
                                position="left"
                            >
                                <li className="Header__userpic ">
                                    <span title={username}>
                                        <UserpicInfoWrapper account={username}>
                                            <Userpic account={username} />
                                        </UserpicInfoWrapper>
                                    </span>
                                </li>
                            </DropdownMenu>
                        )}

                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={showSidePanel}
                            className="toggle-menu Header__hamburger"
                        >
                            <span className="hamburger" />
                        </span>
                    </div>
                </nav>
            </header>
        );
    }
}

Header.propTypes = propTypes;
Header.defaultProps = defaultProps;

export { Header as _Header_ };

const mapStateToProps = (state, ownProps) => {
    // SSR code split.
    if (!process.env.BROWSER) {
        return {
            username: null,
            loggedIn: false,
        };
    }

    let user_profile;
    const route = resolveRoute(ownProps.pathname);
    if (route.page === 'UserProfile') {
        user_profile = state.global.getIn([
            'accounts',
            route.params[0].slice(1),
        ]);
    }

    // TODO: Cleanup
    const userPath = state.routing.locationBeforeTransitions.pathname;
    const username = state.user.getIn(['current', 'username']);
    const loggedIn = !!username;

    console.log('loggedIn', loggedIn, username);

    const loginData = localStorage.getItem('autopost2');
    const [,,,, login_with_keychain, login_with_hivesigner,,, login_with_hiveauth] = extractLoginData(loginData);

    return {
        username,
        loggedIn,
        userPath,
        nightmodeEnabled: state.app.getIn(['user_preferences', 'nightmode']),
        account_meta: user_profile,
        ...ownProps,
        login_with_keychain,
        login_with_hivesigner,
        login_with_hiveauth,
    };
};

const mapDispatchToProps = (dispatch) => ({
    showLogin: (e) => {
        if (e) e.preventDefault();
        dispatch(userActions.showLogin({ type: 'basic' }));
    },
    logout: (e) => {
        if (e) e.preventDefault();
        dispatch(userActions.logout({ type: 'default' }));
    },
    toggleNightmode: (e) => {
        if (e) e.preventDefault();
        dispatch(appActions.toggleNightmode());
    },
    showSidePanel: () => {
        dispatch(userActions.showSidePanel());
    },
    hideSidePanel: () => {
        dispatch(userActions.hideSidePanel());
    },
});

const connectedHeader = connect(mapStateToProps, mapDispatchToProps)(Header);

export default connectedHeader;
