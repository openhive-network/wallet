/* global $STM_csrf */

const request_base = {
    method: 'post',
    mode: 'no-cors',
    credentials: 'same-origin',
    headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
    },
};

export function serverApiLogin(account, signatures) {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return;
    const request = {
        ...request_base,
        body: JSON.stringify({ account, signatures, csrf: $STM_csrf }),
    };
    return fetch('/api/v1/login_account', request);
}

export function serverApiLogout() {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return;
    const request = {
        ...request_base,
        body: JSON.stringify({ csrf: $STM_csrf }),
    };
    return fetch('/api/v1/logout_account', request);
}

// Event collection through overseer is disabled until overseer is updated.
export function serverApiRecordEvent() {}

export function saveCords(x, y) {
    const request = {
        ...request_base,
        body: JSON.stringify({ csrf: $STM_csrf, x, y }),
    };
    fetch('/api/v1/save_cords', request);
}

export function setUserPreferences(payload) {
    if (!process.env.BROWSER || window.$STM_ServerBusy) return Promise.resolve();
    const request = {
        ...request_base,
        body: JSON.stringify({ csrf: window.$STM_csrf, payload }),
    };
    return fetch('/api/v1/setUserPreferences', request);
}

// The /isTosAccepted endpoint is down, so every user counts as having accepted.
export function isTosAccepted() {
    return true;
}

export function acceptTos() {
    const request = {
        ...request_base,
        body: JSON.stringify({ csrf: window.$STM_csrf }),
    };
    return fetch('/api/v1/acceptTos', request);
}
