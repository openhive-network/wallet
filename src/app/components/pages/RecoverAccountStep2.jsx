import React from 'react';
import tt from 'counterpart';

class RecoverAccountStep2 extends React.Component {
    render() {
        if (!process.env.BROWSER) {
            return (
                <div className="row">
                    <div className="column">
                        {tt('g.loading')}...
                    </div>
                </div>
            );
        }

        return (
            <div className="RestoreAccount">
                <div className="row">
                    <div className="column large-8 medium-10 small-12">
                        <h2>Account Recovery</h2>
                        <p>
                            The previous email-based recovery flow is no
                            longer available on this site.
                        </p>
                        <p>
                            Please visit the{' '}
                            <a href="/recover_account_step_1">
                                Account Recovery Guide
                            </a>{' '}
                            for current instructions on how to recover a
                            compromised Hive account, including how to find
                            your recovery partner and which tools to use.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'recover_account_step_2',
    component: RecoverAccountStep2,
};
