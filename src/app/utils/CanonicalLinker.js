import Apps from '@hiveio/hivescript/apps.json';

// eslint-disable-next-line import/prefer-default-export
export function makeCanonicalLink(d) {
    let canonicalUrl = 'https://hive.blog' + d.link;
    if (
        d.json_metadata
        && d.json_metadata.app
        && typeof d.json_metadata.app !== 'string'
    ) {
        return canonicalUrl;
    }
    const hasAppTemplateData = d.json_metadata
        && d.json_metadata.app
        && d.category
        && d.json_metadata.app.split('/').length === 2;
    if (hasAppTemplateData) {
        const app = d.json_metadata.app.split('/')[0];
        const hasAppData = Apps[app] && Apps[app].url_scheme;
        if (hasAppData) {
            canonicalUrl = Apps[app].url_scheme
                .split('{category}')
                .join(d.category)
                .split('{username}')
                .join(d.author)
                .split('{permlink}')
                .join(d.permlink);
        }
    }
    return canonicalUrl;
}
