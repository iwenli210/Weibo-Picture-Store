/**
 * Build Item
 */
class BuildItem {

    constructor(data) {
        this.data = data;
        this.duplex = null;
        this.section = null;
        this.objectURL = null;
        this.domNodes = {};
        this.decorator();
    }

    decorator() {
        this.createItem();
        this.buildEvent();
    }

    createItem() {
        let image = new Image();
        let fragment = BuildItem.importNode();

        this.section = fragment.querySelector("section");
        this.domNodes.imageHolder = this.section.querySelector(".image-holder");
        this.domNodes.inputURL = this.section.querySelector(".type-1 input");
        this.domNodes.inputHTML = this.section.querySelector(".type-2 input");
        this.domNodes.inputUBB = this.section.querySelector(".type-3 input");
        this.domNodes.inputMarkdown = this.section.querySelector(".type-4 input");

        if (this.repaint(this.data)) {
            if (this.data.rawFile) {
                this.objectURL = image.src = URL.createObjectURL(this.data.rawFile);
                this.domNodes.imageHolder.append(image);
            }
        }
    }

    buildEvent() {
        this.duplex = new BuildEvent(this.section);
    }

    repaint(item) {
        if (item && item.URL) {
            this.domNodes.inputURL.value = item.URL;
            this.domNodes.inputHTML.value = item.HTML;
            this.domNodes.inputUBB.value = item.UBB;
            this.domNodes.inputMarkdown.value = item.Markdown;
            return true;
        } else {
            return false;
        }
    }

    destroy() {
        this.duplex.destroy();
        this.section.remove();
        this.objectURL && URL.revokeObjectURL(this.objectURL);
    }

    static importNode() {
        let html = `
            <section>
                <div class="holder-wrapper">
                    <div class="image-holder" title="上传图片到微博相册"></div>
                </div>
                <div class="table-wrapper">
                    <table width="100%">
                        <tbody>
                            <tr class="type-1">
                                <td><span class="title">URL</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="Uniform Resource Locator"></td>
                                <td><a class="button-copy" data-type="URL">Copy</a></td>
                            </tr>
                            <tr class="type-2">
                                <td><span class="title">HTML</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="HyperText Markup Language"></td>
                                <td><a class="button-copy" data-type="HTML">Copy</a></td>
                            </tr>
                            <tr class="type-3">
                                <td><span class="title">UBB</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="Ultimate Bulletin Board"></td>
                                <td><a class="button-copy" data-type="UBB">Copy</a></td>
                            </tr>
                            <tr class="type-4">
                                <td><span class="title">Markdown</span></td>
                                <td><input type="text" readonly spellcheck="false" placeholder="Markdown"></td>
                                <td><a class="button-copy" data-type="Markdown">Copy</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>`;
        return Utils.parseHTML(html);
    }

}
