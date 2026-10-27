// 3rd party plugins

export default function init(config) {
    if (config.google_analytics_id) {
        (function (i, s, o, g, r) {
            i.GoogleAnalyticsObject = r;
            i[r] = i[r]
                || function (...args) {
                    (i[r].q = i[r].q || []).push(args);
                };
            i[r].l = 1 * new Date();
            const a = s.createElement(o);
            const m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m);
        }(
            window,
            document,
            'script',
            'https://www.google-analytics.com/analytics.js',
            'ga'
        ));
        window.ga('create', {
            trackingId: config.google_analytics_id,
            cookieDomain: 'auto',
            sampleRate: 5,
        });
    }
}
