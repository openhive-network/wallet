/* global $STM_Config */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AppPropTypes from 'app/utils/AppPropTypes';
import Header from 'app/components/modules/Header';
import * as userActions from 'app/redux/UserReducer';
import classNames from 'classnames';
import ConnectedSidePanel from 'app/components/modules/ConnectedSidePanel';
import CloseButton from 'app/components/elements/CloseButton';
import Dialogs from 'app/components/modules/Dialogs';
import Modals from 'app/components/modules/Modals';
import MiniHeader from 'app/components/modules/MiniHeader';
import tt from 'counterpart';
import PageViewsCounter from 'app/components/elements/PageViewsCounter';
import { serverApiRecordEvent } from 'app/utils/ServerApiClient';
import { key_utils } from '@hiveio/hive-js/lib/auth/ecc';
import resolveRoute from 'app/ResolveRoute';
import { VIEW_MODE_WHISTLE } from 'shared/constants';
import WitnessVoteExpiryWarning from 'app/components/cards/WitnessVoteExpiryWarning';

const pageRequiresEntropy = (path) => {
    const { page } = resolveRoute(path);

    const entropyPages = [
        'ChangePassword',
        'RecoverAccountStep1',
        'RecoverAccountStep2',
        'UserProfile',
        'CreateAccount',
    ];
    /* Returns true if that page requires the entropy collection listener */
    return entropyPages.indexOf(page) !== -1;
};

class App extends React.Component {
    constructor(props) {
        super(props);
        // TODO: put both of these and associated toggles into Redux Store.
        this.state = {
            showCallout: true,
        };
        this.listenerActive = null;
    }

    componentWillMount() {
        const { loginUser } = this.props;
        if (process.env.BROWSER) localStorage.removeItem('autopost'); // July 14 '16 compromise, renamed to autopost2
        loginUser();
    }

    componentDidMount() {
        const { pathname } = this.props;

        if (pageRequiresEntropy(pathname)) {
            this.addEntropyCollector();
        }
    }

    componentWillReceiveProps(np) {
        const { pathname } = this.props;

        // Add listener if the next page requires entropy and the current page didn't
        if (
            pageRequiresEntropy(np.pathname) &&
            !pageRequiresEntropy(pathname)
        ) {
            this.addEntropyCollector();
        } else if (!pageRequiresEntropy(np.pathname)) {
            // Remove if next page does not require entropy
            this.removeEntropyCollector();
        }
    }

    addEntropyCollector() {
        // eslint-disable-next-line react/no-string-refs
        if (!this.listenerActive && this.refs.App_root) {
            this.refs.App_root.addEventListener(
                'mousemove',
                this.onEntropyEvent,
                { capture: false, passive: true }
            );
            this.listenerActive = true;
        }
    }

    removeEntropyCollector() {
        if (this.listenerActive && this.refs.App_root) {
            this.refs.App_root.removeEventListener(
                'mousemove',
                this.onEntropyEvent
            );
            this.listenerActive = null;
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { pathname, new_visitor, nightmodeEnabled } = this.props;
        const { showCallout } = this.state;
        const n = nextProps;
        return (
            pathname !== n.pathname ||
            new_visitor !== n.new_visitor ||
            showCallout !== nextState.showCallout ||
            nightmodeEnabled !== n.nightmodeEnabled
        );
    }

    onEntropyEvent = (e) => {
        if (e.type === 'mousemove')
            key_utils.addEntropy(e.pageX, e.pageY, e.screenX, e.screenY);
        else console.log('onEntropyEvent Unknown', e.type, e);
    };

    signUp = () => {
        serverApiRecordEvent('Sign up', 'Hero banner');
    };

    learnMore = () => {
        serverApiRecordEvent('Learn more', 'Hero banner');
    };

    render() {
        const {
            params,
            children,
            nightmodeEnabled,
            viewMode,
            pathname,
            category,
            order,
            username,
            error: { alert },
        } = this.props;
        const { showCallout } = this.state;

        const miniHeader = false;
        const whistleView = viewMode === VIEW_MODE_WHISTLE;
        const headerHidden = whistleView;
        const params_keys = Object.keys(params);
        const ip =
            pathname === '/' ||
            (params_keys.length === 2 &&
                params_keys[0] === 'order' &&
                params_keys[1] === 'category');
        let callout = null;
        if (showCallout && alert) {
            callout = (
                <div className="App__announcement row">
                    <div className="column">
                        <div className={classNames('callout', { alert })}>
                            <CloseButton
                                onClick={() =>
                                    this.setState({ showCallout: false })
                                }
                            />
                            <p>{alert}</p>
                        </div>
                    </div>
                </div>
            );
        }

        if ($STM_Config.read_only_mode && showCallout) {
            callout = (
                <div className="App__announcement row">
                    <div className="column">
                        <div
                            className={classNames('callout warning', { alert })}
                        >
                            <CloseButton
                                onClick={() =>
                                    this.setState({ showCallout: false })
                                }
                            />
                            <p>{tt('g.read_only_mode')}</p>
                        </div>
                    </div>
                </div>
            );
        }

        const themeClass = nightmodeEnabled ? ' theme-dark' : ' theme-light';

        return (
            <div
                className={classNames('App', themeClass, {
                    'index-page': ip,
                    'mini-header': miniHeader,
                    'whistle-view': whistleView,
                })}
                ref="App_root"
            >
                <ConnectedSidePanel alignment="right" />

                {headerHidden ? null : miniHeader ? (
                    <MiniHeader />
                ) : (
                    <Header
                        pathname={pathname}
                        category={category}
                        order={order}
                    />
                )}

                <div className="App__content">
                    {callout}
                    <WitnessVoteExpiryWarning account={username} />
                    {children}
                </div>
                <Dialogs />
                <Modals />
                <PageViewsCounter />
            </div>
        );
    }
}

App.propTypes = {
    error: PropTypes.string,
    children: AppPropTypes.Children,
    pathname: PropTypes.string,
    category: PropTypes.string,
    order: PropTypes.string,
    loginUser: PropTypes.func.isRequired,
};

App.defaultProps = {
    error: '',
    children: null,
    pathname: '',
    category: '',
    order: '',
};

export default connect(
    (state, ownProps) => {
        const current_user = state.user.get('current');
        const current_account_name = current_user
            ? current_user.get('username')
            : state.offchain.get('account');

        return {
            viewMode: state.app.get('viewMode'),
            error: state.app.get('error'),
            new_visitor:
                !state.user.get('current') &&
                !state.offchain.get('user') &&
                !state.offchain.get('account') &&
                state.offchain.get('new_visit'),

            nightmodeEnabled: state.app.getIn([
                'user_preferences',
                'nightmode',
            ]),
            pathname: ownProps.location.pathname,
            order: ownProps.params.order,
            category: ownProps.params.category,
            username: current_account_name,
        };
    },
    (dispatch) => ({
        loginUser: () => dispatch(userActions.usernamePasswordLogin({})),
    })
)(App);
