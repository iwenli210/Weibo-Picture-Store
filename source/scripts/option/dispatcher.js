/**
 * Dispatcher
 */
class Dispatcher {

    constructor() {
        this.page = 1;
        this.count = 30;
        this.notifyId = Utils.randomString(16);
        this.main = document.querySelector("#main");
        this.prev = document.querySelector(".foot-navigator > .prev");
        this.next = document.querySelector(".foot-navigator > .next");
        this.pagination = document.querySelector(".foot-navigator .pagination");
        this.fragment = document.createDocumentFragment();
        this.checkout = {albumId: null, pages: null};
        this.searchParams = new URLSearchParams(location.search);
        this.loading = null;
        this.removedKey = "removedPhotoId";
        this.albumInfoKey = "albumInfo";
        this.decorator();
    }

    decorator() {
        this.loadStart();
        this.parsePage();
        this.actuator();
        this.addEvent();
    }

    loadStart() {
        this.loading = document.createElement("div");
        this.loading.dataset.bio = "loading";
        this.main.append(this.loading);
    }

    parsePage() {
        let page = Number(this.searchParams.get("page"));
        let count = Number(this.searchParams.get("count"));
        if (Number.isInteger(page) && page > 0) this.page = page;
        if (Number.isInteger(count) && count > 0) this.count = count;
    }

    createMicroAlbum() {
        let a = document.createElement("a");
        let footMenu = document.querySelector(".foot-menu");
        a.href = `http://photo.weibo.com/albums/detail/album_id/${this.checkout.albumId}/`;
        a.title = chrome.i18n.getMessage("micro_album_hinter");
        a.target = "_blank";
        a.textContent = chrome.i18n.getMessage("micro_album_text");
        footMenu.prepend(a);
    }

    actuator() {
        // 服务器可能返回不准确的分页数据，会导致空白分页
        backWindow.Weibo.getAllPhoto(Utils.session.getItem(this.albumInfoKey), this.page, this.count)
            .then(result => {
                Utils.session.setItem(this.albumInfoKey, {albumId: result.albumId});
                this.checkout.pages = Math.ceil(result.total / this.count);
                this.checkout.albumId = result.albumId;
                this.loading.remove();
                this.repaging();
                this.createMicroAlbum();

                if (!result.list.length) {
                    this.errorInjector(chrome.i18n.getMessage("page_no_data"));
                } else {
                    this.buildItems(result.list);
                }
            }, reason => {
                Utils.session.removeItem(this.albumInfoKey);
                this.loading.remove();
                this.repaging();
                this.errorInjector(chrome.i18n.getMessage("get_photo_fail_message"));
            });
    }

    errorInjector(text) {
        let div = document.createElement("div");
        div.dataset.bio = "throw-message";
        div.textContent = text;
        this.main.append(div);
    }

    addEvent() {
        let prevHandler = e => {
            if (this.checkout.pages && this.page > 1) {
                this.page--;
                this.flipPage();
            }
        };
        let nextHandler = e => {
            if (this.checkout.pages && this.page < this.checkout.pages) {
                this.page++;
                this.flipPage();
            }
        };

        this.prev.addEventListener("click", prevHandler);
        this.next.addEventListener("click", nextHandler);

        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key === "ArrowLeft") {
                e.preventDefault();
                prevHandler(e);
            }
            if (e.ctrlKey && e.key === "ArrowRight") {
                e.preventDefault();
                nextHandler(e);
            }
        });
    }

    flipPage() {
        this.searchParams.set("page", this.page.toString());
        location.search = this.searchParams.toString();
    }

    repaging() {
        if (!this.checkout.pages) {
            this.prev.dataset.disabled = true;
            this.next.dataset.disabled = true;
        } else {
            this.prev.dataset.disabled = this.page <= 1;
            this.next.dataset.disabled = this.page >= this.checkout.pages;
            this.pagination.textContent = `${this.page} / ${this.checkout.pages}`;
        }
    }

    buildItems(items) {
        let removedPhotoId = Utils.session.getItem(this.removedKey);

        for (let item of items) {
            if (item.photoId === removedPhotoId) continue;
            let fragment = Dispatcher.importNode();
            let section = fragment.querySelector("section");
            let linker = section.querySelector(".image-linker");
            let create = section.querySelector(".image-create");
            let remove = section.querySelector(".image-remove");
            let source = linker.querySelector("img");
            let albumId = this.checkout.albumId;
            let photoId = item.photoId;

            source.src = `${item.picHost}/thumb300/${item.picName}`;
            source.srcset = `${item.picHost}/bmiddle/${item.picName} 2x`;
            linker.href = `${item.picHost}/large/${item.picName}`;
            create.textContent = item.created;
            remove.addEventListener("click", e => {
                section.dataset.removeCue = true;
                backWindow.Weibo.removePhoto(albumId, photoId)
                    .then(result => {
                        // 由于服务器缓存的原因，页面数据可能刷新不及时
                        // 可能会出现已删除的数据刷新后还存在的问题
                        // 暂时用 sessionStorage 处理，但是会导致分页数据显示少一个
                        Utils.session.setItem(this.removedKey, photoId);
                        Reflect.deleteProperty(section.dataset, "removeCue");
                        chrome.notifications.clear(this.notifyId, wasCleared => this.flipPage());
                    })
                    .catch(reason => {
                        Reflect.deleteProperty(section.dataset, "removeCue");
                        chrome.notifications.create(this.notifyId, {
                            type: "basic",
                            iconUrl: chrome.i18n.getMessage("64"),
                            title: chrome.i18n.getMessage("info_title"),
                            message: chrome.i18n.getMessage("remove_failed_message"),
                        });
                    });
            });

            this.fragment.append(section);
        }

        this.main.append(this.fragment);
    }

    static importNode() {
        let html = `
            <section>
                <div class="image-body">
                    <a class="image-remove" title="从当前相册中移除这张图片"><i class="fa fa-trash-o"></i></a>
                    <a class="image-linker" title="点击查看原图" target="_blank">
                        <img src="${chrome.i18n.getMessage("image_placeholder")}" alt="preview">
                    </a>
                </div>
                <div class="image-label"><span class="image-create" title="图片的创建时间"></span></div>
            </section>`;
        return Utils.parseHTML(html);
    }

}
