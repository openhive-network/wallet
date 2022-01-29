import React from 'react';
import { Modal } from 'react-modal-overlay';
import 'react-modal-overlay/dist/index.css';

export default function VotersModal({ openModal, closeModal }) {
    return (
        <Modal show={openModal} closeModal={closeModal}>
            <h4> here is modal data </h4>
        </Modal>
    );
}
