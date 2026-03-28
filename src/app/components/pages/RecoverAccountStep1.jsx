import React from 'react';
import tt from 'counterpart';
import { api } from '@hiveio/hive-js';

class RecoverAccountStep1 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            name_error: '',
            recovery_account: null,
            recovery_warning: '',
            loading: false,
        };
        this.onNameChange = this.onNameChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onNameChange(e) {
        const name = e.target.value.trim().toLowerCase();
        this.setState({
            name,
            name_error: '',
            recovery_account: null,
            recovery_warning: '',
        });
    }

    onSubmit(e) {
        e.preventDefault();
        const { name } = this.state;
        if (!name) return;

        this.setState({
            loading: true,
            name_error: '',
            recovery_account: null,
            recovery_warning: '',
        });
        api.getAccountsAsync([name])
            .then(res => {
                if (!res || res.length === 0) {
                    this.setState({
                        name_error: 'Account not found.',
                        loading: false,
                    });
                    return;
                }
                const [account] = res;

                let recovery_warning = '';
                const ownerUpdate = /Z$/.test(account.last_owner_update)
                    ? account.last_owner_update
                    : account.last_owner_update + 'Z';
                const ownerUpdateTime = new Date(ownerUpdate).getTime();
                const THIRTY_DAYS_AGO =
                    Date.now() - 30 * 24 * 60 * 60 * 1000;
                if (ownerUpdateTime < THIRTY_DAYS_AGO) {
                    recovery_warning =
                        'This account has not had its owner key changed in the last 30 days. ' +
                        'Account recovery is only possible if the owner key was changed (by an attacker) within the last 30 days.';
                }

                this.setState({
                    recovery_account: account.recovery_account,
                    recovery_warning,
                    loading: false,
                });
            })
            .catch(() => {
                this.setState({
                    name_error:
                        'Error looking up account. Please try again.',
                    loading: false,
                });
            });
    }

    renderRecoveryPartnerResult() {
        const { recovery_account, recovery_warning, name } = this.state;
        if (!recovery_account) return null;

        const isSteem = recovery_account === 'steem';

        return (
            <div
                style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f6f6f6',
                    borderRadius: '4px',
                }}
            >
                <p>
                    <strong>Recovery partner for @{name}:</strong>{' '}
                    <a
                        href={'https://hive.blog/@' + recovery_account}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @{recovery_account}
                    </a>
                </p>

                {recovery_warning && (
                    <p style={{ color: '#a94442', fontWeight: 'bold' }}>
                        {recovery_warning}
                    </p>
                )}

                {isSteem && (
                    <div style={{ color: '#a94442', marginTop: '0.5rem' }}>
                        <strong>Warning:</strong> <code>@steem</code> is a
                        legacy Steem account that does not operate on the
                        Hive blockchain. It cannot process recovery
                        requests. If you still have access to your account,{' '}
                        <strong>
                            change your recovery partner immediately
                        </strong>{' '}
                        using your owner key or master password. If your
                        account is already compromised, recovery through the
                        standard process is not possible with this recovery
                        partner. Reach out to the Hive community for
                        assistance (see below).
                    </div>
                )}

                {!isSteem && (
                    <div style={{ marginTop: '0.5rem' }}>
                        To recover your account, you need to contact{' '}
                        <strong>@{recovery_account}</strong> and ask them to
                        submit a recovery request on your behalf using the
                        account recovery tool linked below. Once they submit
                        the request, you have 24 hours to confirm the
                        recovery.
                    </div>
                )}
            </div>
        );
    }

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

        const { name, name_error, loading } = this.state;

        return (
            <div className="RestoreAccount">
                <div className="row">
                    <div className="column large-8 medium-10 small-12">
                        <h2>Stolen Account Recovery</h2>

                        <div
                            style={{
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                background: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: '4px',
                            }}
                        >
                            <strong>Important:</strong> This process is for
                            accounts that have been{' '}
                            <em>compromised</em> (someone changed your keys
                            without your permission). If you simply lost
                            your password and no one changed your keys, your
                            account cannot be recovered &mdash; Hive is a
                            blockchain with no &ldquo;forgot
                            password&rdquo; feature.
                        </div>

                        <h3>How Hive Account Recovery Works</h3>
                        <p>
                            Hive account recovery requires cooperation
                            between you (the account owner) and your
                            designated{' '}
                            <strong>recovery partner</strong>. The process
                            works as follows:
                        </p>
                        <ol>
                            <li>
                                <strong>You</strong> must have an owner key
                                or master password that was valid within the
                                last 30 days.
                            </li>
                            <li>
                                <strong>Your recovery partner</strong>{' '}
                                submits a recovery request to the blockchain
                                on your behalf.
                            </li>
                            <li>
                                <strong>You</strong> confirm the recovery
                                within 24 hours using your old key and a new
                                key.
                            </li>
                            <li>
                                Your account keys are updated and the
                                attacker loses access.
                            </li>
                        </ol>

                        <h3>Step 1: Find Your Recovery Partner</h3>
                        <p>
                            Enter your account name to see who your recovery
                            partner is. This determines which tools and
                            steps are available to you.
                        </p>
                        <form onSubmit={this.onSubmit} noValidate>
                            <div
                                className={name_error ? 'error' : ''}
                                style={{ maxWidth: '400px' }}
                            >
                                <label>
                                    Account Name
                                    <input
                                        type="text"
                                        name="name"
                                        autoComplete="off"
                                        onChange={this.onNameChange}
                                        value={name}
                                        placeholder="Enter your Hive username"
                                    />
                                </label>
                                {name_error && (
                                    <p className="error">{name_error}</p>
                                )}
                                <input
                                    disabled={!name || loading}
                                    type="submit"
                                    className="button"
                                    value={
                                        loading
                                            ? 'Looking up...'
                                            : 'Look Up Recovery Partner'
                                    }
                                />
                            </div>
                        </form>

                        {this.renderRecoveryPartnerResult()}

                        <h3 style={{ marginTop: '2rem' }}>
                            Step 2: Start the Recovery
                        </h3>
                        <p>
                            Once you know your recovery partner, use one
                            of these tools to proceed with the recovery
                            process:
                        </p>
                        <ul>
                            <li>
                                <a
                                    href="https://recovery.hive-keychain.com/account-recovery"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    recovery.hive-keychain.com
                                </a>{' '}
                                &mdash; Account recovery tool by the Hive
                                Keychain team
                            </li>
                            <li>
                                <a
                                    href="https://recovery.hivechain.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    recovery.hivechain.app
                                </a>{' '}
                                &mdash; Account recovery service by
                                @arcange
                            </li>
                        </ul>

                        <h3>Step 3: Prevent Future Issues</h3>
                        <ul>
                            <li>
                                <strong>
                                    Change your recovery partner
                                </strong>{' '}
                                if it is currently set to{' '}
                                <code>@steem</code> (a defunct legacy
                                account that cannot process recovery on
                                Hive). Use your owner key to set it to a
                                trusted, active Hive account &mdash;
                                someone who can verify your identity
                                through other channels (e.g. a friend,
                                community leader, or service you
                                interact with). Your recovery partner
                                needs to know who you are to authorize
                                the recovery.
                            </li>
                            <li>
                                Never store keys in cloud services (Google
                                Drive, email, online notes).
                            </li>
                            <li>
                                Use the{' '}
                                <a
                                    href="https://hive-keychain.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Hive Keychain
                                </a>{' '}
                                browser extension for secure key management.
                            </li>
                        </ul>

                        <h3>Need More Help?</h3>
                        <p>
                            If your recovery partner is unresponsive or you
                            need assistance, reach out to the Hive community
                            through the{' '}
                            <a
                                href="https://discord.gg/E2tFRYB42j"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Hive Discord
                            </a>{' '}
                            server.
                        </p>
                        <p>
                            For technical details about the recovery
                            process, see the{' '}
                            <a
                                href="https://developers.hive.io/tutorials-python/account_recovery.html"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Hive Developer Documentation
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'recover_account_step_1',
    component: RecoverAccountStep1,
};
