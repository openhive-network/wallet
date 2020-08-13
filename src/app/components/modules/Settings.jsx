import React from 'react';
import { connect } from 'react-redux';
import tt from 'counterpart';
import * as appActions from 'app/redux/AppReducer';
import o2j from 'shared/clash/object2json';
import * as hive from '@hiveio/hive-js';

class Settings extends React.Component {
    handleLanguageChange = (event) => {
        const locale = event.target.value;
        const userPreferences = { ...this.props.user_preferences, locale };
        this.props.setUserPreferences(userPreferences);
    };

    getPreferredApiEndpoint = () => {
        let preferred_api_endpoint = $STM_Config.hived_connection_client;

        if (
            typeof window !== 'undefined' &&
            localStorage.getItem('user_preferred_api_endpoint')
        ) {
            preferred_api_endpoint = localStorage.getItem(
                'user_preferred_api_endpoint'
            );
        }

        return preferred_api_endpoint;
    };

    generateAPIEndpointOptions = () => {
        const endpoints = hive.config.get('alternative_api_endpoints');

        if (endpoints === null || endpoints === undefined) {
            return null;
        }

        const preferred_api_endpoint = this.getPreferredApiEndpoint();
        const entries = [];
        for (let ei = 0; ei < endpoints.length; ei += 1) {
            const endpoint = endpoints[ei];

            //this one is always present even if the api config call fails
            if (endpoint !== preferred_api_endpoint) {
                const entry = (
                    <option value={endpoint} key={endpoint}>
                        {endpoint}
                    </option>
                );
                entries.push(entry);
            }
        }
        return entries;
    };

    handlePreferredAPIEndpointChange = (event) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'user_preferred_api_endpoint',
                event.target.value
            );
            hive.api.setOptions({ url: event.target.value });
        }
    };

    render() {
        const { user_preferences } = this.props;
        const preferred_api_endpoint = this.getPreferredApiEndpoint();

        return (
            <div className="Settings">
                <div className="row">
                    <div className="small-12 medium-6 large-4 columns">
                        <h4>{tt('settings_jsx.preferences')}</h4>
                        {tt('g.choose_language')}
                        <select
                            defaultValue={user_preferences.locale}
                            onChange={this.handleLanguageChange}
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish Español</option>
                            <option value="ru">Russian русский</option>
                            <option value="fr">French français</option>
                            <option value="it">Italian italiano</option>
                            <option value="ko">Korean 한국어</option>
                            <option value="ja">Japanese 日本語</option>
                            <option value="pl">Polish</option>
                            <option value="zh">Chinese 简体中文</option>
                        </select>

                        {tt('g.choose_preferred_endpoint')}
                        <select
                            defaultValue={preferred_api_endpoint}
                            onChange={this.handlePreferredAPIEndpointChange}
                        >
                            <option value={preferred_api_endpoint}>
                                {preferred_api_endpoint}
                            </option>

                            {this.generateAPIEndpointOptions()}
                        </select>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const user_preferences = state.app.get('user_preferences').toJS();
        return {
            user_preferences,
            ...ownProps,
        };
    },
    // mapDispatchToProps
    (dispatch) => ({
        setUserPreferences: (payload) => {
            dispatch(appActions.setUserPreferences(payload));
        },
    })
)(Settings);
