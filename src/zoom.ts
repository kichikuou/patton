const $: (selector: string) => HTMLElement = document.querySelector.bind(document);

const canvas = <HTMLCanvasElement>$('#canvas');

let throttled = false;
function onResize() {
    if (throttled)
        return;
    throttled = true;
    window.requestAnimationFrame(() => {
        recalcAspectRatio();
        throttled = false;
    });
}

function recalcAspectRatio() {
    let container = $('.contents');
    let target = $('#np2');
    let containerAspect = container.offsetWidth / container.offsetHeight;
    if (!containerAspect)
        return;
    let canvasAspect = canvas.width / canvas.height;
    if (containerAspect < canvasAspect) {
        target.classList.add('letterbox');
        target.classList.remove('pillarbox');
    } else {
        target.classList.remove('letterbox');
        target.classList.add('pillarbox');
    }
}

// Apply the zoom and pixelate configs of Kichikuou on Web.
export function initialize() {
    const json = localStorage.getItem('KichikuouWeb.Config');
    if (!json) return {};
    const config = json ? JSON.parse(json) : {};

    if (config.pixelate) {
        canvas.classList.add('pixelated');
    }

    if (config.zoom === 'fit') {
        $('#np2').classList.add('fit');
        canvas.style.width = '';
    } else {
        let ratio = Number(config.zoom);
        canvas.style.width = 640 * ratio + 'px';
    }

    window.addEventListener('resize', onResize);
    recalcAspectRatio();
}
