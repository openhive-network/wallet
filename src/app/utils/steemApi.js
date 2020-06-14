import { api } from '@hiveio/hive-js';

import stateCleaner from 'app/redux/stateCleaner';

export async function getStateAsync(url) {
    // strip off query string
    const path = url.split('?')[0];

    const raw = await api.getStateAsync(path);

    const cleansed = stateCleaner(raw);

    return cleansed;
}
