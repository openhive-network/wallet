import '@babel/register';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';
import store from 'store';
import { VIEW_MODE_WHISTLE, PARAM_VIEW_MODE } from 'shared/constants';
import './assets/stylesheets/app.scss';
import plugins from 'app/utils/JsPlugins';
import Iso from 'iso';
import { clientRender } from 'shared/UniversalRender';
import { serverApiRecordEvent } from 'app/utils/ServerApiClient';
import * as hive from '@hiveio/hive-js';
import { determineViewMode } from 'app/utils/Links';
import frontendLogger from 'app/utils/FrontendLogger';
import Cookies from 'universal-cookie';
import ConsoleExports from './utils/ConsoleExports';

window.addEventListener('error', frontendLogger);

const CMD_LOG_T = 'log-t';
const CMD_LOG_TOGGLE = 'log-toggle';
const CMD_LOG_O = 'log-on';

try {
    if (process.env.NODE_ENV === 'development') {
        // Adds some object refs to the global window object
        ConsoleExports.init(window);
    }
} catch (e) {
    console.error(e);
}

function runApp(initial_state) {
    console.log('Initial state', initial_state);

    const { config } = initial_state.offchain;
    const cookies = new Cookies();
    const alternativeApiEndpoints = config.alternative_api_endpoints;
    const cookie_endpoint = cookies.get('user_preferred_api_endpoint');
    const currentApiEndpoint =
        cookie_endpoint === null || cookie_endpoint === undefined
            ? config.hived_connection_client
            : cookie_endpoint;

    hive.api.setOptions({
        url: currentApiEndpoint,
        retry: true,
        useAppbaseApi: !!config.hived_use_appbase,
        alternative_api_endpoints: alternativeApiEndpoints,
        failover_threshold: config.failover_threshold,
        rebranded_api: true,
    });
    hive.config.set('address_prefix', config.address_prefix);
    hive.config.set('rebranded_api', true);
    hive.broadcast.updateOperations();

    window.$STM_Config = config;
    plugins(config);
    if (initial_state.offchain.serverBusy) {
        window.$STM_ServerBusy = true;
    }
    if (initial_state.offchain.csrf) {
        window.$STM_csrf = initial_state.offchain.csrf;
        delete initial_state.offchain.csrf;
    }

    initial_state.app.viewMode = determineViewMode(window.location.search);

    const locale = store.get('language');
    if (locale) initial_state.user.locale = locale;
    initial_state.user.maybeLoggedIn =
        store.get('autopost2') || sessionStorage.getItem('username');
    if (initial_state.user.maybeLoggedIn) {
        const username = new Buffer(store.get('autopost2'), 'hex')
            .toString()
            .split('\t')[0];
        initial_state.user.current = {
            username,
        };
    }

    const location = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    try {
        clientRender(initial_state);
    } catch (error) {
        console.error(error);
        serverApiRecordEvent('client_error', error);
    }
}

if (!window.Intl) {
    require.ensure(
        ['intl/dist/Intl'],
        (require) => {
            window.IntlPolyfill = window.Intl = require('intl/dist/Intl');
            require('intl/locale-data/jsonp/en-US.js');
            require('intl/locale-data/jsonp/es.js');
            require('intl/locale-data/jsonp/ru.js');
            require('intl/locale-data/jsonp/fr.js');
            require('intl/locale-data/jsonp/it.js');
            require('intl/locale-data/jsonp/ko.js');
            require('intl/locale-data/jsonp/ja.js');
            Iso.bootstrap(runApp);
        },
        'IntlBundle'
    );
} else {
    Iso.bootstrap(runApp);
}
