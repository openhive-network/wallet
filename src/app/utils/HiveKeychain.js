import { isLoggedIn, extractLoginData } from 'app/utils/UserUtil';

/**
 *
 * @returns {boolean}
 */
export function hasCompatibleKeychain() {
    return (
        'hive_keychain' in window
        && 'requestSignBuffer' in window.hive_keychain
        && 'requestBroadcast' in window.hive_keychain
        && 'requestSignedCall' in window.hive_keychain
    );
}

export function decodeMemo(encodedText, account, successCallback) {
    window.hive_keychain.requestVerifyKey(
        account,
        encodedText,
        'Memo',
        successCallback
    );
}

/**
 *
 * @returns {boolean}
 */
export function isLoggedInWithKeychain() {
    if (!isLoggedIn()) {
        return false;
    }
    if (!hasCompatibleKeychain()) {
        // possible to log in w/ keychain, then disable plugin
        return false;
    }
    const data = localStorage.getItem('autopost2');
    const [,,,, login_with_keychain] = extractLoginData(data);
    return !!login_with_keychain;
}
