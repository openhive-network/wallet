var React = require('react');
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';

export default class OrderhistoryRow extends React.Component {
    constructor(props) {
        super();

        this.state = {
            animate: props.animate && props.index !== 9,
            rowIndex: props.index,
        };

        this.timeout = null;
    }

    _clearAnimate() {
        setTimeout(() => {
            this.setState({
                animate: false,
            });
        }, 1000);
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.rowIndex !== nextProps.index) {
            return this.setState({
                rowIndex: nextProps.index,
            });
        }

        if (!this.props.order.equals(nextProps.order)) {
            return this.setState({ animate: true }, this._clearAnimate);
        }
    }

    componentDidMount() {
        if (this.state.animate) {
            this._clearAnimate();
        }
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !this.props.order.equals(nextProps.order) ||
            this.props.total !== nextProps.total ||
            this.state.animate !== nextState.animate
        );
    }

    render() {
        let { order, buy, total } = this.props;

        let className = this.state.animate ? 'animate ' : '';

        return (
            <tr className={className}>
                <td>
                    <TimeAgoWrapper date={order.date} />
                </td>
                <td className={order.color}>{order.getStringPrice()}</td>
                <td>{order.getHiveAmount().toFixed(3)}</td>
                <td>{order.getHBDAmount().toFixed(3)}</td>
            </tr>
        );
    }
}
