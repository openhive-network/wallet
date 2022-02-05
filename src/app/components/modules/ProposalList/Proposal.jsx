/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import NumAbbr from 'number-abbreviate';
import tt from 'counterpart';
import cx from 'classnames';
import Userpic, { SIZE_SMALL } from 'app/components/elements/Userpic';
import { numberWithCommas } from 'app/utils/StateFunctions';
import { APP_URL, REFUND_ACCOUNTS, BURN_ACCOUNTS } from 'app/client_config';

import Icon from 'app/components/elements/Icon';

const numAbbr = new NumAbbr();

function getFundingType(account) {
    if (REFUND_ACCOUNTS.includes(account)) return 'refund';

    if (BURN_ACCOUNTS.includes(account)) return 'burn';

    return null;
}

export class Proposal extends React.Component {
    render() {
        const {
            id,
            start_date,
            end_date,
            creator,
            receiver,
            daily_pay,
            subject,
            total_votes,
            permlink,
            onVote,
            isVoting,
            voteFailed,
            isUpVoted,
            total_vesting_shares,
            total_vesting_fund_hive,
            triggerModal,
            getNewId,
        } = this.props;

        const start = new Date(start_date);
        const end = new Date(end_date);
        const durationInDays = Moment(end).diff(Moment(start), 'days');
        const totalPayout = durationInDays * daily_pay.split(' ')[0]; // ¯\_(ツ)_/¯
        const votesToHP = simpleVotesToHp(
            total_votes,
            total_vesting_shares,
            total_vesting_fund_hive
        );

        const fundingType = getFundingType(receiver);

        const classUp = cx('Voting__button', 'Voting__button-up', {
            'Voting__button--upvoted': isUpVoted,
            'Voting__button--downvoted': voteFailed,
            votingUp: isVoting,
        });

        const handleVoteClick = () => {
            getNewId(id);
            triggerModal();
        };

        return (
            <div className="proposals__item">
                <div className="proposals__content">
                    <a
                        className="proposals__row title"
                        href={urlifyPermlink(creator, permlink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        alt={startedOrFinishedInWordsLongVersion(start, end)}
                        title={startedOrFinishedInWordsLongVersion(start, end)}
                    >
                        {subject}&nbsp;<span className="id">#{id}</span>
                    </a>
                    <div className="proposals__row description">
                        <div className="date">
                            {formatDate(start)}&nbsp;-&nbsp;{formatDate(end)}
                            &nbsp;(
                            {durationInDays} {tt('proposals.days')})
                        </div>
                        <div className="amount">
                            <span title={formatCurrency(totalPayout)}>
                                {abbreviateNumber(totalPayout)} HBD
                            </span>
                            &nbsp;(
                            {tt('proposals.daily')}&nbsp;
                            {abbreviateNumber(daily_pay.split(' ')[0])} HBD)
                        </div>
                        <span
                            className="status"
                            title={startedOrFinishedInWordsLongVersion(
                                start,
                                end
                            )}
                        >
                            {startedOrFinished(start, end)}
                        </span>
                        {fundingType && (
                            <span
                                className={cx(
                                    'status',
                                    'funding-type',
                                    fundingType
                                )}
                                title={tt(`proposals.${fundingType}`)}
                            >
                                {tt(`proposals.${fundingType}`)}
                            </span>
                        )}
                    </div>
                    <div className="proposals__row details">
                        <Userpic account={creator} size={SIZE_SMALL} />
                        <div className="creator">
                            {tt('proposals.by')}&nbsp;{linkifyUsername(creator)}
                            {creator != receiver ? (
                                <span>
                                    &nbsp;{tt('proposals.for')}&nbsp;
                                    {linkifyUsername(receiver)}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="proposals__votes">
                    <div onClick={handleVoteClick} title={`${votesToHP} HP`}>
                        {abbreviateNumber(votesToHP)}
                    </div>
                    <a onClick={onVote}>
                        <span className={classUp}>
                            <Icon
                                name={isVoting ? 'empty' : 'chevron-up-circle'}
                                className="upvote"
                            />
                        </span>
                    </a>
                </div>
            </div>
        );
    }
}
//TODO: Move Proposal type to a proptypes file and use where we need it.
Proposal.propTypes = {
    id: PropTypes.number.isRequired,
    creator: PropTypes.string.isRequired,
    receiver: PropTypes.string.isRequired,
    start_date: PropTypes.string.isRequired,
    end_date: PropTypes.string.isRequired,
    daily_pay: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    total_votes: PropTypes.string.isRequired,
    permlink: PropTypes.string.isRequired,
    onVote: PropTypes.func.isRequired,
    isVoting: PropTypes.bool.isRequired,
    isUpVoted: PropTypes.bool.isRequired,
    // passed through connect from global state object to calc vests to sp
    total_vesting_shares: PropTypes.string.isRequired,
    total_vesting_fund_hive: PropTypes.string.isRequired,
};

/**
 * Given a number, return a string with the number formatted as currency
 * @param {number} number - number to format
 * @returns {string} - return a fancy string
 */
function formatCurrency(amount = 0) {
    return numberWithCommas(Number.parseFloat(amount).toFixed(2) + ' HBD');
}

/**
 * Given a number, return a slightly more readable version in the form of an abbreviation.
 * @param {number} number - number to abbreviate
 * @returns {string} - return the abreviated number as a string.
 */
function abbreviateNumber(number) {
    return numAbbr.abbreviate(number, 2);
}

/**
 * Given a start date and an end date return one of [started, finished, not started]
 * @param {Date} start - start date
 * @param {Date} stop - stop date
 * @returns {string} - return fancy string
 */
function startedOrFinished(start, end) {
    const now = Date.now();
    const remainingTimeUntilStart = start - now;
    const remainingTimeUntilFinished = end - now;

    if (remainingTimeUntilFinished <= 0) {
        // Finished
        return `finished`;
    }

    if (remainingTimeUntilStart <= 0) {
        // Started
        return `started`;
    }

    // Not started and not finished
    return `not started`;
}

/**
 * Given a date formate it
 * @param {Date} date - date
 * @returns {string} - return fancy string
 */
function formatDate(date) {
    return Moment(date).format('ll');
}

/**
 * Given a start date and an end date return a sentence decribing whether it has started, stopped, or has yet to begin.
 * @param {Date} start - start date
 * @param {Date} stop - stop date
 * @returns {string} - return fancy string
 */
function startedOrFinishedInWordsLongVersion(start, end) {
    const now = Date.now();
    const remainingTimeUntilStart = start - now;
    const remainingTimeUntilFinished = end - now;

    if (remainingTimeUntilFinished <= 0) {
        // Finished
        return `finished ${durationInWords(remainingTimeUntilFinished)}`;
    }

    if (remainingTimeUntilStart <= 0) {
        // Started
        return `started ${durationInWords(
            remainingTimeUntilStart
        )} ago and finishes ${durationInWords(remainingTimeUntilFinished)}`;
    }

    // Not started and not finished
    return `will start ${durationInWords(remainingTimeUntilStart)}`;
}

/**
 * Given a time, return a friendly phrase escribing the amount of time until then
 * @param {number} timestamp - timestamp to convert
 * @returns {string} - return the time phrase as a string
 */
function timeUntil(timestamp) {
    return timestamp;
}

/**
 * Given a time, return a friendly phrase escribing the total amount of time
 * @param {number} duration - timestamp to convert
 * @returns {string} - return the time phrase as a string
 */
function durationInWords(duration) {
    const now = Date.now();
    const a = Moment(now);
    const b = Moment(now + duration);
    return b.from(a);
}

/**
 * Given a username, return an HTML A tag pointing to that user.
 * @param {string} linkText - linkText
 * @param {string} username - username
 * @returns {string} - return a linkified strong
 */
function linkifyUsername(linkText, username = '') {
    if (username == '') username = linkText;
    return (
        <a href={`${APP_URL}/@${username}`} target="_blank">
            {linkText}
        </a>
    );
}

/**
 * Given a username, and post permlink id return a URL worthy strong.
 * @param {string} username - username
 * @param {string} permlink - permlink id of the linked post
 * @returns {string} - return a URL string
 */
function urlifyPermlink(username, permlink) {
    return `${APP_URL}/@${username}/${permlink}`;
}

/**
 * Given total votes in vests returns value in HP
 * @param {number} total_votes - total votes on a proposal (vests from API)
 * @param {string} total_vesting_shares - vesting shares with vests symbol on end
 * @param {string} total_vesting_fund_hive - total hive vesting fund with liquid symbol on end
 * @returns {number} - return the number converted to HP
 */
function simpleVotesToHp(
    total_votes,
    total_vesting_shares,
    total_vesting_fund_hive
) {
    const total_vests = parseFloat(total_vesting_shares);
    const total_vest_steem = parseFloat(total_vesting_fund_hive || 0);
    return (total_vest_steem * (total_votes / total_vests) * 0.000001).toFixed(
        2
    );
}

export default Proposal;
