import React from 'react';
import './styles.scss';

class Filters extends React.Component {
    constructor() {
        super();
        this.state = {
            handleShowFilters: false,
        };
    }
    render() {
        const { handleIncoming, handleOutgoing } = this.props;
        const showFilters = () => {
            this.setState({ handleShowFilters: !this.state.handleShowFilters });
        };

        return (
            <div className="row">
                <div className="column small-12">
                    <button onClick={showFilters} className="filter__button">
                        Filters
                    </button>
                    <section hidden={!this.state.handleShowFilters}>
                        <div>
                            <input
                                onChange={handleIncoming}
                                type="checkbox"
                                id="incoming"
                                name="incoming"
                            />
                            <label for="incoming">Incoming</label>
                        </div>

                        <div>
                            <input
                                onChange={handleOutgoing}
                                type="checkbox"
                                id="outgoing"
                                name="outgoing"
                            />
                            <label for="outgoing">Outgoing</label>
                        </div>
                        <hr />
                    </section>

                    {/* <button onClick={handleIncoming}>Incoming</button>
                <button onClick={handleOutgoing}>Outgoing</button> */}
                </div>
            </div>
        );
    }
}
export default Filters;
