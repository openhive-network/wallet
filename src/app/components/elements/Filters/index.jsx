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
            submitSearchUserForm,
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
                        Filters
                    </button>
                    <section
                        className="filters__section"
                        hidden={!this.state.showFilters}
                    >
                        {/* for hidden by default use : !this.state.handleShowFilters  */}
                        <div className="row">
                            <div className="column small-4">
                                <p>Show incoming/outgoing transactions</p>
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
                            </div>
                            <div className="column small-4">
                                <p>Show transactions from/to specific user</p>
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
                                    onChange={submitSearchUserForm}
                                    type="text"
                                    name="user-search"
                                    placeholder="username"
                                />
                            </div>
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
