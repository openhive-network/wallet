import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import { imageProxy } from 'app/utils/ProxifyUrl';

export const SIZE_SMALL = 'small';
export const SIZE_MED = 'medium';
export const SIZE_LARGE = 'large';

const sizeList = [SIZE_SMALL, SIZE_MED, SIZE_LARGE];

export const avatarSize = {
    small: SIZE_SMALL,
    medium: SIZE_MED,
    large: SIZE_LARGE,
};

class Userpic extends Component {
    shouldComponentUpdate = shouldComponentUpdate(this, 'Userpic');

    render() {
        const { account, json_metadata, size, className = '' } = this.props;
        const hideIfDefault = this.props.hideIfDefault || false;
        const avSize = size && sizeList.indexOf(size) > -1 ? '/' + size : '';

        // try to extract image url from users metaData
        if (hideIfDefault) {
            try {
                const md = JSON.parse(json_metadata);
                if (!/^(https?:)\/\//.test(md.profile.profile_image)) {
                    return null;
                }
            } catch (e) {
                return null;
            }
        }

        const style = {
            backgroundImage:
                'url(' + imageProxy() + `u/${account}/avatar${avSize})`,
        };

        return (
            <div className={classnames('Userpic', className)} style={style} />
        );
    }
}

Userpic.propTypes = {
    account: PropTypes.string.isRequired,
};

export default connect((state, ownProps) => {
    const { account, hideIfDefault } = ownProps;
    return {
        account,
        json_metadata: state.global.getIn([
            'accounts',
            account,
            'posting_json_metadata',
        ]),
        hideIfDefault,
    };
})(Userpic);
