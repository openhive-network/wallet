import { roundDown, roundUp } from './MarketUtils';
import { LIQUID_TICKER, DEBT_TICKER } from 'app/client_config';
const precision = 1000;

class Order {
    constructor(order, side) {
        this.side = side;
        this.price = parseFloat(order.real_price);
        this.price =
            side === 'asks'
                ? roundUp(this.price, 6)
                : Math.max(roundDown(this.price, 6), 0.000001);
        this.stringPrice = this.price.toFixed(6);
        this.hive = parseInt(order.steem, 10);
        this.hbd = parseInt(order.sbd, 10);
        this.date = order.created;
    }

    getHiveAmount() {
        return this.hive / precision;
    }

    getStringHive() {
        return this.getHiveAmount().toFixed(3);
    }

    getPrice() {
        return this.price;
    }

    getStringPrice() {
        return this.stringPrice;
    }

    getStringHBD() {
        return this.getHBDAmount().toFixed(3);
    }

    getHBDAmount() {
        return this.hbd / precision;
    }

    add(order) {
        return new Order(
            {
                real_price: this.price,
                steem: this.hive + order.hive,
                sbd: this.hbd + order.hbd,
                date: this.date,
            },
            this.type
        );
    }

    equals(order) {
        return (
            this.getStringHBD() === order.getStringHBD() &&
            this.getStringHive() === order.getStringHive() &&
            this.getStringPrice() === order.getStringPrice()
        );
    }
}

class TradeHistory {
    constructor(fill) {
        // Norm date (FF bug)
        var zdate = fill.date;
        if (!/Z$/.test(zdate)) zdate = zdate + 'Z';

        this.date = new Date(zdate);
        this.type =
            fill.current_pays.indexOf(DEBT_TICKER) !== -1 ? 'bid' : 'ask';
        this.color = this.type == 'bid' ? 'buy-color' : 'sell-color';
        if (this.type === 'bid') {
            this.hbd = parseFloat(
                fill.current_pays.split(' ' + DEBT_TICKER)[0]
            );
            this.hive = parseFloat(
                fill.open_pays.split(' ' + LIQUID_TICKER)[0]
            );
        } else {
            this.hbd = parseFloat(fill.open_pays.split(' ' + DEBT_TICKER)[0]);
            this.hive = parseFloat(
                fill.current_pays.split(' ' + LIQUID_TICKER)[0]
            );
        }

        this.price = this.hbd / this.hive;
        this.price =
            this.type === 'ask'
                ? roundUp(this.price, 6)
                : Math.max(roundDown(this.price, 6), 0.000001);
        this.stringPrice = this.price.toFixed(6);
    }

    getHiveAmount() {
        return this.hive;
    }

    getStringHive() {
        return this.getHiveAmount().toFixed(3);
    }

    getHBDAmount() {
        return this.hbd;
    }

    getStringHBD() {
        return this.getHBDAmount().toFixed(3);
    }

    getPrice() {
        return this.price;
    }

    getStringPrice() {
        return this.stringPrice;
    }

    equals(order) {
        return (
            this.getStringHBD() === order.getStringHBD() &&
            this.getStringHive() === order.getStringHive() &&
            this.getStringPrice() === order.getStringPrice()
        );
    }
}

module.exports = {
    Order,
    TradeHistory,
};
