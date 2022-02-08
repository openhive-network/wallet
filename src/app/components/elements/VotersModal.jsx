import React from 'react';
import ReactModal from 'react-modal';
import { APP_URL } from '../../../app/client_config';
import './VotersModal.scss';
import LoadingIndicator from './LoadingIndicator';
import Userpic, { SIZE_SMALL } from './Userpic';
ReactModal.defaultStyles.overlay.backgroundColor = 'rgba(0, 0, 0, 0.6)';

class VotersModal extends React.Component {
    render() {
        const {
            open_modal,
            close_modal,
            sort_merged_total_hp,
            is_voters_data_loaded,
            new_id,
        } = this.props;

        const modalStyles = {
            content: {
                minWidth: '300px',
                minHeight: '500px',
                width: '40vw',
                height: '70vh',
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
            },
        };
        return (
            <div className="voters-modal__container">
                <ReactModal
                    isOpen={open_modal}
                    onAfterOpen={() => open_modal}
                    onRequestClose={close_modal}
                    style={modalStyles}
                    ariaHideApp={false}
                >
                    {is_voters_data_loaded === false ? (
                        <div className="voters-modal__loader">
                            <LoadingIndicator type="dots" />
                        </div>
                    ) : (
                        <div className="voters-modal__header">
                            <header className="header">
                                <h4>
                                    Votes on proposal&nbsp;
                                    <span className="header__id">
                                        #{new_id}
                                    </span>
                                </h4>
                            </header>
                            <hr />
                            <div className="content">
                                <div className="content__row row">
                                    {sort_merged_total_hp.map((each, index) => {
                                        const userInfo = {
                                            name: each[0],
                                            hivePower: each[2].toFixed(2),
                                            proxyHp: each[3].toFixed(2),
                                        };
                                        return (
                                            <div
                                                key={index}
                                                className="content__column column small-12 medium-6"
                                            >
                                                <div className="content__column__user">
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
                                                </div>
                                                <div className="content__column__values">
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
                    )}
                </ReactModal>
            </div>
        );
    }
}
export default VotersModal;
