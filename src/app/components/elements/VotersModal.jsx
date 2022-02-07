import React from 'react';
// import { Modal } from 'react-modal-overlay';
import Modal from 'react-modal';
import 'react-modal-overlay/dist/index.css';
import { APP_URL } from '../../../app/client_config';
import './VotersModal.scss';
// import { imageProxy } from '../../../app/utils/ProxifyUrl';
import LoadingIndicator from './LoadingIndicator';
import Userpic, { SIZE_SMALL } from './Userpic';
Modal.defaultStyles.overlay.backgroundColor = ' rgba(0, 0, 0, 0.6)';

class VotersModal extends React.Component {
    render() {
        const {
            openModal,
            closeModal,
            voters,
            // sortMergedResult,
            // sortMergedProxyResult,
            sortMergedTotalHp,
            voterDataLoading,
        } = this.props;
        const proposal = voters.map((proposal) => proposal.proposal);
        const proposalId = proposal.map((propId) => propId.id);
        // console.log(sortMergedTotalHp);
        const customStyles = {
            content: {
                width: '40vw',
                minWidth: '400px',
                height: '70vh',
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
                // overlay: 'rgba(0, 0, 0, 0.4)',
            },
        };
        return (
            <div>
                <Modal
                    isOpen={openModal}
                    onAfterOpen={() => openModal}
                    onRequestClose={closeModal}
                    style={customStyles}
                    ariaHideApp={false}
                >
                    {voterDataLoading === true ? (
                        <div>
                            <header style={{ textAlign: 'left' }}>
                                <h3>
                                    Votes on proposal&nbsp;
                                    <span style={{ color: 'red' }}>
                                        #{proposalId[0]}
                                    </span>
                                </h3>
                            </header>
                            <hr />
                            <div
                                style={{
                                    overflowX: 'clip',
                                    display: 'block',
                                }}
                                className="content"
                            >
                                <div className="row">
                                    {sortMergedTotalHp.map((each, index) => {
                                        const userInfo = {
                                            name: each[0],
                                            hivePower: each[2].toFixed(2),
                                            proxyHp: each[3].toFixed(2),
                                            // image: `https://images.hive.blog/u/${each[0]}/avatar`,
                                        };
                                        // const style = {
                                        //     backgroundImage:
                                        //         'url(' +
                                        //         imageProxy() +
                                        //         `u/${each[0]}/avatar)`,
                                        // };
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                                className="column small-12 medium-6"
                                            >
                                                <Userpic
                                                    account={userInfo.name}
                                                    size={SIZE_SMALL}
                                                />

                                                <a
                                                    style={{ color: 'red' }}
                                                    href={`${APP_URL}/@${each[0]}`}
                                                    target="_blank"
                                                >
                                                    {userInfo.name}
                                                </a>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent:
                                                            'center',
                                                        alignItems: 'center',
                                                        color: '#788187',
                                                    }}
                                                >
                                                    {userInfo.hivePower}
                                                    &nbsp; HP
                                                    {userInfo.proxyHp !==
                                                        '0.00' &&
                                                        ` + ${userInfo.proxyHp} Proxy`}
                                                </div>
                                                <hr></hr>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                            }}
                        >
                            <LoadingIndicator type="dots" />
                        </div>
                    )}
                </Modal>
            </div>
        );
    }
}
export default VotersModal;
