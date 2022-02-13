import React from 'react';
import { connect } from 'react-redux';
import { actions as proposalActions } from 'app/redux/ProposalSaga';
import * as transactionActions from 'app/redux/TransactionReducer'; // TODO: Only import what we need.
import { List } from 'immutable';
import PropTypes from 'prop-types';
import ProposalListContainer from 'app/components/modules/ProposalList/ProposalListContainer';
import VotersModal from '../elements/VotersModal';
import { api } from '@hiveio/hive-js';
import * as appActions from '../../../app/redux/AppReducer';

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
            limit: 50,
            last_proposal: false,
            status: 'votable',
            order_by: 'by_total_votes',
            order_direction: 'descending',
            open_modal: false,
            voters: [],
            voters_accounts: [],
            total_vests: '',
            total_vest_hive: '',
            new_id: '',
            is_voters_data_loaded: false,
        };
        this.fetchVoters = this.fetchVoters.bind(this);
        this.fetchGlobalProps = this.fetchGlobalProps.bind(this);
        this.fetchDataForVests = this.fetchDataForVests.bind(this);
        this.setIsVotersDataLoading = this.setIsVotersDataLoading.bind(this);
    }
    async componentWillMount() {
        await this.load();
    }

    componentDidMount() {
        this.fetchGlobalProps();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.new_id !== this.state.new_id) {
            this.fetchVoters();
            this.setIsVotersDataLoading(false);
        }
        if (prevState.voters !== this.state.voters) {
            this.fetchDataForVests();
        }
        if (prevState.voters_accounts !== this.state.voters_accounts) {
            this.setIsVotersDataLoading(!this.state.is_voters_data_loaded);
        }
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

    triggerModal = () => {
        this.setState({
            open_modal: !this.state.open_modal,
        });
    };

    getVoters = (voters) => {
        this.setState({ voters });
    };
    getVotersAccounts = (voters_accounts) => {
        this.setState({ voters_accounts });
    };

    getNewId = (new_id) => {
        this.setState({ new_id });
    };

    setIsVotersDataLoading = (is_voters_data_loaded) => {
        this.setState({ is_voters_data_loaded });
    };

    fetchGlobalProps() {
        api.callAsync('condenser_api.get_dynamic_global_properties', [])
            .then((res) =>
                this.setState({
                    total_vests: res.total_vesting_shares,
                    total_vest_hive: res.total_vesting_fund_hive,
                })
            )
            .catch((err) => console.log(err));
    }

    fetchVoters() {
        api.callAsync('database_api.list_proposal_votes', {
            start: [this.state.new_id],
            limit: 1000,
            order: 'by_proposal_voter',
            order_direction: 'ascending',
            status: 'active',
        })
            .then((res) => this.getVoters(res.proposal_votes))
            .catch((err) => console.log(err));
    }
    fetchDataForVests() {
        const voters = this.state.voters;
        const voters_map = voters.map((name) => name.voter);
        api.callAsync('condenser_api.get_accounts', [voters_map, false])
            .then((res) => this.getVotersAccounts(res))
            .catch((err) => console.log(err));
    }

    render() {
        const {
            proposals,
            loading,
            status,
            order_by,
            order_direction,
            voters,
            voters_accounts,
            open_modal,
            total_vests,
            total_vest_hive,
            is_voters_data_loaded,
            new_id,
        } = this.state;
        const { nightmodeEnabled } = this.props;

        let showBottomLoading = false;
        if (loading && proposals && proposals.length > 0) {
            showBottomLoading = true;
        }

        const accounts_map = voters_accounts.map((acc) => acc.vesting_shares); // hive power
        const voters_map = voters.map((name) => name.voter); // voter name
        const acc_proxied_vests = voters_accounts.map(
            (acc) =>
                acc.proxied_vsf_votes
                    .map((r) => parseInt(r, 10))
                    .reduce((a, b) => a + b, 0) // proxied hive power
        );
        let hive_power = [];
        const calculateHivePower = () => {
            //loop through each account vesting shares to calculate hive power
            for (let i = 0; i < accounts_map.length; i++) {
                const vests = parseFloat(accounts_map[i].split(' ')[0]);
                const total_vestsNew = parseFloat(total_vests.split(' ')[0]);
                const total_vest_hiveNew = parseFloat(
                    total_vest_hive.split(' ')[0]
                );
                const vesting_hivef =
                    total_vest_hiveNew * (vests / total_vestsNew);

                hive_power.push(vesting_hivef);
            }
        };
        calculateHivePower();

        let proxy_hp = [];
        const calculateProxyHp = () => {
            for (let i = 0; i < acc_proxied_vests.length; i++) {
                const vests = acc_proxied_vests[i];
                const total_vestsNew = parseFloat(total_vests.split(' ')[0]);
                const total_vest_hiveNew = parseFloat(
                    total_vest_hive.split(' ')[0]
                );
                const vesting_hivef =
                    total_vest_hiveNew * (vests / total_vestsNew);
                proxy_hp.push(vesting_hivef * 0.000001);
            }
        };
        calculateProxyHp();

        const total_hp = hive_power.map((num, index) => num + proxy_hp[index]);

        //create object of total, hp and proxy hp values
        let total_acc_hp_obj = {};

        voters_map.forEach(
            (voter, i) =>
                (total_acc_hp_obj[voter] = [
                    total_hp[i],
                    hive_power[i],
                    proxy_hp[i],
                ])
        );
        let sort_merged_total_hp = [];

        //push object to array
        for (let value in total_acc_hp_obj) {
            sort_merged_total_hp.push([value, ...total_acc_hp_obj[value]]); // total = hp + proxy
        }

        //sort acount names by total hp count
        sort_merged_total_hp.sort((a, b) => b[1] - a[1]); // total = hp + proxy
        return (
            <div>
                <VotersModal
                    new_id={new_id}
                    is_voters_data_loaded={is_voters_data_loaded}
                    sort_merged_total_hp={sort_merged_total_hp}
                    open_modal={open_modal}
                    close_modal={this.triggerModal}
                    nightmodeEnabled={nightmodeEnabled}
                />
                <ProposalListContainer
                    getNewId={this.getNewId}
                    getVoters={this.getVoters}
                    triggerModal={this.triggerModal}
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
                nightmodeEnabled: state.app.getIn([
                    'user_preferences',
                    'nightmode',
                ]),
            };
        },
        (dispatch) => {
            return {
                toggleNightmode: (e) => {
                    if (e) e.preventDefault();
                    dispatch(appActions.toggleNightmode());
                },
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
