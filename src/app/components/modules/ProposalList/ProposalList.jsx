/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import PropTypes from 'prop-types';
import tt from 'counterpart';
import cx from 'classnames';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import ProposalContainer from './ProposalContainer';

export default function ProposalList(props) {
    const {
        proposals,
        voteOnProposal,
        loading,
        onFilter,
        onOrder,
        onOrderDirection,
        status,
        orderBy,
        orderDirection,
        triggerModal,
        getVoters,
    } = props;

    return (
        <div className="ProposalsList">
            <div className="proposals__header">
                <div className="proposals__title">{tt('proposals.title')}</div>
                <div className="proposals__filters">
                    <label className="proposals__select">
                        {tt('proposals.status')}
                        <select
                            value={status}
                            onChange={(e) => {
                                onFilter(e.target.value);
                            }}
                        >
                            <option value="all">
                                {tt('proposals.status_options.all')}
                            </option>
                            <option value="active">
                                {tt('proposals.status_options.active')}
                            </option>
                            <option value="inactive">
                                {tt('proposals.status_options.inactive')}
                            </option>
                            <option value="expired">
                                {tt('proposals.status_options.expired')}
                            </option>
                            <option value="votable">
                                {tt('proposals.status_options.votable')}
                            </option>
                        </select>
                    </label>
                    <label className="proposals__select">
                        {tt('proposals.order')}
                        <select
                            value={orderBy}
                            onChange={(e) => {
                                onOrder(e.target.value);
                            }}
                        >
                            <option value="by_creator">
                                {tt('proposals.order_options.creator')}
                            </option>
                            <option value="by_start_date">
                                {tt('proposals.order_options.start_date')}
                            </option>
                            <option value="by_end_date">
                                {tt('proposals.order_options.end_date')}
                            </option>
                            <option value="by_total_votes">
                                {tt('proposals.order_options.total_votes')}
                            </option>
                        </select>
                    </label>
                    <div
                        role="button"
                        className="proposals__order_direction"
                        onClick={() => {
                            const d =
                                orderDirection === 'ascending'
                                    ? 'descending'
                                    : 'ascending';
                            onOrderDirection(d);
                        }}
                    >
                        <div
                            className={cx('direction', {
                                active: orderDirection === 'ascending',
                            })}
                        >
                            &#x2191;
                        </div>
                        <div
                            className={cx('direction', {
                                active: orderDirection === 'descending',
                            })}
                        >
                            &#x2193;
                        </div>
                    </div>
                </div>
            </div>
            {loading ? (
                <center>
                    <span>
                        <LoadingIndicator type="circle" />
                    </span>
                    <h5>
                        {tt('g.loading')}
                        <br />
                        <small>{tt('proposals.wait_for_proposal_load')}</small>
                    </h5>
                </center>
            ) : proposals.length == 0 ? (
                <center>
                    <h5>
                        {tt('proposals.sorry_cannot_display')}
                        <br />
                        <small>{tt('proposals.no_proposal_matching')}</small>
                    </h5>
                </center>
            ) : null}
            {proposals.map((proposal) => (
                <ProposalContainer
                    getVoters={getVoters}
                    triggerModal={triggerModal}
                    key={proposal.id}
                    voteOnProposal={voteOnProposal}
                    proposal={proposal}
                />
            ))}
        </div>
    );
}

ProposalList.propTypes = {
    proposals: PropTypes.array.isRequired, //TODO: Specify Shape
    voteOnProposal: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    onFilter: PropTypes.func.isRequired,
    onOrder: PropTypes.func.isRequired,
    onOrderDirection: PropTypes.func.isRequired,
    onToggleFilters: PropTypes.func.isRequired,
    showFilters: PropTypes.bool.isRequired,
    status: PropTypes.oneOf(['all', 'active', 'inactive', 'expired', 'votable'])
        .isRequired,
    orderBy: PropTypes.oneOf([
        'by_creator',
        'by_start_date',
        'by_end_date',
        'by_total_votes',
    ]).isRequired,
    orderDirection: PropTypes.oneOf(['ascending', 'descending']).isRequired,
};
