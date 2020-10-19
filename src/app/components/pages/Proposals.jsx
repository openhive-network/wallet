import React from 'react';
import { connect } from 'react-redux';
import { actions as proposalActions } from 'app/redux/ProposalSaga';
import * as transactionActions from 'app/redux/TransactionReducer'; // TODO: Only import what we need.
import { List } from 'immutable';
import PropTypes from 'prop-types';

import ProposalListContainer from 'app/components/modules/ProposalList/ProposalListContainer';

class Proposals extends React.Component {
    startValueByOrderType = {
        by_total_votes: {
            ascending: [0],
            descending: [],
        },
        by_creator: {
            ascending: [''],
            descending: [],
        },
        by_start_date: {
            ascending: [''],
            descending: [''],
        },
        by_end_date: {
            ascending: [''],
            descending: [''],
        },
    };

    constructor(props) {
        super(props);
        this.state = {
            proposals: [],
            loading: true,
            limit: 10,
            last_proposal: false,
            status: 'all',
            order_by: 'by_total_votes',
            order_direction: 'descending',
        };
    }
    async componentWillMount() {
        await this.load();
    }

    async load(quiet = false, options = {}) {
        if (quiet) {
            this.setState({ loading: true });
        }

        // eslint-disable-next-line react/destructuring-assignment
        const { status, order_by, order_direction } = options;

        const isFiltering = !!(status || order_by || order_direction);

        let limit;

        if (isFiltering) {
            limit = this.state.limit;
        } else {
            limit = this.state.limit + this.state.proposals.length;
        }

        const start = this.startValueByOrderType[
            order_by || this.state.order_by
        ][order_direction || this.state.order_direction];

        const proposals =
            (await this.getAllProposals(
                this.state.last_proposal,
                order_by || this.state.order_by,
                order_direction || this.state.order_direction,
                limit,
                status || this.state.status,
                start
            )) || [];

        let last_proposal = false;
        if (proposals.length > 0) {
            last_proposal = proposals[0];
        }

        this.setState({
            proposals,
            loading: false,
            last_proposal,
            limit,
        });
    }

    onFilterProposals = async (status) => {
        this.setState({ status });
        await this.load(false, { status });
    };

    onOrderProposals = async (order_by) => {
        this.setState({ order_by });
        await this.load(false, { order_by });
    };

    onOrderDirection = async (order_direction) => {
        this.setState({ order_direction });
        await this.load(false, { order_direction });
    };

    getAllProposals(
        last_proposal,
        order_by,
        order_direction,
        limit,
        status,
        start
    ) {
        return this.props.listProposals({
            voter_id: this.props.currentUser,
            last_proposal,
            order_by,
            order_direction,
            limit,
            status,
            start,
        });
    }

    voteOnProposal = async (proposalId, voteForIt, onSuccess, onFailure) => {
        return this.props.voteOnProposal(
            this.props.currentUser,
            [proposalId],
            voteForIt,
            async () => {
                if (onSuccess) onSuccess();
            },
            () => {
                if (onFailure) onFailure();
            }
        );
    };

    onClickLoadMoreProposals = (e) => {
        e.preventDefault();
        this.load();
    };

    render() {
        const {
            proposals,
            loading,
            status,
            order_by,
            order_direction,
        } = this.state;
        let showBottomLoading = false;
        if (loading && proposals && proposals.length > 0) {
            showBottomLoading = true;
        }
        return (
            <div>
                <ProposalListContainer
                    voteOnProposal={this.voteOnProposal}
                    proposals={proposals}
                    loading={loading}
                    onFilter={this.onFilterProposals}
                    onOrder={this.onOrderProposals}
                    onOrderDirection={this.onOrderDirection}
                    status={status}
                    orderBy={order_by}
                    orderDirection={order_direction}
                />
                <center style={{ paddingTop: '1em', paddingBottom: '1em' }}>
                    {!loading ? (
                        <a href="#" onClick={this.onClickLoadMoreProposals}>
                            {`Load more...`}
                        </a>
                    ) : null}

                    {showBottomLoading ? <a>{`Loading more...`}</a> : null}
                </center>
            </div>
        );
    }
}

Proposals.propTypes = {
    listProposals: PropTypes.func.isRequired,
    removeProposal: PropTypes.func.isRequired,
    createProposal: PropTypes.func.isRequired,
    voteOnProposal: PropTypes.func.isRequired,
};

module.exports = {
    path: 'proposals',
    component: connect(
        (state) => {
            const user = state.user.get('current');
            const currentUser = user && user.get('username');
            const proposals = state.proposal.get('proposals', List());
            const last = proposals.size - 1;
            const last_id =
                (proposals.size && proposals.get(last).get('id')) || null;
            const newProposals =
                proposals.size >= 10 ? proposals.delete(last) : proposals;

            return {
                currentUser,
                proposals: newProposals,
                last_id,
            };
        },
        (dispatch) => {
            return {
                voteOnProposal: (
                    voter,
                    proposal_ids,
                    approve,
                    successCallback,
                    errorCallback
                ) => {
                    dispatch(
                        transactionActions.broadcastOperation({
                            type: 'update_proposal_votes',
                            operation: { voter, proposal_ids, approve },
                            successCallback,
                            errorCallback,
                        })
                    );
                },
                createProposal: (
                    creator,
                    receiver,
                    start_date,
                    end_date,
                    daily_pay,
                    subject,
                    permlink,
                    successCallback,
                    errorCallback
                ) => {
                    dispatch(
                        transactionActions.broadcastOperation({
                            type: 'create_proposal',
                            operation: {
                                creator,
                                receiver,
                                start_date: '2019-07-20T11:22:39',
                                end_date: '2019-08-30T11:22:39',
                                daily_pay: '3000.000 TBD',
                                subject: 'Test Proposal',
                                permlink: 'remove-delegations',
                            },
                            successCallback,
                            errorCallback,
                        })
                    );
                },
                removeProposal: (
                    proposal_owner,
                    proposal_ids,
                    successCallback,
                    errorCallback
                ) => {
                    dispatch(
                        transactionActions.broadcastOperation({
                            type: 'remove_proposal',
                            operation: { proposal_owner, proposal_ids },
                            confirm: tt(
                                'steem_proposals.confirm_remove_proposal_description'
                            ),
                            successCallback,
                            errorCallback,
                        })
                    );
                },
                listProposals: (payload) => {
                    return new Promise((resolve, reject) => {
                        dispatch(
                            proposalActions.listProposals({
                                ...payload,
                                resolve,
                                reject,
                            })
                        );
                    });
                },
            };
        }
    )(Proposals),
};
