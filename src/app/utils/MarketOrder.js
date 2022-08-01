import { roundDown, roundUp } from './MarketUtils';

const precision = 1000;

export class Order {
    constructor(order, side) {
        this.side = side;
        this.price = parseFloat(order.real_price);
        this.price = side === 'asks'
            ? roundUp(this.price, 6)
            : Math.max(roundDown(this.price, 6), 0.000001);
        this.stringPrice = this.price.toFixed(6);
        this.hive = parseInt(order.hive, 10);
        this.hbd = parseInt(order.hbd, 10);
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
                hive: this.hive + order.hive,
                hbd: this.hbd + order.hbd,
                date: this.date,
            },
            this.type
        );
    }

    equals(order) {
        return (
            this.getStringHBD() === order.getStringHBD()
            && this.getStringHive() === order.getStringHive()
            && this.getStringPrice() === order.getStringPrice()
        );
    }
}

export default Order;
