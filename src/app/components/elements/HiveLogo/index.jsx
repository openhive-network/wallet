import React from 'react';
import PropTypes from 'prop-types';

const HiveLogo = ({ nightmodeEnabled }) => {
    const logo = nightmodeEnabled
        ? '/images/hive-wallet-logo-nightmode.svg'
        : '/images/hive-wallet-logo.svg';

    return (
        <span className="logo">
            {/* <svg width="150" height="40" viewBox="0 0 150 40" version="1.1">
                <title>Home</title>
                <g id="logo" />
            </svg> */}
            <img alt="logo" width="150" height="40" src={logo} />
        </span>
    );
};

export default HiveLogo;
