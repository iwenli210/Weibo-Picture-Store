/**
 * Fetch Blob
 */
{

    const delay = 300;
    const notifyId = Utils.randomString(16);

    Weibo.fetchBlob = url => {
        let fileProgress = Weibo.fileProgress(Weibo.fileProgress.TYPE_DOWNLOAD);

        fileProgress.addNextWave(1);
        let delayRequestId = setTimeout(() => fileProgress.triggerProgress(), delay);

        return Utils.fetch(url, {
            cache: "default",
            credentials: "omit",
        }).then(response => {
            return response.ok ? response.blob() : Promise.reject();
        }).then(result => {
            clearTimeout(delayRequestId);
            fileProgress.accumulator();
            return Promise.resolve(result);
        }).catch(reason => {
            clearTimeout(delayRequestId);
            fileProgress.accumulator();
            chrome.notifications.create(notifyId, {
                type: "basic",
                iconUrl: chrome.i18n.getMessage("64"),
                title: chrome.i18n.getMessage("warn_title"),
                message: chrome.i18n.getMessage("get_file_url_fail"),
            });
            return Promise.reject(reason);
        });
    };

}
