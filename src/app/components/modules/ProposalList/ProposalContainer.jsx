import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Proposal from './Proposal';

class ProposalContainer extends React.Component {
    constructor(props) {
        // console.log('ProposalContainer.jsx::constructor()', props);
        super(props);
        this.state = {
            isVoting: false,
            voteFailed: false,
            voteSucceeded: false,
            isUpVoted: props.proposal.upVoted,
            // needed from global state object to calculate vests to sp
            total_vesting_shares: props.total_vesting_shares,
            total_vesting_fund_hive: props.total_vesting_fund_hive,
            triggerModal: props.triggerModal,
        };
        this.id = this.props.proposal.id;
    }

    async componentWillMount() {
        // await console.log('ProposalContainer.jsx::componentWillMount()');
    }

    onVote = () => {
        this.setState({
            isVoting: true,
            voteFailed: false,
            voteSucceeded: false,
        });
        const voteForIt = !this.state.isUpVoted;
        console.log(
            'const voteForIt = !this.props.proposal.upVoted;',
            voteForIt
        );
        this.props.voteOnProposal(
            this.id,
            voteForIt,
            () => {
                console.log('voteOnProposal->success()');
                this.setState({
                    isVoting: false,
                    voteFailed: false,
                    voteSucceeded: true,
                    isUpVoted: voteForIt,
                });
                console.log('voteOnProposal->voteForIt', voteForIt);
            },
            () => {
                console.log('voteOnProposal->failure()');
                this.setState({
                    isVoting: false,
                    voteFailed: true,
                    voteSucceeded: false,
                    isUpVoted: !voteForIt,
                });
                console.log('voteOnProposal->voteForIt', voteForIt);
            }
        );
    };

    render() {
        setInterval(() => {
            this.setState({ testing: 'pooooo' });
        }, 5000);
        const {
            proposal,
            total_vesting_shares,
            total_vesting_fund_hive,
            getVoters,
            getAccouns,
            getGlobalProps,
        } = this.props;
        // console.log('ProposalContainer.jsx::render()', this.props);
        return (
            <Proposal
                getGlobalProps={getGlobalProps}
                getAccouns={getAccouns}
                getVoters={getVoters}
                triggerModal={this.state.triggerModal}
                {...proposal}
                onVote={this.onVote}
                {...this.state}
                total_vesting_shares={total_vesting_shares}
                total_vesting_fund_hive={total_vesting_fund_hive}
            />
        );
    }
}

ProposalContainer.propTypes = {
    proposal: PropTypes.shape({ creator: PropTypes.string.isRequired })
        .isRequired, // TODO: Add Shape
    voteOnProposal: PropTypes.func.isRequired,
};

export default connect((state, ownProps) => {
    // pulling these out of state object to calculate vests to sp
    const total_vesting_shares = state.global.getIn([
        'props',
        'total_vesting_shares',
    ]);
    const total_vesting_fund_hive = state.global.getIn([
        'props',
        'total_vesting_fund_hive',
    ]);
    return { total_vesting_shares, total_vesting_fund_hive, ...ownProps };
})(ProposalContainer);
