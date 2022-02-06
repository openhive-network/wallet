import React from 'react';
import { Modal } from 'react-modal-overlay';
import 'react-modal-overlay/dist/index.css';
import { APP_URL } from '../../../app/client_config';
import './VotersModal.scss';
import { imageProxy } from '../../../app/utils/ProxifyUrl';

class VotersModal extends React.Component {
    render() {
        const {
            openModal,
            closeModal,
            voters,
            // sortMergedResult,
            // sortMergedProxyResult,
            sortMergedTotalHp,
            isVotersDataLoading,
        } = this.props;
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
                            {sortMergedTotalHp.map((each, index) => {
                                const userInfo = {
                                    name: each[0],
                                    hivePower: each[2],
                                    proxyHp: each[3],
                                    image: `https://images.hive.blog/u/${each[0]}/avatar`,
                                };
                                const style = {
                                    backgroundImage:
                                        'url(' +
                                        imageProxy() +
                                        `u/${each[0]}/avatar)`,
                                };
                                return (
                                    <div
                                        key={index}
                                        // style={{ height: '50px' }}
                                        className="column small-6"
                                    >
                                        <div className="avatar" style={style} />
                                        <a
                                            href={`${APP_URL}/@${each[0]}`}
                                            target="_blank"
                                        >
                                            {userInfo.name}
                                        </a>
                                        <div>
                                            {userInfo.hivePower}&nbsp; HP
                                            <br></br>
                                            {userInfo.proxyHp !== 0 &&
                                                `${userInfo.proxyHp} Proxy`}
                                        </div>

                                        <hr></hr>
                                    </div>
                                );
                            })}
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
