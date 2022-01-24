import React from 'react';
import './styles.scss';

class Filters extends React.Component {
    constructor() {
        super();
        this.state = {
            showFilters: false,
        };
    }
    render() {
        const {
            handleIncoming,
            handleOutgoing,
            handleFromUser,
            handleToUser,
            handleExcludeLessThan1,
            handleSearchUserInput,
            formValue,
        } = this.props;

        const handleShowFilters = () => {
            this.setState({ showFilters: !this.state.showFilters });
        };

        return (
            <div className="row">
                <div className="column small-12">
                    <button
                        onClick={handleShowFilters}
                        className={
                            this.state.showFilters === true
                                ? 'filter__button active'
                                : 'filter__button'
                        }
                    >
                        <p>Filters</p>
                    </button>
                    <section
                        className="filters__section"
                        hidden={!this.state.showFilters}
                    >
                        <div className="row">
                            <div className="column small-4">
                                <p>Transactions</p>
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
                                <div>
                                    <input
                                        onChange={handleExcludeLessThan1}
                                        type="checkbox"
                                        id="lessThan1"
                                        name="lessThan1"
                                    />
                                    <label for="lessThan1">
                                        Exclude less than 1 HBD/HIVE
                                    </label>
                                </div>
                            </div>
                            <div className="column small-4">
                                <p>Filter By User</p>
                                <div>
                                    <input
                                        onChange={handleFromUser}
                                        type="checkbox"
                                        id="outgoing"
                                        name="outgoing"
                                    />
                                    <label for="outgoing">From</label>
                                </div>
                                <div>
                                    <input
                                        onChange={handleToUser}
                                        type="checkbox"
                                        id="outgoing"
                                        name="outgoing"
                                    />
                                    <label for="outgoing">To</label>
                                </div>

                                <label for="user-search">Search by user</label>
                                <input
                                    className="user-search__input"
                                    value={formValue}
                                    onChange={handleSearchUserInput}
                                    type="text"
                                    name="user-search"
                                    placeholder="username"
                                />
                            </div>
                        </div>

                        <hr />
                    </section>
                </div>
            </div>
        );
    }
}
export default Filters;
