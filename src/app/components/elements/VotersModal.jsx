import React from 'react';
import { Modal } from 'react-modal-overlay';
import 'react-modal-overlay/dist/index.css';
import { APP_URL } from '../../../app/client_config';

class VotersModal extends React.Component {
    render() {
        const { openModal, closeModal, voters, sortMergedResult } = this.props;
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
                            {sortMergedResult.map((each, index) => (
                                <div
                                    key={index}
                                    // style={{ height: '50px' }}
                                    className="column small-6"
                                >
                                    <p>Name</p>
                                    <a
                                        href={`${APP_URL}/@${each[0]}`}
                                        target="_blank"
                                    >
                                        {each[0]}
                                    </a>
                                    <p>Hive Power</p>
                                    <p>{each[1]}</p>
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
