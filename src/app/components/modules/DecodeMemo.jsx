import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { memo } from '@hiveio/hive-js';
import tt from 'counterpart';
import { connect } from 'react-redux';

import { hasCompatibleKeychain, decodeMemo } from 'app/utils/HiveKeychain';

const propTypes = {
    // redux
    // eslint-disable-next-line react/forbid-prop-types
    currentUser: PropTypes.object.isRequired,
    message: PropTypes.string.isRequired,
};

/** Warning .. This is used for Power UP too. */
class DecodeMemo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            privateKey: '',
            decodedMessage: '',
            error: '',
        };
    }

    render() {
        const { currentUser, message } = this.props;
        const { privateKey, decodedMessage, error } = this.state;

        const decodeWithKeychain = (e) => {
            e.preventDefault();
            e.stopPropagation();

            decodeMemo(message, currentUser.get('username'), (resp) => {
                if (resp.success) {
                    // document.getElementById('decoded_memo').value = resp.result.substring(1);
                    this.setState({
                        decodedMessage: resp.result.substring(1),
                    });
                } else {
                    console.error(
                        'Keychain MEMO decoding error',
                        JSON.stringify(resp)
                    );
                    this.setState({
                        error:
                            'Error decoding MEMO with Keychain: the private key is invalid ' +
                            'or the MEMO message is not encrypted.',
                    });
                }
            });
        };

        const decodeWithPrivateKey = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const privK = document.getElementById('memo_priv').value;
            try {
                const resp = memo.decode(privK, message);
                // document.getElementById('decoded_memo').value = resp.substring(1);
                this.setState({
                    decodedMessage: resp.substring(1),
                });
            } catch (err) {
                console.error('memo decryption error', err);
                this.setState({
                    error:
                        `Error decoding MEMO: the private key is invalid ` +
                        'or the MEMO message is not encrypted.',
                });
            }
        };

        const onPrivateKeyChange = (e) => {
            const { target } = e;
            this.setState({
                privateKey: target.value,
                error: '',
                decodedMessage: '',
            });
        };

        const form = (
            <form>
                <div>
                    <div className="row">
                        <div className="column small-12">
                            <p>
                                To decode an encrypted MEMO message, you will
                                need to provide the MEMO private key or use Hive
                                Keychain.
                            </p>
                            <p>
                                Your private key will not be sent to the server
                                or saved in the browser. You will have to enter
                                it again next time you are requesting a MEMO
                                decoding.
                            </p>
                        </div>
                    </div>
                    <br />
                </div>

                <div className="row">
                    <div className="column small-4" style={{ paddingTop: 5 }}>
                        MEMO private key
                    </div>
                    <div className="column small-8">
                        <div
                            className="input-group"
                            style={{ marginBottom: '1.25rem' }}
                        >
                            <input
                                id="memo_priv"
                                className="input-group-field bold"
                                type="password"
                                value={privateKey}
                                onChange={onPrivateKeyChange}
                            />
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="row">
                        <div className="column small-4">Original message</div>
                        <div className="column small-8">
                            <input
                                type="text"
                                disabled
                                placeholder={tt('g.memo')}
                                value={message}
                            />
                        </div>
                    </div>
                )}
                <div className="row">
                    <div className="column small-12" style={{ paddingTop: 33 }}>
                        Decoded message
                    </div>
                </div>
                <div className="row">
                    <div className="column small-12">
                        <textarea
                            id="decoded_memo"
                            rows={4}
                            value={decodedMessage}
                        />
                    </div>
                </div>
                {error && <div className="error">{error}</div>}
                <div className="row" style={{ paddingTop: 33 }}>
                    <div className="column">
                        <span>
                            <button
                                type="submit"
                                className="button"
                                onClick={decodeWithPrivateKey}
                                disabled={!privateKey}
                            >
                                Decode with private key
                            </button>
                            {hasCompatibleKeychain() && (
                                <button
                                    type="submit"
                                    className="button"
                                    onClick={decodeWithKeychain}
                                >
                                    Decode with Keychain
                                </button>
                            )}
                        </span>
                    </div>
                </div>
            </form>
        );
        return (
            <div>
                <div className="row">
                    <h3 className="column">Decode MEMO message</h3>
                </div>
                {form}
            </div>
        );
    }
}

DecodeMemo.propTypes = propTypes;

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current']);
        const currentAccount = state.global.getIn([
            'accounts',
            currentUser.get('username'),
        ]);

        return {
            ...ownProps,
            currentUser,
            currentAccount,
        };
    }
)(DecodeMemo);
