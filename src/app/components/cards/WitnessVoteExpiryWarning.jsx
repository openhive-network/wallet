import React from 'react';
import { connect } from 'react-redux';
import Moment from 'moment';
import { FormattedHTMLMessage } from 'app/Translator';

class WitnessVoteExpiryWarning extends React.Component {
    render() {
        const { governance_vote_expiration_ts } = this.props;
        const governance_vote_expiration_time = governance_vote_expiration_ts !== undefined
            ? governance_vote_expiration_ts
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('.')[0];
        const now = Moment();
        const expiryDate = Moment(`${governance_vote_expiration_time}Z`);
        const expiryYear = parseInt(expiryDate.format('YYYY'));
        const expiryDiff = expiryDate.diff(now, 'months');

        if (expiryDiff > 3 || !expiryDiff || !expiryDate) {
            return null;
        }

        return (
            <div className="App__announcement row">
                <div className="column">
                    <div className="callout alert">
                        <p>
                            {expiryYear >= 2016 && expiryDiff > 0 && (
                                <FormattedHTMLMessage
                                    className="primary"
                                    id="g.governanceExpiryWarning"
                                    params={{
                                        date: expiryDate.format('ll'),
                                        duration: '1 year',
                                    }}
                                />
                            )}
                            {expiryYear >= 2016 && expiryDiff <= 0 && (
                                <FormattedHTMLMessage
                                    className="primary"
                                    id="g.governanceExpired"
                                    params={{
                                        date: expiryDate.format('ll'),
                                        duration: '1 year',
                                    }}
                                />
                            )}
                            {expiryYear < 2016 && (
                                <FormattedHTMLMessage
                                    className="primary"
                                    id="g.pleaseVoteForWitnesses"
                                />
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    const { account } = ownProps;

    return {
        account,
        governance_vote_expiration_ts: state.global.getIn([
            'accounts',
            account,
            'governance_vote_expiration_ts',
        ]),
    };
})(WitnessVoteExpiryWarning);
