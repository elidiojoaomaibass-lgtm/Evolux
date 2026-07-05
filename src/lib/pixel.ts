export const initFacebookPixel = (pixelId: string) => {
    if (!pixelId) return;

    const w = window as any;
    if (w.fbq && w.fbq.loaded) {
        w.fbq('init', pixelId);
        return;
    }

    w.fbq = function () {
        w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = w.fbq;
    w.fbq.push = w.fbq;
    w.fbq.loaded = true;
    w.fbq.version = '2.0';
    w.fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
    } else {
        document.head.appendChild(script);
    }

    w.fbq('init', pixelId);
};

export const trackFacebookEvent = (eventName: string, data?: any) => {
    const w = window as any;
    if (w.fbq) {
        w.fbq('track', eventName, data);
    }
};
