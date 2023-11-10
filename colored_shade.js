// ortho connected
const genrelist1 = [
    "Nurikabe",
    "Aqre",
    "Tapa",
];
// diag connected
const genrelist2 = [
    "Heyawake",
    "ekawayeh"
];

function colored_shade() {
    if (genrelist2.some(g => g === GENRENAME)) {
        let instance = new ui.puzzle.board.klass.AreaShadeGraph();
        instance.enabled = true;
        board.infolist.push(instance);
        board.sblkmgr = instance;
        board.sblkmgr.getSideObjByNodeObj = function (c) {
            let bx = c.bx;
            let by = c.by;
            let list = [];
            for (let dx = -2; dx <= 2; dx += 2) {
                for (let dy = -2; dy <= 2; dy += 2) {
                    if (dx !== 0 || dy !== 0) {
                        list.push(board.getc(bx + dx, by + dy));
                    }
                }
            }
            if (list.some(c => c.isnull)) {
                list = list.filter(c => !c.isnull);
                for (let i = board.minbx + 1; i <= board.maxbx - 1; i += 2) {
                    let c = board.getc(i, board.minby + 1);
                    if (list.indexOf(c) === -1) {
                        list.push(c);
                    }
                    c = board.getc(i, board.maxby - 1);
                    if (list.indexOf(c) === -1) {
                        list.push(c);
                    }
                }
                for (let j = board.minby + 1; j <= board.maxby - 1; j += 2) {
                    let c = board.getc(board.minbx + 1, j);
                    if (list.indexOf(c) === -1) {
                        list.push(c);
                    }
                    c = board.getc(board.maxbx - 1, j);
                    if (list.indexOf(c) === -1) {
                        list.push(c);
                    }
                }
            }
            list = list.filter(c => board.sblkmgr.isnodevalid(c));
            return list;
        };
        board.rebuildInfo();
    }
    if (genrelist1.some(g => g === GENRENAME) || genrelist2.some(g => g === GENRENAME)) {
        ui.puzzle.config.list.irowakeblk.val = true;
        ui.puzzle.painter.irowakeblk = true;
        ui.puzzle.board.sblkmgr.coloring = true;
        ui.puzzle.painter.labToRgbStr = (l, a, b) => lab2rgb([l * 2 / 3, a, b]);
        document.querySelector(".config[data-config='irowakeblk']").style = '';
        document.querySelector(".config[data-config='irowakeblk']").getElementsByTagName("input")[0].click();
    }
}

function lab2rgb(lab) {
    let y = (lab[0] + 16) / 116,
        x = lab[1] / 500 + y,
        z = y - lab[2] / 200,
        r, g, b;

    x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
    y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
    z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.2040 + z * 1.0570;

    r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
    g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
    b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1 / 2.4) - 0.055) : 12.92 * b;

    return "rgb(" + [Math.max(0, Math.min(1, r)) * 255,
    Math.max(0, Math.min(1, g)) * 255,
    Math.max(0, Math.min(1, b)) * 255].join(',') + ")";
}