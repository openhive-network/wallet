import React from 'react';
import { Modal } from 'react-modal-overlay';
import 'react-modal-overlay/dist/index.css';
import { APP_URL } from '../../../app/client_config';

class VotersModal extends React.Component {
    render() {
        const {
            openModal,
            closeModal,
            voters,
            // getVotersAccounts,
            message,
            // votersAccounts,
        } = this.props;
        // const votersUsernames = voters.map((name) => name.voter);
        const proposal = voters.map((proposal) => proposal.proposal);
        const proposalId = proposal.map((propId) => propId.id);

        return (
            <div>
                <Modal show={openModal} closeModal={closeModal}>
                    <header style={{ textAlign: 'left' }}>
                        <h1>
                            {proposalId[0] === undefined
                                ? 'Loading...'
                                : `Votes on proposal #${proposalId[0]}`}
                        </h1>
                    </header>
                    <hr />
                    <div
                        style={{ overflowX: 'clip', display: 'block' }}
                        className="content"
                    >
                        <div className="row">
                            {message.map((each, index) => (
                                <div
                                    key={index}
                                    style={{ height: '50px' }}
                                    className="column small-6"
                                >
                                    <a
                                        href={`${APP_URL}/@${each}`}
                                        target="_blank"
                                    >
                                        {each}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                    <hr />
                    <footer>Footer if needed</footer>
                </Modal>
            </div>
        );
    }
}
export default VotersModal;
