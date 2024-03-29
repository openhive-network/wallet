import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
//import Highcharts from 'highcharts';
import classNames from 'classnames';
import { Map } from 'immutable';

import * as transactionActions from 'app/redux/TransactionReducer';
import * as appActions from 'app/redux/AppReducer';
import * as marketActions from 'app/redux/MarketReducer';
import TransactionError from 'app/components/elements/TransactionError';
import DepthChart from 'app/components/elements/DepthChart';
import Orderbook from 'app/components/elements/Orderbook';
import OrderHistory from 'app/components/elements/OrderHistory';
import { MarketOrder } from 'app/utils/MarketOrder';
import { MarketTradeHistory } from 'app/utils/MarketTradeHistory';
import { roundUp, roundDown } from 'app/utils/MarketUtils';
import tt from 'counterpart';
import {
    LIQUID_TOKEN,
    LIQUID_TOKEN_UPPERCASE,
    DEBT_TOKEN_SHORT,
    CURRENCY_SIGN,
    LIQUID_TICKER,
    DEBT_TICKER,
} from 'app/client_config';

class Market extends React.Component {
    static propTypes = {
        orderbook: PropTypes.object,
        open_orders: PropTypes.array,
        open_orders_sort: PropTypes.instanceOf(Map),
        ticker: PropTypes.object,
        // redux PropTypes
        placeOrder: PropTypes.func.isRequired,
        user: PropTypes.string,
        feed: PropTypes.instanceOf(Map),
    };

    constructor(props) {
        super(props);
        this.state = {
            buy_disabled: true,
            sell_disabled: true,
            buy_price_warning: false,
            sell_price_warning: false,
        };
    }

    componentWillReceiveProps(np) {
        if (!this.props.ticker && np.ticker) {
            const { lowest_ask, highest_bid } = np.ticker;
            if (this.refs.buyHive_price) { this.refs.buyHive_price.value = parseFloat(lowest_ask).toFixed(
                    6
                ); }
            if (this.refs.sellHive_price) { this.refs.sellHive_price.value = parseFloat(
                    highest_bid
                ).toFixed(6); }
        }
    }

    shouldComponentUpdate = (nextProps, nextState) => {
        if (this.props.user !== nextProps.user && nextProps.user) {
            this.props.reload(nextProps.user);
        }

        if (
            nextState.buy_disabled != this.state.buy_disabled
            || nextState.sell_disabled != this.state.sell_disabled
        ) {
            return true;
        }

        if (
            nextState.buy_price_warning != this.state.buy_price_warning
            || nextState.sell_price_warning != this.state.sell_price_warning
        ) {
            return true;
        }

        if (nextState.open_orders_sort !== this.props.open_orders_sort) {
            return true;
        }

        const tc = typeof this.props.ticker == 'undefined'
            || this.props.ticker.latest !== nextProps.ticker.latest
            || this.props.ticker.hbd_volume !== nextProps.ticker.hbd_volume;

        const bc = typeof this.props.orderbook == 'undefined'
            || this.props.orderbook.asks.length
            != nextProps.orderbook.asks.length
            || this.props.orderbook.bids.length
            != nextProps.orderbook.bids.length;

        const oc = typeof nextProps.open_orders !== 'undefined'
            && (typeof this.props.open_orders == 'undefined'
                || JSON.stringify(this.props.open_orders)
                != JSON.stringify(nextProps.open_orders));

        // Update if ticker info changed, order book changed size, or open orders length changed.
        //if(tc || bc || oc) console.log("tc?", tc, "bc?", bc, "oc?", oc)
        return tc || bc || oc;
    };

    buyHive = (e) => {
        e.preventDefault();
        const { placeOrder, user } = this.props;
        if (!user) return;
        const amount_to_sell = parseFloat(
            ReactDOM.findDOMNode(this.refs.buyHive_total).value
        );
        const min_to_receive = parseFloat(
            ReactDOM.findDOMNode(this.refs.buyHive_amount).value
        );
        const price = (amount_to_sell / min_to_receive).toFixed(6);
        const { lowest_ask } = this.props.ticker;
        placeOrder(
            user,
            `${amount_to_sell} ${DEBT_TICKER}`,
            `${min_to_receive} ${LIQUID_TICKER}`,
            `${CURRENCY_SIGN}${price}/${LIQUID_TICKER}`,
            !!this.state.buy_price_warning,
            lowest_ask,
            (msg) => {
                this.props.notify(msg);
                this.props.reload(user);
            }
        );
    };

    sellHive = (e) => {
        e.preventDefault();
        const { placeOrder, user } = this.props;
        if (!user) return;
        const min_to_receive = parseFloat(
            ReactDOM.findDOMNode(this.refs.sellHive_total).value
        );
        const amount_to_sell = parseFloat(
            ReactDOM.findDOMNode(this.refs.sellHive_amount).value
        );
        const price = (min_to_receive / amount_to_sell).toFixed(6);
        const { highest_bid } = this.props.ticker;
        placeOrder(
            user,
            `${amount_to_sell} ${LIQUID_TICKER}`,
            `${min_to_receive} ${DEBT_TICKER}`,
            `${CURRENCY_SIGN}${price}/${LIQUID_TICKER}`,
            !!this.state.sell_price_warning,
            highest_bid,
            (msg) => {
                this.props.notify(msg);
                this.props.reload(user);
            }
        );
    };

    cancelOrderClick = (e, orderid) => {
        e.preventDefault();
        const { cancelOrder, user } = this.props;
        if (!user) return;
        cancelOrder(user, orderid, (msg) => {
            this.props.notify(msg);
            this.props.reload(user);
        });
    };

    setFormPrice = (price) => {
        const p = parseFloat(price);

        this.refs.sellHive_price.value = p.toFixed(6);
        this.refs.buyHive_price.value = p.toFixed(6);

        const samount = parseFloat(this.refs.sellHive_amount.value);
        if (samount >= 0) this.refs.sellHive_total.value = roundDown(p * samount, 3);

        const bamount = parseFloat(this.refs.buyHive_amount.value);
        if (bamount >= 0) this.refs.buyHive_total.value = roundUp(p * bamount, 3);

        this.validateBuyHive();
        this.validateSellHive();
    };

    percentDiff = (marketPrice, userPrice) => {
        marketPrice = parseFloat(marketPrice);
        return (100 * (userPrice - marketPrice)) / marketPrice;
    };

    validateBuyHive = () => {
        const amount = parseFloat(this.refs.buyHive_amount.value);
        const price = parseFloat(this.refs.buyHive_price.value);
        const total = parseFloat(this.refs.buyHive_total.value);
        const valid = amount > 0 && price > 0 && total > 0;
        const { lowest_ask } = this.props.ticker;
        this.setState({
            buy_disabled: !valid,
            buy_price_warning:
                valid && this.percentDiff(lowest_ask, price) > 15,
        });
    };

    validateSellHive = () => {
        const amount = parseFloat(this.refs.sellHive_amount.value);
        const price = parseFloat(this.refs.sellHive_price.value);
        const total = parseFloat(this.refs.sellHive_total.value);
        const valid = amount > 0 && price > 0 && total > 0;
        const { highest_bid } = this.props.ticker;
        this.setState({
            sell_disabled: !valid,
            sell_price_warning:
                valid && this.percentDiff(highest_bid, price) < -15,
        });
    };

    handleToggleOpenOrdersSort = (column, dataType = 'float') => {
        this.props.toggleOpenOrdersSort(column, dataType);
    };

    render() {
        const {
            sellHive,
            buyHive,
            cancelOrderClick,
            setFormPrice,
            validateBuyHive,
            validateSellHive,
            handleToggleOpenOrdersSort,
        } = this;
        const {
            buy_disabled,
            sell_disabled,
            buy_price_warning,
            sell_price_warning,
        } = this.state;

        let ticker = {
            latest: 0,
            lowest_ask: 0,
            highest_bid: 0,
            percent_change: 0,
            hbd_volume: 0,
            feed_price: 0,
        };

        if (typeof this.props.ticker != 'undefined') {
            const {
                latest,
                lowest_ask,
                highest_bid,
                percent_change,
                hbd_volume,
            } = this.props.ticker;
            const base = this.props.feed.get('base');
            const quote = this.props.feed.get('quote');
            ticker = {
                latest: parseFloat(latest),
                lowest_ask: roundUp(parseFloat(lowest_ask), 6),
                highest_bid: roundDown(parseFloat(highest_bid), 6),
                percent_change: parseFloat(percent_change),
                hbd_volume: parseFloat(hbd_volume),
                feed_price:
                    parseFloat(base.split(' ')[0])
                    / parseFloat(quote.split(' ')[0]),
            };
        }

        // Take raw orders from API and put them into a format that's clean & useful
        function normalizeOrders(orders) {
            if (typeof orders == 'undefined') return { bids: [], asks: [] };
            return ['bids', 'asks'].reduce((out, side) => {
                out[side] = orders[side].map((o) => {
                    return new MarketOrder(o, side);
                });
                return out;
            }, {});
        }

        function aggOrders(orders) {
            return ['bids', 'asks'].reduce((out, side) => {
                const buff = [];
                let last = null;
                // eslint-disable-next-line array-callback-return
                orders[side].map((o) => {
                    // o.price = (side == 'asks') ? roundUp(o.price, 6) : Math.max(roundDown(o.price, 6), 0.000001)
                    // the following line should be checking o.price == last.price but it appears due to inverted prices from API,
                    //   inverting again causes values to not be properly sorted.
                    if (
                        last !== null
                        && o.getStringPrice() === last.getStringPrice()
                    ) {
                        buff[buff.length - 1] = buff[buff.length - 1].add(o);
                    } else {
                        buff.push(o);
                    }
                    last = o;
                });

                out[side] = buff;
                return out;
            }, {});
        }

        const account = this.props.account ? this.props.account.toJS() : null;
        const orderbook = aggOrders(normalizeOrders(this.props.orderbook));
        const { open_orders, open_orders_sort } = this.props;

        // Logged-in user's open orders
        // eslint-disable-next-line no-shadow
        function open_orders_table(open_orders, open_orders_sort) {
            const rows = open_orders
                && open_orders.map((o) => (
                    <tr key={o.orderid}>
                        <td>{o.created.replace('T', ' ')}</td>
                        <td>{o.type == 'ask' ? tt('g.sell') : tt('g.buy')}</td>
                        <td>
                            {CURRENCY_SIGN}
                            {o.price.toFixed(6)}
                        </td>
                        <td>{o.hive}</td>
                        <td>{o.hbd.replace('HBD', DEBT_TOKEN_SHORT)}</td>
                        <td>
                            {(
                                (1
                                    - o.for_sale
                                    / 1000
                                    / parseFloat(
                                        o.sell_price.base.split(' ')[0]
                                    ))
                                * 100
                            ).toFixed(2)}
                            %
                        </td>
                        <td>
                            <a
                                href="#"
                                onClick={(e) => cancelOrderClick(e, o.orderid)}
                            >
                                {tt('g.cancel')}
                            </a>
                        </td>
                    </tr>
                ));

            const activeClass = (column) => {
                if (column === open_orders_sort.get('column')) {
                    const dir = open_orders_sort.get('dir') === -1 ? 'desc' : 'asc';
                    return ['activesort', `activesort--${dir}`];
                }
                return null;
            };

            return (
                <table className="Market__open-orders">
                    <thead>
                        <tr>
                            <th
                                className={classNames(
                                activeClass('created'),
                                'sortable'
                            )}
                                onClick={() => handleToggleOpenOrdersSort(
                                    'created',
                                    'string'
                                )}
                        >
                                {tt('market_jsx.date_created')}
                            </th>
                            <th
                                className={classNames(
                                activeClass('type'),
                                'sortable'
                            )}
                                onClick={() => handleToggleOpenOrdersSort('type', 'string')}
                        >
                                {tt('g.type')}
                            </th>
                            <th
                                className={classNames(
                                activeClass('price'),
                                'sortable'
                            )}
                                onClick={() => handleToggleOpenOrdersSort('price')}
                        >
                                {tt('g.price')}
                            </th>
                            <th
                                className={classNames(
                                activeClass('for_sale'),
                                'sortable',
                                'uppercase'
                            )}
                                onClick={() => handleToggleOpenOrdersSort('for_sale')}
                        >
                                {LIQUID_TOKEN}
                            </th>
                            <th
                                className={classNames(
                                activeClass('hbd'),
                                'sortable'
                            )}
                                onClick={() => handleToggleOpenOrdersSort('hbd')}
                        >
                                {`${DEBT_TOKEN_SHORT} (${CURRENCY_SIGN})`}
                            </th>
                            <th
                                className={classNames(
                                activeClass('filled'),
                                'sortable'
                            )}
                                onClick={() => handleToggleOpenOrdersSort('filled')}
                        >
                                Filled
                            </th>
                            <th>{tt('market_jsx.action')}</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            );
        }

        function trade_history_table(trades) {
            if (!trades || !trades.length) {
                return [];
            }

            // eslint-disable-next-line no-shadow
            const norm = (trades) => {
                return trades.map((t) => {
                    return new MarketTradeHistory(t);
                });
            };

            return <OrderHistory history={norm(trades)} />;
        }

        const pct_change = (
            <span
                className={
                    'Market__ticker-pct-'
                    + (ticker.percent_change < 0 ? 'down' : 'up')
                }
            >
                {ticker.percent_change < 0 ? '' : '+'}
                {ticker.percent_change.toFixed(2)}
                %
            </span>
        );

        return (
            <div>
                <div className="row">
                    <div className="column">
                        <ul className="Market__ticker">
                            <li>
                                <b>{tt('market_jsx.last_price')}</b>
                                {' '}
                                {CURRENCY_SIGN}
                                {ticker.latest.toFixed(6)}
                                {' '}
                                (
                                {pct_change}
                                )
                            </li>
                            <li>
                                <b>{tt('market_jsx.24h_volume')}</b>
                                {' '}
                                {CURRENCY_SIGN}
                                {ticker.hbd_volume.toFixed(2)}
                            </li>
                            <li>
                                <b>{tt('g.bid')}</b>
                                {' '}
                                {CURRENCY_SIGN}
                                {ticker.highest_bid.toFixed(6)}
                            </li>
                            <li>
                                <b>{tt('g.ask')}</b>
                                {' '}
                                {CURRENCY_SIGN}
                                {ticker.lowest_ask.toFixed(6)}
                            </li>
                            {ticker.highest_bid > 0 && (
                                <li>
                                    <b>{tt('market_jsx.spread')}</b>
                                    {' '}
                                    {(
                                        (200
                                            * (ticker.lowest_ask
                                                - ticker.highest_bid))
                                        / (ticker.highest_bid + ticker.lowest_ask)
                                    ).toFixed(3)}
                                    %
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="row">
                    <div className="column">
                        <DepthChart
                            bids={orderbook.bids}
                            asks={orderbook.asks}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="column">
                        <TransactionError opType="limit_order_create" />
                    </div>
                </div>

                <div className="row">
                    <div className="small-12 medium-6 columns">
                        <h4 className="buy-color uppercase">
                            {tt('navigation.buy_LIQUID_TOKEN', {
                                LIQUID_TOKEN,
                            })}
                        </h4>
                        <form className="Market__orderform" onSubmit={buyHive}>
                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.price')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className={
                                                'input-group-field'
                                                + (buy_price_warning
                                                    ? ' price_warning'
                                                    : '')
                                            }
                                            type="text"
                                            ref="buyHive_price"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const amount = parseFloat(
                                                    this.refs.buyHive_amount
                                                        .value
                                                );
                                                const price = parseFloat(
                                                    this.refs.buyHive_price
                                                        .value
                                                );
                                                if (amount >= 0 && price >= 0) { this.refs.buyHive_total.value = roundUp(
                                                        price * amount,
                                                        3
                                                    ); }
                                                validateBuyHive();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">{`${DEBT_TOKEN_SHORT}/${LIQUID_TOKEN}`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.amount')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="buyHive_amount"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const price = parseFloat(
                                                    this.refs.buyHive_price
                                                        .value
                                                );
                                                const amount = parseFloat(
                                                    this.refs.buyHive_amount
                                                        .value
                                                );
                                                if (price >= 0 && amount >= 0) { this.refs.buyHive_total.value = roundUp(
                                                        price * amount,
                                                        3
                                                    ); }
                                                validateBuyHive();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">
                                            {' '}
                                            {LIQUID_TOKEN}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('market_jsx.total')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="buyHive_total"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const price = parseFloat(
                                                    this.refs.buyHive_price
                                                        .value
                                                );
                                                const total = parseFloat(
                                                    this.refs.buyHive_total
                                                        .value
                                                );
                                                if (total >= 0 && price >= 0) { this.refs.buyHive_amount.value = roundUp(
                                                        total / price,
                                                        3
                                                    ); }
                                                validateBuyHive();
                                            }}
                                        />
                                        <span className="input-group-label">{`${DEBT_TOKEN_SHORT} (${CURRENCY_SIGN})`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2" />
                                <div className="column small-9 large-8">
                                    <input
                                        disabled={buy_disabled}
                                        type="submit"
                                        className="button hollow buy-color float-right uppercase"
                                        value={tt(
                                            'navigation.buy_LIQUID_TOKEN',
                                            { LIQUID_TOKEN }
                                        )}
                                    />
                                    {account && (
                                        <div>
                                            <small>
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const price = parseFloat(
                                                            this.refs
                                                                .buyHive_price
                                                                .value
                                                        );
                                                        const total = account.hbd_balance.split(
                                                            ' '
                                                        )[0];
                                                        this.refs.buyHive_total.value = total;
                                                        if (price >= 0) { this.refs.buyHive_amount.value = roundDown(
                                                                parseFloat(
                                                                    total
                                                                ) / price,
                                                                3
                                                            ).toFixed(3); }
                                                        validateBuyHive();
                                                    }}
                                                >
                                                    {tt('market_jsx.available')}
                                                    :
                                                </a>
                                                {' '}
                                                {account.hbd_balance.replace(
                                                    'HBD',
                                                    DEBT_TOKEN_SHORT
                                                )}
                                            </small>
                                        </div>
                                    )}

                                    <div>
                                        <small>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const amount = parseFloat(
                                                        this.refs.buyHive_amount
                                                            .value
                                                    );
                                                    const price = parseFloat(
                                                        ticker.lowest_ask
                                                    );
                                                    this.refs.buyHive_price.value = ticker.lowest_ask;
                                                    if (amount >= 0) { this.refs.buyHive_total.value = roundUp(
                                                            amount * price,
                                                            3
                                                        ).toFixed(3); }
                                                    validateBuyHive();
                                                }}
                                            >
                                                {tt('market_jsx.lowest_ask')}
                                                :
                                            </a>
                                            {' '}
                                            {ticker.lowest_ask.toFixed(6)}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="small-12 medium-6 columns">
                        <h4 className="sell-color uppercase">
                            {tt('navigation.sell_LIQUID_TOKEN', {
                                LIQUID_TOKEN,
                            })}
                        </h4>

                        <form className="Market__orderform" onSubmit={sellHive}>
                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.price')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className={
                                                'input-group-field'
                                                + (sell_price_warning
                                                    ? ' price_warning'
                                                    : '')
                                            }
                                            type="text"
                                            ref="sellHive_price"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const amount = parseFloat(
                                                    this.refs.sellHive_amount
                                                        .value
                                                );
                                                const price = parseFloat(
                                                    this.refs.sellHive_price
                                                        .value
                                                );
                                                if (amount >= 0 && price >= 0) { this.refs.sellHive_total.value = roundDown(
                                                        price * amount,
                                                        3
                                                    ); }
                                                validateSellHive();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">{`${DEBT_TOKEN_SHORT}/${LIQUID_TOKEN}`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.amount')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="sellHive_amount"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const price = parseFloat(
                                                    this.refs.sellHive_price
                                                        .value
                                                );
                                                const amount = parseFloat(
                                                    this.refs.sellHive_amount
                                                        .value
                                                );
                                                if (price >= 0 && amount >= 0) { this.refs.sellHive_total.value = roundDown(
                                                        price * amount,
                                                        3
                                                    ); }
                                                validateSellHive();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">
                                            {LIQUID_TOKEN}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('market_jsx.total')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="sellHive_total"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const price = parseFloat(
                                                    this.refs.sellHive_price
                                                        .value
                                                );
                                                const total = parseFloat(
                                                    this.refs.sellHive_total
                                                        .value
                                                );
                                                if (price >= 0 && total >= 0) { this.refs.sellHive_amount.value = roundUp(
                                                        total / price,
                                                        3
                                                    ); }
                                                validateSellHive();
                                            }}
                                        />
                                        <span className="input-group-label">{`${DEBT_TOKEN_SHORT} (${CURRENCY_SIGN})`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2" />
                                <div className="column small-9 large-8">
                                    <input
                                        disabled={sell_disabled}
                                        type="submit"
                                        className="button hollow sell-color float-right uppercase"
                                        value={tt(
                                            'navigation.sell_LIQUID_TOKEN',
                                            { LIQUID_TOKEN }
                                        )}
                                    />
                                    {account && (
                                        <div>
                                            <small>
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const price = parseFloat(
                                                            this.refs
                                                                .sellHive_price
                                                                .value
                                                        );
                                                        const amount = account.balance.split(
                                                            ' '
                                                        )[0];
                                                        this.refs.sellHive_amount.value = amount;
                                                        if (price >= 0) { this.refs.sellHive_total.value = roundDown(
                                                                price
                                                                * parseFloat(
                                                                    amount
                                                                ),
                                                                3
                                                            ); }
                                                        validateSellHive();
                                                    }}
                                                >
                                                    {tt('market_jsx.available')}
                                                    :
                                                </a>
                                                {' '}
                                                {account.balance.replace(
                                                    LIQUID_TICKER,
                                                    LIQUID_TOKEN_UPPERCASE
                                                )}
                                            </small>
                                        </div>
                                    )}
                                    <div>
                                        <small>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const amount = parseFloat(
                                                        this.refs
                                                            .sellHive_amount
                                                            .value
                                                    );
                                                    const price = ticker.highest_bid;
                                                    this.refs.sellHive_price.value = price;
                                                    if (amount >= 0) { this.refs.sellHive_total.value = roundDown(
                                                            parseFloat(price)
                                                            * amount,
                                                            3
                                                        ); }
                                                    validateSellHive();
                                                }}
                                            >
                                                {tt('market_jsx.highest_bid')}
                                                :
                                            </a>
                                            {' '}
                                            {ticker.highest_bid.toFixed(6)}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="row show-for-medium">
                    <div className="small-12 medium-6 large-4 columns">
                        <h4>{tt('market_jsx.buy_orders')}</h4>
                        <Orderbook
                            side="bids"
                            orders={orderbook.bids}
                            onClick={(price) => {
                                setFormPrice(price);
                            }}
                        />
                    </div>

                    <div className="small-12 medium-6 large-4 columns">
                        <h4>{tt('market_jsx.sell_orders')}</h4>
                        <Orderbook
                            side="asks"
                            orders={orderbook.asks}
                            onClick={(price) => {
                                setFormPrice(price);
                            }}
                        />
                    </div>

                    <div className="small-12 large-4 column">
                        <h4>{tt('market_jsx.trade_history')}</h4>
                        {trade_history_table(this.props.history)}
                    </div>
                </div>

                {account && (
                    <div className="row">
                        <div className="column">
                            <h4>{tt('market_jsx.open_orders')}</h4>
                            {open_orders_table(open_orders, open_orders_sort)}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

// Market orders with expiration greater than 28 days from current Head Block time will be rejected.
const DEFAULT_EXPIRE = new Date(
    Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 27) * 1000
)
    .toISOString()
    .split('.')[0];

module.exports = {
    path: 'market',
    component: connect(
        (state) => {
            const username = state.user.get('current')
                ? state.user.get('current').get('username')
                : null;
            return {
                orderbook: state.market.get('orderbook'),
                open_orders: process.env.BROWSER
                    ? state.market.get('open_orders')
                    : [],
                ticker: state.market.get('ticker'),
                account: state.global.getIn(['accounts', username]),
                history: state.market.get('history'),
                user: username,
                feed: state.global.get('feed_price'),
                open_orders_sort: state.market.get('open_orders_sort'),
            };
        },
        (dispatch) => ({
            notify: (message) => {
                dispatch(
                    appActions.addNotification({
                        key: 'mkt_' + Date.now(),
                        message,
                        dismissAfter: 5000,
                    })
                );
            },
            reload: (username) => {
                console.log('Reload market state...');
                dispatch(marketActions.updateMarket({ username }));
            },
            cancelOrder: (owner, orderid, successCallback) => {
                const confirm = tt('market_jsx.order_cancel_confirm', {
                    order_id: orderid,
                    user: owner,
                });
                const successMessage = tt('market_jsx.order_cancelled', {
                    order_id: orderid,
                });
                dispatch(
                    transactionActions.broadcastOperation({
                        type: 'limit_order_cancel',
                        operation: {
                            owner,
                            orderid /*, __config: {successMessage}*/,
                        },
                        confirm,
                        successCallback: () => {
                            successCallback(successMessage);
                        },
                        //successCallback
                    })
                );
            },
            placeOrder: (
                owner,
                amount_to_sell,
                min_to_receive,
                effectivePrice,
                priceWarning,
                marketPrice,
                successCallback,
                fill_or_kill = false,
                expiration = DEFAULT_EXPIRE
            ) => {
                // create_order jsc 12345 "1.000 HBD" "100.000 HIVE" true 1467122240 false

                // Padd amounts to 3 decimal places
                amount_to_sell = amount_to_sell.replace(
                    amount_to_sell.split(' ')[0],
                    String(parseFloat(amount_to_sell).toFixed(3))
                );
                min_to_receive = min_to_receive.replace(
                    min_to_receive.split(' ')[0],
                    String(parseFloat(min_to_receive).toFixed(3))
                );

                const isSell = amount_to_sell.indexOf(LIQUID_TICKER) > 0;
                const confirmStr = isSell
                    ? tt('market_jsx.sell_amount_for_atleast', {
                        amount_to_sell,
                        min_to_receive,
                        effectivePrice,
                    })
                    : tt('market_jsx.buy_atleast_amount_for', {
                        amount_to_sell,
                        min_to_receive,
                        effectivePrice,
                    });
                const successMessage = tt('market_jsx.order_placed', {
                    order: confirmStr,
                });
                const confirm = confirmStr + '?';
                let warning = null;
                if (priceWarning) {
                    const warning_args = {
                        marketPrice:
                            CURRENCY_SIGN
                            + parseFloat(marketPrice).toFixed(4)
                            + '/'
                            + LIQUID_TOKEN_UPPERCASE,
                    };
                    warning = isSell
                        ? tt('market_jsx.price_warning_below', warning_args)
                        : tt('market_jsx.price_warning_above', warning_args);
                }
                const orderid = Math.floor(Date.now() / 1000);
                dispatch(
                    transactionActions.broadcastOperation({
                        type: 'limit_order_create',
                        operation: {
                            owner,
                            amount_to_sell,
                            min_to_receive,
                            fill_or_kill,
                            expiration,
                            orderid,
                        }, //,
                        //__config: {successMessage}},
                        confirm,
                        warning,
                        successCallback: () => {
                            successCallback(successMessage);
                        },
                    })
                );
            },
            toggleOpenOrdersSort: (column, dataType) => {
                dispatch(
                    marketActions.toggleOpenOrdersSort({ column, dataType })
                );
            },
        })
    )(Market),
};
