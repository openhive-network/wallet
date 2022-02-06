import React from 'react';
import { connect } from 'react-redux';
import { actions as proposalActions } from 'app/redux/ProposalSaga';
import * as transactionActions from 'app/redux/TransactionReducer'; // TODO: Only import what we need.
import { List } from 'immutable';
import PropTypes from 'prop-types';
import ProposalListContainer from 'app/components/modules/ProposalList/ProposalListContainer';
import VotersModal from '../elements/VotersModal';
import { api } from '@hiveio/hive-js';

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
            openModal: false,
            voters: [],
            votersAccounts: [],
            total_vests: '',
            total_vest_hive: '',
            newId: '',
            // prevVoters:[],
            voterDataLoading: false,
        };
        this.fetchVoters = this.fetchVoters.bind(this);
        this.getGlobalProps = this.getGlobalProps.bind(this);
        this.fetchDataForVests = this.fetchDataForVests.bind(this);
        // this.calculateHivePower = this.calculateHivePower.bind(this);
        this.isVotersDataLoading = this.isVotersDataLoading.bind(this);
    }
    async componentWillMount() {
        await this.load();
    }

    componentDidMount() {
        this.getGlobalProps();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.newId !== this.state.newId) {
            this.fetchVoters();
        }
        if (prevState.voters !== this.state.voters) {
            this.fetchDataForVests();
            // this.calculateHivePower()
        }
        if (prevState.votersAccounts !== this.state.votersAccounts) {
            this.isVotersDataLoading(false);
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

    toggleModal = () => {
        this.setState({
            openModal: !this.state.openModal,
        });
    };

    getVoters = (voters) => {
        this.setState({ voters });
    };
    getVotersAccounts = (votersAccounts) => {
        this.setState({ votersAccounts });
    };

    getNewId = (newId) => {
        this.setState({ newId });
    };

    isVotersDataLoading = (voterDataLoading) => {
        this.setState({ voterDataLoading });
    };

    getGlobalProps() {
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
            start: [this.state.newId],
            limit: 250,
            order: 'by_proposal_voter',
            order_direction: 'ascending',
            status: 'active',
        })
            .then((res) => this.getVoters(res.proposal_votes))
            .catch((err) => console.log(err));
    }
    fetchDataForVests() {
        const voters = this.state.voters;
        const votersMap = voters.map((name) => name.voter);
        api.callAsync('condenser_api.get_accounts', [
            votersMap,
            false,
        ]).then((res) => this.getVotersAccounts(res));
    }

    render() {
        const {
            proposals,
            loading,
            status,
            order_by,
            order_direction,
            prevVoters,
        } = this.state;
        let showBottomLoading = false;
        if (loading && proposals && proposals.length > 0) {
            showBottomLoading = true;
        }
        const {
            voters,
            votersAccounts,
            gprops,
            openModal,
            total_vests,
            total_vest_hive,
            // hive_power,
            voterDataLoading,
        } = this.state;

        const accountsMap = votersAccounts.map((acc) => acc.vesting_shares);
        const votersMap = voters.map((name) => name.voter);

        console.log(voterDataLoading);

        let hivePower = [];
        const calculateHivePower = () => {
            //loop through each account vesting shares to calculate hive power
            for (let i = 0; i < accountsMap.length; i++) {
                const vests = parseFloat(accountsMap[i].split(' ')[0]);
                const total_vestsNew = parseFloat(total_vests.split(' ')[0]);
                const total_vest_hiveNew = parseFloat(
                    total_vest_hive.split(' ')[0]
                );
                const vesting_hivef =
                    total_vest_hiveNew * (vests / total_vestsNew);

                hivePower.push(vesting_hivef);
            }
        };
        calculateHivePower();

        const accProxiedVests = votersAccounts.map((acc) =>
            acc.proxied_vsf_votes
                .map((r) => parseInt(r, 10))
                .reduce((a, b) => a + b, 0)
        );

        let proxyHp = [];
        const calculateProxyHp = () => {
            for (let i = 0; i < accProxiedVests.length; i++) {
                const vests = accProxiedVests[i];
                const total_vestsNew = parseFloat(total_vests.split(' ')[0]);
                const total_vest_hiveNew = parseFloat(
                    total_vest_hive.split(' ')[0]
                );
                const vesting_hivef =
                    total_vest_hiveNew * (vests / total_vestsNew);
                proxyHp.push(vesting_hivef * 0.000001);
            }
        };
        calculateProxyHp();

        /// create object of two arrays (voters names and hive power)
        let mergeValues = {}; //// hp
        let mergeProxyValues = {}; ////proxy Hp

        let proxyToNumber = proxyHp.map((r) => parseInt(r, 10));

        votersMap.forEach((voter, i) => (mergeValues[voter] = hivePower[i])); //hp

        votersMap.forEach(
            (voter, i) => (mergeProxyValues[voter] = proxyHp[i]) //proxy
        );

        //push obj to array
        let sortMerged = []; //  hp
        let sortMerged2 = []; //  hp

        let sortMergedProxy = []; // proxy
        let sortMergedProxy2 = []; // proxy

        for (let value in mergeValues) {
            sortMerged.push([value, mergeValues[value]]); // hp
            sortMerged2.push([value, mergeValues[value]]); // hp
        }

        for (let value in mergeProxyValues) {
            sortMergedProxy.push([value, mergeProxyValues[value]]); // proxy
            sortMergedProxy2.push([value, mergeProxyValues[value]]); // proxy
        }
        //sort by hp in descending order
        const sortMergedResult = sortMerged.sort((a, b) => b[1] - a[1]); // hp

        const sortMergedProxyResult = sortMergedProxy.sort(
            (a, b) => b[1] - a[1]
        ); //proxy

        const totalHp = hivePower.map((num, index) => num + proxyHp[index]);

        // console.log(hivePower.sort((a, b) => b - a));
        // console.log(proxyHp.sort((a, b) => b - a));
        // console.log(totalHp.sort((a, b) => b - a));

        const totalAccHpObj = {};

        votersMap.forEach(
            (voter, i) =>
                (totalAccHpObj[voter] = [totalHp[i], hivePower[i], proxyHp[i]]) //total
        );
        let sortMergedTotalHp = [];
        let sortMergedTotalHp2 = [];

        for (let value in totalAccHpObj) {
            sortMergedTotalHp.push([value, ...totalAccHpObj[value]]); // total
            // sortMergedTotalHp2.push([value, totalAccHpObj[value]]); // total
        }

        const sortTotalResult = sortMergedTotalHp.sort((a, b) => b[1] - a[1]); // total

        const keyOfProxy = sortTotalResult.map((r) => r[0]);

        // console.log(sortMergedTotalHp2.map((r) => r[0]));
        // console.log(sortMergedProxy2.map((r) => r[1]));
        // console.log(sortMerged2.map((r) => r[1]));

        const newObj = {};
        votersMap.forEach(
            (voter, i) => (newObj[voter] = [hivePower[i], proxyHp[i]]) //total
        );

        let sortMergedTotalH3 = [];
        for (let value in newObj) {
            sortMergedTotalH3.push([value, newObj[value]]); // total
        }

        // console.log(sortMergedTotalHp);

        // console.log(Object.values(totalAccHpObj));c
        // console.log(sortMergedTotalHp);

        // console.log(proxyToNumber.sort((a, b) => b - a));

        // const votersNames = sortMergedResult.map((acc) => acc[0]);
        // const votersHp = sortMergedResult.map((acc) => acc[1]);

        ///push names and hp to object

        // const voters_sorted_by_hp = {};

        // votersNames.forEach(
        //     (name, i) => (voters_sorted_by_hp[name] = votersHp[i])
        // );

        /////////// Proxy HP ????

        // const vests = 12216893515079165 + 374040654240;

        // const total_vestsNew = parseFloat(total_vests.split(' ')[0]);
        // const total_vest_hiveNew = parseFloat(total_vest_hive.split(' ')[0]);

        // const vesting_hivef = total_vest_hiveNew * (vests / total_vestsNew);

        // console.log(proxyHp);
        //6,623,708.494

        // ////////////

        return (
            <div>
                <VotersModal
                    isVotersDataLoading={this.isVotersDataLoading}
                    sortMergedTotalHp={sortMergedTotalHp}
                    votersMap={votersMap}
                    votersAccounts={votersAccounts}
                    getVotersAccounts={this.getVotersAccounts}
                    voters={voters}
                    openModal={this.state.openModal}
                    closeModal={this.toggleModal}
                />
                <ProposalListContainer
                    getNewId={this.getNewId}
                    getVoters={this.getVoters}
                    triggerModal={this.toggleModal}
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

                    {/* {showBottomLoading ? <a>{`Loading more...`}</a> : null} */}
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
