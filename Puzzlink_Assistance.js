// ==UserScript==
// @name         Puzz.link Assistance
// @version      24.1.29.1
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @match        http://pzv.jp/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=puzz.link
// @grant        none
// @namespace    https://greasyfork.org/users/1192854
// @license      GPL
// ==/UserScript==

'use strict';

const MAXLOOP = 30;
const MAXDFSCELLNUM = 200;
let flg = true;
let step = false;
let board;
let GENRENAME;
// used for showing pattern
// ×·█━┃┓┛┗┏╺╹╸╻●○

// const list
const CQNUM = {
    quesmark: -2,
    circle: -2, // no number
    black: -2,
    none: -1,
    wcir: 1,
    bcir: 2,
    // Moon or Sun
    sun: 1,
    moon: 2,
};
const CANUM = {
    none: -1,
    // Masyu
    wcir: 1,
    bcir: 2,
};
const CQANS = {
    none: 0,
    black: 1,
    // Light and Shadow
    white: 2,
    // Starbattle
    star: 1,
    // Akari
    light: 1,
    // Shakashaka triangle
    triBL: 2,
    triBR: 3,
    triTR: 4,
    triTL: 5,
    // Slant
    rslash: 31,
    lslash: 32,
};
const CQUES = {
    none: 0,
    // Castle Wall
    gray: 0,
    white: 1,
    black: 2,
    // Icebarn
    ice: 6,
    // Simpleloop
    bwall: 7,
    // Slalom
    vgate: 21,
    hgate: 22,
    // Nurimaze
    cir: 41,
    tri: 42,
};
const CQSUB = {
    none: 0,
    dot: 1,
    green: 1,
    // Slitherlink
    yellow: 2,
    // All or Nothing
    gray: 1,
    // Moon or Sun
    cross: 2,
};
const QDIR = {
    none: 0,
    // arrow
    up: 1,
    dn: 2,
    lt: 3,
    rt: 4,
};
const BQSUB = {
    none: 0,
    link: 1,
    cross: 2,
    // Icebarn
    arrow_up: 11,
    arrow_dn: 12,
    arrow_lt: 13,
    arrow_rt: 14,
};

const GENRELIST = [
    ["Akari", AkariAssist],
    ["All or Nothing", AllorNothingAssist],
    ["Aqre", AqreAssist],
    ["Aquapelago", AquapelagoAssist],
    ["Ayeheya", AyeheyaAssist],
    ["Canal View", CanalViewAssist],
    ["Castle Wall", CastleWallAssist],
    ["Cave", CaveAssist],
    ["Choco Banana", ChocoBananaAssist],
    ["Circles and Squares", CirclesAndSquaresAssist],
    ["Creek", CreekAssist],
    ["Guide Arrow", GuideArrowAssist],
    ["Heyawake", HeyawakeAssist],
    ["Hitori", HitoriAssist],
    ["Icebarn", IcebarnAssist],
    ["Inverse LITSO", InverseLitsoAssist],
    ["Koburin", KoburinAssist],
    ["Kurodoko", KurodokoAssist],
    ["Light and Shadow", LightandShadowAssist],
    ["LITS", LitsAssist],
    ["Masyu", MasyuAssist],
    ["Moon or Sun", MoonOrSunAssist],
    ["Nonogram", NonogramAssist],
    ["Norinori", NorinoriAssist],
    ["Norinuri", NorinuriAssist],
    ["No Three", NothreeAssist],
    ["Nuribou", NuribouAssist],
    ["Nurikabe", NurikabeAssist],
    ["Nuri-Maze", NuriMazeAssist],
    ["Nurimisaki", NurimisakiAssist],
    ["Pencils", PencilsAssist],
    ["Pipelink", PipelinkAssist],
    ["Ring-ring", RingringAssist],
    ["Shakashaka", ShakashakaAssist],
    ["Shikaku", ShikakuAssist],
    ["Simple Loop", SimpleloopAssist],
    ["Slalom", SlalomAssist],
    ["Slant", SlantAssist],
    ["Slitherlink", SlitherlinkAssist],
    ["Square Jam", SquareJamAssist],
    ["Star Battle", StarbattleAssist],
    ["Sudoku", SudokuAssist],
    ["Tapa", TapaAssist],
    ["Tasquare", TasquareAssist],
    ["Tatamibari", TatamibariAssist],
    ["Tentaisho", TentaishoAssist],
    ["Yajilin", YajilinAssist],
    ["Yin-Yang", YinyangAssist],
];

// main entrance
ui.puzzle.on('ready', function () {
    if (document.querySelector("#assist") !== null) { return; }
    console.log("Assistance running...");
    GENRENAME = ui.puzzle.info.en;
    console.log(`Puzzle Genre Name: ${GENRENAME}`);
    let btnName = "Assist";
    let btn2Name = "Assist Step";
    if (!GENRELIST.some(g => g[0] === GENRENAME)) {
        console.log("Automatically generated assistant.");
        btnName += "(AG)";
        btn2Name += "(AG)";
    }
    let btn = `<button type="button" class="btn" id="assist" style="display: inline;">${btnName}</button>`;
    let btn2 = `<button type="button" class="btn" id="assiststep" style="display: inline;">${btn2Name}</button>`;
    document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
    document.querySelector("#assist").insertAdjacentHTML('afterend', btn2);
    document.querySelector("#assist").addEventListener("click", assist, false);
    document.querySelector("#assiststep").addEventListener("click", assiststep, false);
    window.addEventListener("keypress", (event) => {
        if (event.key === 'q' || (event.key === 'Q')) { assist(); }
        if (event.key === 'w' || (event.key === 'W')) { assiststep(); }
    });
    window.parent.postMessage("Ready to Assist", "*");
}, false);
// for postMessage
window.addEventListener(
    "message",
    (event) => {
        if (event.data === "assist") {
            assist();
        }
    },
    false,
);
function assiststep() {
    step = true;
    assist();
    step = false;
}
function assist() {
    flg = true;
    board = ui.puzzle.board;
    for (let loop = 0; loop < (step ? 1 : MAXLOOP); loop++) {
        if (!flg) { break; }
        flg = false;
        if (GENRELIST.some(g => g[0] === GENRENAME)) {
            GENRELIST.find(g => g[0] === GENRENAME)[1]();
        } else { GeneralAssist(); }
    }
    ui.puzzle.redraw();
    console.log('Assisted.');
    window.parent.postMessage(ui.puzzle.check().complete ? "Solved" : "Not Solved", "*");
}

let isBlack = c => !c.isnull && c.qans === CQANS.black;
let isGreen = c => !c.isnull && c.qsub === CQSUB.green;
// set val
let offset = function (c, dx, dy, dir = 0) {
    dir = (dir % 4 + 4) % 4;
    if (dir === 0) { return board.getobj(c.bx + dx * 2, c.by + dy * 2); }
    if (dir === 1) { return board.getobj(c.bx + dy * 2, c.by - dx * 2); }
    if (dir === 2) { return board.getobj(c.bx - dx * 2, c.by - dy * 2); }
    if (dir === 3) { return board.getobj(c.bx - dy * 2, c.by + dx * 2); }
}
let adjlist = function (a, b = undefined) {
    if (b === undefined) {
        return [a.top, a.left, a.bottom, a.right];
    }
    return [[a.top, b.top], [a.left, b.left], [a.bottom, b.bottom], [a.right, b.right]];
}
let fourside = function (f, a, b = undefined) {
    if (b === undefined) {
        f(a.top);
        f(a.left);
        f(a.bottom);
        f(a.right);
    } else {
        f(a.top, b.top);
        f(a.left, b.left);
        f(a.bottom, b.bottom);
        f(a.right, b.right);
    }
};
let dir = function (c, d) {
    d = (d % 4 + 4) % 4;
    if (d === 0) return c.top;
    if (d === 1) return c.left;
    if (d === 2) return c.bottom;
    if (d === 3) return c.right;
}
let qdirremap = function (qdir) {
    return [-1, 0, 2, 1, 3][qdir];
}

let add_link = function (b) {
    if (b === undefined || b.isnull || b.line || b.qans || b.qsub !== BQSUB.none) { return; }
    if (step && flg) { return; }
    b.setQsub(BQSUB.link);
    b.draw();
    flg |= b.qsub === BQSUB.link;
};
let add_cross = function (b) {
    if (b === undefined || b.isnull || b.line || b.qsub !== BQSUB.none) { return; }
    if (step && flg) { return; }
    b.setQsub(BQSUB.cross);
    b.draw();
    flg |= b.qsub === BQSUB.cross;
};
let add_line = function (b) {
    if (b === undefined || b.isnull || b.line || b.qsub === BQSUB.cross) { return; }
    if (step && flg) { return; }
    b.setLine(1);
    b.draw();
    flg |= b.line;
};
let add_side = function (b) {
    if (b === undefined || b.isnull || b.qans || b.qsub === BQSUB.link) { return; }
    if (step && flg) { return; }
    b.setQans(1);
    b.draw();
    flg |= b.qans;
};
let add_arrow = function (b, dir) {
    if (b === undefined || b.isnull || b.qsub !== BQSUB.none) { return; }
    if (step && flg) { return; }
    flg = true;
    b.setQsub(dir);
    b.draw();
};
let add_black = function (c, notOnNum = false) {
    if (notOnNum && (c.qnum !== CQNUM.none || c.qnums.length > 0)) { return; }
    if (c === undefined || c.isnull || c.lcnt !== 0 || c.qsub === CQSUB.dot || c.qans !== CQANS.none) { return; }
    if (step && flg) { return; }
    flg = true;
    c.setQans(CQANS.black);
    c.draw();
};
let add_dot = function (c) {
    if (c === undefined || c.isnull || c.qnum !== CQNUM.none || c.qnums.length > 0 || c.qans !== CQANS.none || c.qsub !== CQSUB.none) { return; }
    if (step && flg) { return; }
    flg = true;
    c.setQsub(CQSUB.dot);
    c.draw();
};
let add_green = function (c) {
    if (c === undefined || c.isnull || c.qans !== CQANS.none || c.qsub !== CQSUB.none) { return; }
    if (step && flg) { return; }
    flg = true;
    c.setQsub(CQSUB.green);
    c.draw();
};

// single rule deduction
function No2x2Cell({ isShaded, add_unshaded } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
        if (templist.some(c => c.isnull)) { continue; }
        templist = templist.filter(c => !isShaded(c));
        if (templist.length === 1) {
            add_unshaded(templist[0]);
        }
    }
}
function No2x2Black() {
    No2x2Cell({
        isShaded: isBlack,
        add_unshaded: add_green,
    });
}
function No2x2Green() {
    No2x2Cell({
        isShaded: isGreen,
        add_unshaded: add_black,
    });
}
function CellConnected({ isShaded, isUnshaded, add_shaded, add_unshaded,
    isLinked = (c, nb, nc) => isShaded(c) && isShaded(nc),
    isNotPassable = (c, nb, nc) => false,
    cantDivideShade = n => n > 0,
    OutsideAsShaded = false,
    OnlyOneConnected = true } = {}) {
    // use tarjan to find cut vertex
    let n = 0;
    let ord = new Map();
    let low = new Map();
    let shdn = new Map();
    let fth = new Map();
    let shadelist = [];
    // to avoid Maximum call stack size exceeded, manually use a stack to track the cells
    let dfs = function (sc) {
        let stack = [{ cell: sc, father: null, visited: false }];
        while (stack.length > 0) {
            let cur = stack[stack.length - 1];
            let c = cur.cell;
            let f = cur.father;
            let v = cur.visited;
            if (!v) {
                if (!c.isnull && isUnshaded(c) || ord.has(c)) { stack.pop(); continue; }
                if (c.isnull && !OutsideAsShaded) { stack.pop(); continue; }
                ord.set(c, n);
                low.set(n, n);
                shdn.set(n, 0);
                fth.set(c, f);
                n++;
                stack[stack.length - 1] = { cell: c, father: f, visited: true };
            } else {
                stack.pop();
            }
            if (!c.isnull) {
                const cellset = new Set();
                let linkdfs = function (c) {
                    if (c.isnull || cellset.has(c) || isUnshaded(c)) { return; }
                    cellset.add(c);
                    fourside((nb, nc) => {
                        if (isLinked(c, nb, nc)) {
                            linkdfs(nc);
                        }
                    }, c.adjborder, c.adjacent);
                }
                linkdfs(c);
                if (!v) {
                    cellset.forEach(cl => {
                        ord.set(cl, ord.get(c));
                        shdn.set(ord.get(cl), shdn.get(ord.get(cl)) + isShaded(cl));
                        fth.set(cl, f);
                    });
                }
                let fn = function (nc, nb) {
                    if (isNotPassable(c, nb, nc)) { return; }
                    if (nc === f || f !== null && ord.get(f) === ord.get(nc) || isUnshaded(nc)) { return; }
                    if (nc.isnull && !OutsideAsShaded) { return; }
                    if (ord.get(c) === ord.get(nc)) { return; }
                    if (ord.has(nc) && ord.get(nc) < ord.get(c)) {
                        low.set(ord.get(c), Math.min(low.get(ord.get(c)), ord.get(nc)));
                        return;
                    }
                    if (!v) {
                        stack.push({ cell: nc, father: c, visited: false });
                    }
                    if (v && c === fth.get(nc)) {
                        let ordc = ord.get(c);
                        let ordnc = ord.get(nc);
                        low.set(ordc, Math.min(low.get(ordc), low.get(ordnc)));
                        shdn.set(ordc, shdn.get(ordc) + shdn.get(ordnc));
                        if (ordc <= low.get(ordnc) && cantDivideShade(shdn.get(ordnc))) {
                            cellset.forEach(c => shadelist.push(c));
                        }
                    }
                };
                for (let c of cellset) {
                    fourside(fn, c.adjacent, c.adjborder);
                };
            }
            if (!v && c.isnull) {
                for (let i = 0; i < board.cols; i++) {
                    stack.push({ cell: board.getc(2 * i + 1, board.minby + 1), father: c, visited: false });
                    stack.push({ cell: board.getc(2 * i + 1, board.maxby - 1), father: c, visited: false });
                }
                for (let i = 0; i < board.rows; i++) {
                    stack.push({ cell: board.getc(board.minbx + 1, 2 * i + 1), father: c, visited: false });
                    stack.push({ cell: board.getc(board.maxbx - 1, 2 * i + 1), father: c, visited: false });
                }
            }
        }
    }
    if (OutsideAsShaded) {
        dfs(board.getc(0, 0));
    } else {
        for (let i = 0; i < board.cell.length; i++) {
            if (!isShaded(board.cell[i]) || ord.has(board.cell[i])) { continue; }
            dfs(board.cell[i]);
        }
    }
    shadelist.forEach(c => add_shaded(c));
    if (ord.size > 0 && OnlyOneConnected) {
        for (let i = 0; i < board.cell.length; i++) {
            if (ord.has(board.cell[i]) || isShaded(board.cell[i]) || isUnshaded(board.cell[i])) { continue; }
            add_unshaded(board.cell[i]);
        }
    }
}
function GreenConnected() {
    CellConnected({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
    });
}
function BlackConnected() {
    CellConnected({
        isShaded: isBlack,
        isUnshaded: isGreen,
        add_shaded: add_black,
        add_unshaded: add_green,
    });
}
function BlackConnected_InRegion() {
    CellConnected({
        isShaded: isBlack,
        isUnshaded: isGreen,
        add_shaded: add_black,
        add_unshaded: add_green,
        isNotPassable: (c, nb, nc) => nb.ques,
        OnlyOneConnected: false,
    });
}
function CellNoLoop({ isShaded, isUnshaded, add_unshaded } = {}) {
    let ord = new Map();
    let n = 0;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (!isShaded(cell) || ord.has(cell)) { continue; }
        let dfs = function (c) {
            if (c.isnull || !isShaded(c) || ord.has(c)) { return; }
            ord.set(c, n);
            fourside(dfs, c.adjacent);
        }
        dfs(cell);
        n++;
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (isShaded(cell) || isUnshaded(cell)) { continue; }
        let templist = [offset(cell, -1, 0), offset(cell, 0, -1), offset(cell, 0, 1), offset(cell, 1, 0)];
        templist = templist.filter(c => !c.isnull && isShaded(c));
        templist = templist.map(c => ord.get(c));
        for (let i = 0; i < templist.length; i++) {
            for (let j = i + 1; j < templist.length; j++) {
                if (templist[i] === templist[j]) {
                    add_unshaded(cell);
                }
            }
        }
    }
}
function GreenNoLoopInCell() {
    CellNoLoop({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_unshaded: add_black,
    });
}
function BlackNotAdjacent() {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qans !== CQANS.black) { continue; }
        fourside(add_green, cell.adjacent);
    }
}
function SingleLoopInCell({ isPassable = c => true, isPathable = b => b.qsub !== BQSUB.cross,
    isPass = c => c.qsub === CQSUB.dot, isPath = b => b.line,
    add_notpass = c => { }, add_pass = c => { }, add_notpath = add_cross, add_path = add_line } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (!isPassable(cell)) {
            add_notpass(cell);
            fourside(add_notpath, cell.adjborder);
        }
        let emptycnt = 0;
        let linecnt = 0;
        let adjcell = cell.adjacent;
        let adjline = cell.adjborder;
        fourside((c, b) => {
            if (!isPassable(c) || !isPathable(b)) {
                add_notpath(b);
            }
            if (!c.isnull && isPassable(c) && isPathable(b)) { emptycnt++; }
            linecnt += isPath(b);
        }, adjcell, adjline);
        if (linecnt > 0) {
            add_pass(cell);
        }
        // no branch and no cross
        if (linecnt === 2 && cell.ques !== CQUES.ice) {
            fourside(add_notpath, adjline);
        }
        // no deadend
        if (emptycnt <= 1) {
            fourside(add_notpath, adjline);
            add_notpass(cell);
        }
        // 2 degree path
        if (emptycnt === 2 && (linecnt === 1 || isPass(cell))) {
            fourside(add_path, adjline);
        }
        // avoid forming multiple loop
        if (cell.path !== null && cell.ques !== CQUES.ice) {
            for (let d = 0; d < 4; d++) {
                let ncell = dir(adjcell, d);
                if (cell.path === ncell.path && ncell.ques !== CQUES.ice && board.linegraph.components.length > 1) {
                    add_notpath(dir(adjline, d));
                }
            }
        }
        // ┏╸     ┏╸ 
        // ┃·  -> ┃╺━
        // ┗╸     ┗╸ 
        if (cell.lcnt === 0 && isPass(cell)) {
            let list = [];
            fourside((c, b) => {
                if (isPathable(b)) { list.push([c, b]); }
            }, adjcell, adjline);
            if (list.length === 3) {
                let fn = function (a, b, c) {
                    if (a[0].path !== null && a[0].path === b[0].path && board.linegraph.components.length > 1) {
                        add_path(c[1]);
                    }
                }
                fn(list[0], list[1], list[2]);
                fn(list[1], list[2], list[0]);
                fn(list[2], list[0], list[1]);
            }
        }
    }
}
function NoCheckerCell({ isShaded, isUnshaded, add_shaded, add_unshaded } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (isShaded(cell) || isUnshaded(cell)) { continue; }
        let fn = function (c, c1, c2, c12) {
            if (isShaded(c1) && isShaded(c2) && isUnshaded(c12)) {
                add_shaded(c);
            }
            if (isUnshaded(c1) && isUnshaded(c2) && isShaded(c12)) {
                add_unshaded(c);
            }
        };
        for (let d = 0; d < 4; d++) {
            fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
        }
    }
}
function SightNumber({ isShaded, isUnshaded, add_shaded, add_unshaded } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let qnum = cell.qnum;
        if (qnum === CQNUM.none || qnum === CQNUM.quesmark) { continue; }
        let seencnt = (isShaded(cell) ? 1 : 0);
        let farthest = [0, 0, 0, 0];
        // count seen shaded cells
        for (let d = 0; d < 4; d++) {
            let pcell = dir(cell.adjacent, d);
            while (!pcell.isnull && isShaded(pcell)) {
                farthest[d]++;
                seencnt++;
                pcell = dir(pcell.adjacent, d);
            }
            while (!pcell.isnull && !isUnshaded(pcell)) {
                farthest[d]++;
                pcell = dir(pcell.adjacent, d);
            }
        }
        // not extend too much
        for (let d = 0; d < 4; d++) {
            let pcell = dir(cell.adjacent, d);
            while (!pcell.isnull && isShaded(pcell)) {
                pcell = dir(pcell.adjacent, d);
            }
            if (pcell.isnull || isUnshaded(pcell)) { continue; }
            let tcell = pcell;
            pcell = dir(pcell.adjacent, d);
            let n = 0;
            while (!pcell.isnull && isShaded(pcell)) {
                n++;
                pcell = dir(pcell.adjacent, d);
            }
            if (n + seencnt + 1 > qnum) {
                add_unshaded(tcell);
            }
        }
        // must extend this way
        let maxn = farthest.reduce((a, b) => a + b) + (isUnshaded(cell) ? 0 : 1);
        for (let d = 0; d < 4; d++) {
            for (let j = 1; j <= qnum - maxn + farthest[d]; j++) {
                add_shaded(offset(cell, 0, -j, d));
            }
        }
    }
}
function SizeRegion_Cell({ isShaded, isUnshaded, add_shaded, add_unshaded, OneNumPerRegion = true, NoUnshadedNum = true } = {}) {
    // maybe rewrite this someday
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        // don't block region exit
        let templist = [offset(cell, -1, -1), offset(cell, -1, 0), offset(cell, -1, 1), offset(cell, 0, -1),
        offset(cell, 0, 1), offset(cell, 1, -1), offset(cell, 1, 0), offset(cell, 1, 1)];
        if (!isShaded(cell) && !isUnshaded(cell) && templist.filter(c => isUnshaded(c) || c.isnull).length >= 2) {
            for (let d = 0; d < 4; d++) {
                let ncell = dir(cell.adjacent, d);
                if (isUnshaded(ncell)) { continue; }
                let cellList = [];
                let dfs = function (c) {
                    if (cellList.length > MAXDFSCELLNUM) { return; }
                    if (c.isnull || isUnshaded(c) || c === cell || cellList.includes(c)) { return; }
                    cellList.push(c);
                    fourside(dfs, c.adjacent);
                }
                dfs(ncell);
                if (cellList.length > MAXDFSCELLNUM) { continue; }
                let templist = cellList.filter(c => c.qnum !== CQNUM.none && (NoUnshadedNum || isShaded(c)));
                // extend region without num
                if (templist.length === 0 && cellList.some(c => isShaded(c)) && OneNumPerRegion) {
                    add_shaded(cell);
                }
                // extend region with less cells
                if (templist.length >= 1 && templist[0].qnum !== CQNUM.quesmark && templist[0].qnum > cellList.length) {
                    add_shaded(cell);
                }
            }
        }
        // finished region
        if (cell.qnum > 0 && isShaded(cell)) {
            let cellList = [];
            let dfs = function (c) {
                if (cellList.length > cell.qnum) { return; }
                if (c.isnull || !isShaded(c) || cellList.includes(c)) { return; }
                cellList.push(c);
                fourside(dfs, c.adjacent);
            }
            dfs(cell);
            if (cellList.length === cell.qnum) {
                cellList.forEach(c => fourside(add_unshaded, c.adjacent));
            }
        }
        // finished surrounded region
        if (cell.qnum > 0 && (NoUnshadedNum || isShaded(cell))) {
            let cellList = [];
            let dfs = function (c) {
                if (cellList.length > cell.qnum) { return; }
                if (c.isnull || isUnshaded(c) || cellList.includes(c)) { return; }
                cellList.push(c);
                fourside(dfs, c.adjacent);
            }
            dfs(cell);
            if (cell.qnum !== CQNUM.quesmark && cell.qnum === cellList.length) {
                cellList.forEach(c => add_shaded(c));
            }
        }
        // not connect two region
        for (let d1 = 0; d1 < 4; d1++) {
            for (let d2 = d1 + 1; d2 < 4; d2++) {
                if (isShaded(cell) || isUnshaded(cell)) { continue; }
                let cell1 = dir(cell.adjacent, d1);
                let cell2 = dir(cell.adjacent, d2);
                if (cell1.isnull || cell2.isnull || !isShaded(cell1) || !isShaded(cell2)) { continue; }
                let cellList1 = [];
                let cellList2 = [];
                let dfs = function (c, list) {
                    if (c.isnull || !isShaded(c) || list.includes(c)) { return; }
                    list.push(c);
                    dfs(c.adjacent.top, list);
                    dfs(c.adjacent.bottom, list);
                    dfs(c.adjacent.left, list);
                    dfs(c.adjacent.right, list);
                }
                dfs(cell1, cellList1);
                dfs(cell2, cellList2);
                if (cellList1.includes(cell2)) { continue; }
                let templist1 = cellList1.filter(c => c.qnum !== CQNUM.none);
                let templist2 = cellList2.filter(c => c.qnum !== CQNUM.none);
                if (templist1.length >= 1 && templist2.length >= 1) {
                    if (templist1[0].qnum !== CQNUM.quesmark && templist2[0].qnum !== CQNUM.quesmark && templist1[0].qnum !== templist2[0].qnum || OneNumPerRegion) {
                        add_unshaded(cell);
                    }
                }
                if (templist1.length + templist2.length >= 1) {
                    let qnum = (templist1.length >= 1 ? templist1[0] : templist2[0]).qnum;
                    if (qnum !== CQNUM.quesmark && cellList1.length + cellList2.length + 1 > qnum) {
                        add_unshaded(cell);
                    }
                }
                if (cell.qnum >= 0 && cellList1.length + cellList2.length + 1 > cell.qnum) {
                    add_unshaded(cell);
                }
            }
        }
        // cell and region
        for (let d = 0; d < 4; d++) {
            if (isShaded(cell) || isUnshaded(cell) || cell.qnum === CQNUM.none) { continue; }
            let ncell = dir(cell.adjacent, d);
            if (ncell.isnull || !isShaded(ncell)) { continue; }
            let cellList = [];
            let dfs = function (c) {
                if (c.isnull || !isShaded(c) || cellList.includes(c)) { return; }
                cellList.push(c);
                fourside(dfs, c.adjacent);
            }
            dfs(ncell, cellList);
            let templist = cellList.filter(c => c.qnum !== CQNUM.none);
            if (templist.length >= 1 && (templist[0].qnum !== CQNUM.quesmark && cell.qnum !== CQNUM.quesmark && templist[0].qnum !== cell.qnum || OneNumPerRegion)) {
                add_unshaded(cell);
            }
            if (cell.qnum !== CQNUM.quesmark && cellList.length + 1 > cell.qnum) {
                add_unshaded(cell);
            }
        }
    }
}
function StripRegion_cell({ isShaded, add_unshaded } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
        if (templist.some(c => c.isnull)) { continue; }
        // can't be over 2 shades in each 2*2
        if (templist.filter(c => isShaded(c)).length === 2) {
            templist.forEach(c => add_unshaded(c));
        }
    }
}
function RectRegion_Cell({ isShaded, isUnshaded, add_shaded, add_unshaded, isSquare = false } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (isShaded(cell) || isUnshaded(cell)) { continue; }
        // can't be exactly 3 shades in each 2*2
        let fn = function (list) {
            if (list.some(c => c.isnull)) { return; }
            if (list.filter(c => isShaded(c)).length === 2 && list.filter(c => isUnshaded(c)).length === 1) {
                add_unshaded(cell);
            }
            if (list.filter(c => isShaded(c)).length === 3 && list.filter(c => isUnshaded(c)).length === 0) {
                add_shaded(cell);
            }
        };
        for (let d = 0; d < 4; d++) {
            fn([offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d)]);
        }
    }
    if (!isSquare) { return; }
    let shadelist = [];
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (!isShaded(cell)) { continue; }
        //  █  ->  █ 
        // · ·    ···
        for (let d = 0; d < 4; d++) {
            if ([offset(cell, -1, 1, d), offset(cell, 1, 1, d)].every(c => c.isnull || isUnshaded(c))) {
                add_unshaded(offset(cell, 0, 1, d));
            }
        }
        if ((c => !c.isnull && isShaded(c))(offset(cell, 0, -1))) { continue; }
        if ((c => !c.isnull && isShaded(c))(offset(cell, -1, 0))) { continue; }
        let height = 1, width = 1;
        while ((c => !c.isnull && isShaded(c))(offset(cell, 0, height - 1))) { height++; }
        while ((c => !c.isnull && isShaded(c))(offset(cell, width - 1, 0))) { width++; }
        height--;
        width--;
        // finished square
        if (width === height) {
            // 123
            // 0 4
            // 765
            let list = [offset(cell, -1, 0), offset(cell, -1, -1),
            offset(cell, 0, -1), offset(cell, width, -1),
            offset(cell, width, 0), offset(cell, width, height),
            offset(cell, 0, height), offset(cell, -1, height)];
            let list2 = [[0, 4], [2, 6], [0, 2, 5], [1, 3, 6], [2, 4, 7], [3, 5, 0], [4, 6, 1], [5, 7, 2], [6, 0, 3], [7, 1, 4], [1, 3, 5, 7]];
            if (list2.some(arr => arr.every(n => list[n].isnull || isUnshaded(list[n])))) {
                [0, 2, 4, 6].forEach(n => add_unshaded(list[n]));
            }
        }
        // extend square
        if (height > width) {
            for (let j = 0; j < height; j++) {
                let c = offset(cell, 0, j);
                let l = 0, r = 0;
                while ((c => !c.isnull && !isUnshaded(c))(offset(c, l, 0)) && l > width - height - 1) { l--; }
                while ((c => !c.isnull && !isUnshaded(c))(offset(c, r, 0)) && r < height) { r++; }
                for (let k = r - height; k <= l + height; k++) {
                    shadelist.push(offset(c, k, 0));
                }
            }
        }
        if (height < width) {
            for (let j = 0; j < width; j++) {
                let c = offset(cell, j, 0);
                let l = 0, r = 0;
                while ((c => !c.isnull && !isUnshaded(c))(offset(c, 0, l)) && l > height - width - 1) { l--; }
                while ((c => !c.isnull && !isUnshaded(c))(offset(c, 0, r)) && r < width) { r++; }
                for (let k = r - width; k <= l + width; k++) {
                    shadelist.push(offset(c, 0, k));
                }
            }
        }
    }
    shadelist.forEach(c => add_shaded(c));
}
function RectRegion_Border({ doTrial = true, isSizeAble = (w, h, sc, c) => true } = {}) {
    let isLink = b => !b.isnull && b.qsub === BQSUB.link;
    let isSide = b => b.isnull || b.qans;
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        for (let d = 0; d < 4; d++) {
            //  ×      × 
            // ×·  -> ×·×
            //         × 
            let b1 = dir(cross.adjborder, d);
            let b2 = dir(cross.adjborder, d + 1);
            if (isLink(b1) && isLink(b2)) {
                add_link(dir(cross.adjborder, d + 2));
                add_link(dir(cross.adjborder, d + 3));
            }
            //  ┃      ┃ 
            // ×╹  -> ×┃ 
            //         ┃ 
            if (isSide(b1) && isLink(b2)) {
                add_side(dir(cross.adjborder, d + 2));
            }
            //  ×      × 
            // ━╸  -> ━━━
            //           
            if (isLink(b1) && isSide(b2)) {
                add_side(dir(cross.adjborder, d + 3));
            }
            //  ┃      ┃ 
            //  ╹  -> ━┻━
            //  ×      × 
            b2 = dir(cross.adjborder, d + 2);
            if (isSide(b1) && isLink(b2)) {
                add_side(dir(cross.adjborder, d + 1));
                add_side(dir(cross.adjborder, d + 3));
            }
        }
    }
    if (!doTrial) { return; }
    // record the sides count in (0,0) to (a,b); s1 for horizontal side, s2 for vertical side
    const s1 = Array.from(new Array(board.rows), () => new Array(board.cols).fill(0));
    const s2 = Array.from(new Array(board.rows), () => new Array(board.cols).fill(0));
    // record the links count in a row; l1 for vertical link, l2 for horizontal link
    const l1 = Array.from(new Array(board.rows), () => new Array(board.cols).fill(0));
    const l2 = Array.from(new Array(board.rows), () => new Array(board.cols).fill(0));
    for (let i = 0; i < board.rows; i++) {
        for (let j = 0; j < board.cols; j++) {
            s1[i][j] = (b => !b.isnull && b.qans ? 1 : 0)(board.getb(2 * j + 1, 2 * i));
            s2[i][j] = (b => !b.isnull && b.qans ? 1 : 0)(board.getb(2 * j, 2 * i + 1));
            s1[i][j] += (i > 0 ? s1[i - 1][j] : 0) + (j > 0 ? s1[i][j - 1] : 0) - (i > 0 && j > 0 ? s1[i - 1][j - 1] : 0);
            s2[i][j] += (i > 0 ? s2[i - 1][j] : 0) + (j > 0 ? s2[i][j - 1] : 0) - (i > 0 && j > 0 ? s2[i - 1][j - 1] : 0);
            l1[i][j] = (b => !b.isnull && b.qsub === BQSUB.link ? 1 : 0)(board.getb(2 * j + 1, 2 * i));
            l2[i][j] = (b => !b.isnull && b.qsub === BQSUB.link ? 1 : 0)(board.getb(2 * j, 2 * i + 1));
            l1[i][j] += (j > 0 ? l1[i][j - 1] : 0);
            l2[i][j] += (i > 0 ? l2[i - 1][j] : 0);
        }
    }
    // check if there can be a rectangle exactly between c1 and c2
    let isRectAble = function (c1, c2) {
        if (c1.isnull || c2.isnull) { return 0; }
        let [x1, x2] = [(c1.bx - 1) / 2, (c2.bx - 1) / 2].sort((x, y) => x - y);
        let [y1, y2] = [(c1.by - 1) / 2, (c2.by - 1) / 2].sort((x, y) => x - y);
        let f1 = (a, b) => a < 0 || b < 0 ? 0 : s1[a][b];
        let f2 = (a, b) => a < 0 || b < 0 ? 0 : s2[a][b];
        return f1(y2, x2) - f1(y1, x2) - f1(y2, x1 - 1) + f1(y1, x1 - 1)
            + f2(y2, x2) - f2(y1 - 1, x2) - f2(y2, x1) + f2(y1 - 1, x1) === 0;
    }
    let isRectAble2 = function (c1, c2, dir = ['L', 'U', 'R', 'D']) {
        if (c1.isnull || c2.isnull) { return 0; }
        let [x1, x2] = [(c1.bx - 1) / 2, (c2.bx - 1) / 2].sort((x, y) => x - y);
        let [y1, y2] = [(c1.by - 1) / 2, (c2.by - 1) / 2].sort((x, y) => x - y);
        let g1 = (a, b) => a < 0 || b < 0 || a >= board.rows || b >= board.cols ? 0 : l1[a][b];
        let g2 = (a, b) => a < 0 || b < 0 || a >= board.rows || b >= board.cols ? 0 : l2[a][b];
        if (dir.includes('L') && g2(y2, x1) - g2(y1 - 1, x1) !== 0) { return false; }
        if (dir.includes('U') && g1(y1, x2) - g1(y1, x1 - 1) !== 0) { return false; }
        if (dir.includes('R') && g2(y2, x2 + 1) - g2(y1 - 1, x2 + 1) !== 0) { return false; }
        if (dir.includes('D') && g1(y2 + 1, x2) - g1(y2 + 1, x1 - 1) !== 0) { return false; }
        return true;
    }
    let emptycnt = 0;
    ForEachCell(c => { if (adjlist(c.adjborder).every(b => b.isnull || b.qsub !== BQSUB.link)) emptycnt++; });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (isLink(cell.adjborder.top)) { continue; }
        if (isLink(cell.adjborder.left)) { continue; }
        let wid = 1, hei = 1;
        while (isLink(offset(cell, wid - .5, 0))) { wid++; }
        while (isLink(offset(cell, 0, hei - .5))) { hei++; }
        let sc = null;
        for (let dx = 0; dx < wid; dx++) {
            for (let dy = 0; dy < hei; dy++) {
                if (offset(cell, dx, dy).qnum >= 0) {
                    sc = offset(cell, dx, dy);
                }
            }
        }
        if ([offset(cell, -.5, 0), offset(cell, 0, -.5), offset(cell, wid - .5, 0), offset(cell, 0, hei - .5)]
            .every(b => b.isnull || b.qans)) { continue; }
        // ignore empty cell when there are too many
        if (emptycnt > 500 && sc === null) { continue; }
        let rectlist = [];
        for (let dl = 0; isRectAble(offset(cell, dl, 0), offset(cell, 0, 0)); dl--) {
            if (!isRectAble2(offset(cell, dl, 0), offset(cell, 0, 0), ['L'])) { continue; }
            for (let dr = wid - 1; isRectAble(offset(cell, dl, 0), offset(cell, dr, 0)); dr++) {
                if (!isRectAble2(offset(cell, dl, 0), offset(cell, dr, 0), ['L', 'R'])) { continue; }
                for (let du = 0; isRectAble(offset(cell, dl, du), offset(cell, dr, 0)); du--) {
                    if (!isRectAble2(offset(cell, dl, du), offset(cell, dr, 0), ['L', 'R', 'U'])) { continue; }
                    for (let dd = hei - 1; isRectAble(offset(cell, dl, du), offset(cell, dr, dd)); dd++) {
                        if (!isRectAble2(offset(cell, dl, du), offset(cell, dr, dd))) { continue; }
                        if (!isSizeAble(dr - dl + 1, dd - du + 1, sc, offset(cell, dl, du))) { continue; }
                        rectlist.push({ dl: dl, du: du, dr: dr, dd: dd });
                    }
                }
            }
        }
        if (rectlist.length === 0) { continue; }
        let ml = rectlist.reduce((m, obj) => Math.max(m, obj.dl), -board.cols);
        let mu = rectlist.reduce((m, obj) => Math.max(m, obj.du), -board.rows);
        let mr = rectlist.reduce((m, obj) => Math.min(m, obj.dr), +board.cols);
        let md = rectlist.reduce((m, obj) => Math.min(m, obj.dd), +board.rows);
        for (let j = ml; j < mr; j++) { add_link(offset(cell, j + .5, 0)); }
        for (let j = mu; j < md; j++) { add_link(offset(cell, 0, j + .5)); }
        if (rectlist.every(obj => obj.dl === ml)) { add_side(offset(cell, ml - .5, 0)); }
        if (rectlist.every(obj => obj.dr === mr)) { add_side(offset(cell, mr + .5, 0)); }
        if (rectlist.every(obj => obj.du === mu)) { add_side(offset(cell, 0, mu - .5)); }
        if (rectlist.every(obj => obj.dd === md)) { add_side(offset(cell, 0, md + .5)); }
    }
}
function NoCrossingBorder() {
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        let list = adjlist(cross.adjborder);
        if (list.filter(b => !b.isnull && b.qans).length === 3) {
            list.forEach(b => add_link(b));
        }
    }
}
function RoomPassOnce() {
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let list = [];
        for (let j = 0; j < room.clist.length; j++) {
            let cell = room.clist[j];
            fourside((nb, nc) => {
                if (!nc.isnull && nc.room !== room) {
                    list.push(nb);
                }
            }, cell.adjborder, cell.adjacent);
        }
        if (list.filter(b => b.line).length === 2) {
            list.forEach(b => add_cross(b));
        }
        if (list.filter(b => b.qsub !== BQSUB.cross).length === 2) {
            list.forEach(b => add_line(b));
        }
    }
}
function ForEachCell(f = c => { }) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        f(cell);
    }
}

// see all checks from ui.puzzle.pzpr.common.AnsCheck.prototype
// see used checks from ui.puzzle.checker.checklist_normal
function GeneralAssist() {
    const checklist = ui.puzzle.checker.checklist_normal;
    const numberRemainsUnshaded = ui.puzzle.board.cell[0].numberRemainsUnshaded;
    let isGreen = c => !c.isnull && c.qsub === CQSUB.green;;
    if (numberRemainsUnshaded) {
        isGreen = c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none;
        add_green = add_dot;
    }
    if (checklist.some(f => f.name === "checkConnectShade")) {
        CellConnected({
            isShaded: isBlack,
            isUnshaded: isGreen,
            add_shaded: add_black,
            add_unshaded: add_green,
        });
    }
    if (checklist.some(f => f.name === "checkConnectUnshadeRB" || f.name === "checkConnectUnshade")) {
        CellConnected({
            isShaded: isGreen,
            isUnshaded: isBlack,
            add_shaded: add_green,
            add_unshaded: add_black,
        });
    }
    if (checklist.some(f => f.name === "checkConnectShadeOutside")) {
        CellConnected({
            isShaded: isBlack,
            isUnshaded: isGreen,
            add_shaded: add_black,
            add_unshaded: add_green,
            OutsideAsShaded: true,
        });
    }
    if (checklist.some(f => f.name === "checkAdjacentShadeCell")) {
        BlackNotAdjacent();
    }
    if (checklist.some(f => f.name === "check2x2ShadeCell")) {
        No2x2Cell({
            isShaded: isBlack,
            add_unshaded: add_green,
        })
    }
    if (checklist.some(f => f.name === "check2x2UnshadeCell")) {
        No2x2Cell({
            isShaded: isGreen,
            add_unshaded: add_black,
        })
    }
    if (checklist.some(f => f.name === "checkDeadendLine") &&
        checklist.some(f => f.name === "checkBranchLine") &&
        checklist.some(f => f.name === "checkCrossLine") &&
        checklist.some(f => f.name === "checkOneLoop")) {
        SingleLoopInCell();
    }
    if (checklist.some(f => f.name === "checkRoomPassOnce")) {
        RoomPassOnce();
    }
    if (checklist.some(f => f.name === "checkUnshadeOnCircle")) {
        ForEachCell(c => { if (c.qnum === CQNUM.wcir) add_green(c); })
    }
    if (checklist.some(f => f.name === "checkShadeOnCircle")) {
        ForEachCell(c => { if (c.qnum === CQNUM.bcir) add_black(c); })
    }
    if (checklist.some(f => f.name === "checkUnshadeSquare")) {
        RectRegion_Cell({
            isShaded: isGreen,
            isUnshaded: isBlack,
            add_shaded: add_green,
            add_unshaded: add_black,
            isSquare: true,
        })
    }
    if (checklist.some(f => f.name === "checkBorderCross")) {
        NoCrossingBorder();
    }
    if (checklist.some(f => f.name === "checkNumberAndUnshadeSize")) {
        ForEachCell(c => { if (c.qnum !== CQNUM.none) add_green(c); })
        SizeRegion_Cell({
            isShaded: isGreen,
            isUnshaded: isBlack,
            add_shaded: add_green,
            add_unshaded: c => add_black(c, true),
            OneNumPerRegion: checklist.some(f => f.name === "checkNoNumberInUnshade") &&
                checklist.some(f => f.name === "checkDoubleNumberInUnshade"),
        });
    }
    if (checklist.some(f => f.name === "checkNumberSize")) {
        SizeRegion_Cell({
            isShaded: isBlack,
            isUnshaded: isGreen,
            add_shaded: add_black,
            add_unshaded: add_green,
            OneNumPerRegion: checklist.some(f => f.name === "checkNoNumberInUnshade") &&
                checklist.some(f => f.name === "checkDoubleNumberInUnshade"),
            NoUnshadedNum: false,
        });
        SizeRegion_Cell({
            isShaded: isGreen,
            isUnshaded: isBlack,
            add_shaded: add_green,
            add_unshaded: add_black,
            OneNumPerRegion: checklist.some(f => f.name === "checkNoNumberInUnshade") &&
                checklist.some(f => f.name === "checkDoubleNumberInUnshade"),
            NoUnshadedNum: false,
        });
    }
}

// assist for certain genre
function PipelinkAssist() {
    ForEachCell(cell => {
        // 11:╋; 12:┃; 13:━; 14:┗; 15:┛; 16:┓; 17:┏
        const tmp = [   // ques, u, l, d, r
            [11, 1, 1, 1, 1],
            [12, 1, 0, 1, 0],
            [13, 0, 1, 0, 1],
            [14, 1, 0, 0, 1],
            [15, 1, 1, 0, 0],
            [16, 0, 1, 1, 0],
            [17, 0, 0, 1, 1],
        ];
        if (cell.ques === CQUES.none) { return; }
        adjlist(cell.adjborder).forEach((b, i) => tmp[cell.ques - 11][i + 1] === 1 ? add_line(b) : add_cross(b));
    });
    ForEachCell(cell => {
        let list = adjlist(cell.adjborder);
        let linecnt = list.filter(b => !b.isnull && b.line).length;
        let crosscnt = list.filter(b => b.isnull || b.qsub === BQSUB.cross).length;
        if (linecnt === 3 || crosscnt === 2) {
            fourside(add_line, cell.adjborder);
        }
        if (linecnt === 2 && crosscnt === 1) {
            fourside(add_cross, cell.adjborder);
        }
        for (let d = 0; d < 4; d++) {
            if (!offset(cell, 0.5, 0, d).line || !offset(cell, 0, 0.5, d).line) { continue; }
            if ((b => b.isnull || b.line || b.qsub === BQSUB.cross)(offset(cell, -.5, 0, d))) { continue; }
            if ((b => b.isnull || b.line || b.qsub === BQSUB.cross)(offset(cell, 0, -.5, d))) { continue; }
            let dd = d;
            let pcell = offset(cell, 1, 0, dd);
            while (pcell !== cell) {
                if (!offset(pcell, 0.5, 0, dd).line) {
                    if ((b => !b.isnull && b.qsub !== BQSUB.cross)(offset(pcell, .5, 0, dd))) { break; }
                    if (!offset(pcell, .5, 0, dd - 1).line && !offset(pcell, .5, 0, dd + 1).line) { break; }
                    dd = (offset(pcell, .5, 0, dd - 1).line ? dd + 3 : dd + 1) % 4;
                }
                pcell = offset(pcell, 1, 0, dd);
            }
            if (pcell === cell && board.linegraph.components.length > 1) {
                fourside(add_line, cell.adjborder);
            }
        }
    });
}

function RingringAssist() {
    let isWall = c => c.ques === 1;
    let isNotPathable = b => b.isnull || b.qsub === BQSUB.cross;
    ForEachCell(cell => {
        if (isWall(cell)) {
            fourside(add_cross, cell.adjborder);
        }
        if (cell.lcnt === 3) {
            fourside(add_line, cell.adjborder);
        }
        if (cell.lcnt === 2 && adjlist(cell.adjborder).some(b => isNotPathable(b))) {
            fourside(add_cross, cell.adjborder);
        }
        let templist = adjlist(cell.adjborder, cell.adjacent);
        templist = templist.filter(([nb, nc]) => !(nc.isnull || isWall(nc) || nb.qsub === BQSUB.cross));
        if (templist.length === 2) {
            templist.forEach(([nb, nc]) => add_line(nb));
        }
    });
    // make the right turning
    ForEachCell(cell => {
        for (let d = 0; d < 4; d++) {
            if (!offset(cell, 0, -.5, d).line || !offset(cell, -.5, 0, d).line) { continue; }
            if (!isNotPathable(offset(cell, 0, .5, d))) { continue; }
            let pcell = cell;
            while (offset(pcell, 0, -.5, d).line) {
                pcell = offset(pcell, 0, -1, d);
                if (isNotPathable(offset(pcell, 0, -.5, d))) {
                    add_line(offset(pcell, -.5, 0, d));
                    add_cross(offset(pcell, .5, 0, d));
                    break;
                }
                if (offset(pcell, .5, 0, d).line) {
                    fourside(add_line, pcell.adjborder);
                }
            }
        }
        for (let d = 0; d < 4; d++) {
            if (!offset(cell, 0, -.5, d).line || !offset(cell, .5, 0, d).line) { continue; }
            if (!isNotPathable(offset(cell, 0, .5, d))) { continue; }
            let pcell = cell;
            while (offset(pcell, 0, -.5, d).line) {
                pcell = offset(pcell, 0, -1, d);
                if (isNotPathable(offset(pcell, 0, -.5, d))) {
                    add_line(offset(pcell, .5, 0, d));
                    add_cross(offset(pcell, -.5, 0, d));
                    break;
                }
                if (offset(pcell, -.5, 0, d).line) {
                    fourside(add_line, pcell.adjborder);
                }
            }
        }
    });
    ForEachCell(cell => {
        for (let d = 0; d < 4; d++) {
            if (!offset(cell, 0, .5, d).line || !offset(cell, .5, 0, d).line) { continue; }
            if (!isNotPathable(offset(cell, 0, -.5, d)) && !isNotPathable(offset(cell, -.5, 0, d))) { continue; }
            let h = 1, w = 1;
            while (offset(cell, 0, h + .5, d).line) { h++; }
            while (offset(cell, w + .5, 0, d).line) { w++; }
            let fg = false;
            do {
                fg = false;
                for (let i = 1; i <= h; i++) {
                    while (isWall(offset(cell, w, i, d)) || offset(cell, w, i - .5, d).qsub === BQSUB.cross) {
                        add_line(offset(cell, w + .5, 0, d));
                        w++;
                        fg = true;
                    }
                }
                for (let i = 1; i <= w; i++) {
                    while (isWall(offset(cell, i, h, d)) || offset(cell, i - .5, h, d).qsub === BQSUB.cross) {
                        add_line(offset(cell, 0, h + .5, d));
                        h++;
                        fg = true;
                    }
                }
            } while (fg);
            if (isNotPathable(offset(cell, w + .5, 0, d))) {
                for (let i = 1; i <= h; i++) {
                    add_line(offset(cell, w, i - .5, d));
                }
                if (isNotPathable(offset(cell, 0, h + .5, d)) || isNotPathable(offset(cell, w, h + .5, d))) {
                    add_cross(offset(cell, 0, h + .5, d));
                    add_cross(offset(cell, w, h + .5, d));
                }
            }
            if (isNotPathable(offset(cell, 0, h + .5, d))) {
                for (let i = 1; i <= w; i++) {
                    add_line(offset(cell, i - .5, h, d));
                }
                if (isNotPathable(offset(cell, w + .5, 0, d)) || isNotPathable(offset(cell, w + .5, h, d))) {
                    add_cross(offset(cell, w + .5, 0, d));
                    add_cross(offset(cell, w + .5, h, d));
                }
            }
        }
    });
}

function NonogramAssist() {
    // deduce each clue
    let f = function (nl, cl) {
        let len = cl.length;
        let ll = new Array(nl.length);
        ll[ll.length - 1] = len - nl[ll.length - 1];
        for (let i = ll.length - 2; i >= 0; i--) {
            ll[i] = ll[i + 1] - nl[i] - 1;
        }
        let dcnt = new Array(len);
        let bcnt = new Array(len);
        for (let i = 0; i < len; i++) {
            dcnt[i] = (i > 0 ? dcnt[i - 1] : 0) + (cl[i].qsub === CQSUB.dot ? 1 : 0);
            bcnt[i] = (i > 0 ? bcnt[i - 1] : 0) + (cl[i].qans ? 1 : 0);
        }
        let res = [];
        const MAXSIT = 1000;
        let gen = function (n = 0, l = []) {
            if (res.length > MAXSIT) { return; }
            if (n === nl.length) {
                if (l.length > len) { l = l.slice(0, len); }
                if (l.length > 0 && bcnt[len - 1] > bcnt[l.length - 1]) { return; }
                if (l.length < len) { l = [...l, ...Array(len - l.length).fill(0)]; }
                res.push(l);
                return;
            }
            for (let i = l.length; i <= ll[n]; i++) {
                if (i + nl[n] < len && cl[i + nl[n]].qans) { continue; }
                if ((i > 0 ? bcnt[i - 1] : 0) !== (l.length > 0 ? bcnt[l.length - 1] : 0)) { continue; }
                if (dcnt[i + nl[n] - 1] > (i > 0 ? dcnt[i - 1] : 0)) { continue; }
                gen(n + 1, [...l, ...Array(i - l.length).fill(0), ...Array(nl[n]).fill(1), 0]);
                if (res.length > MAXSIT) { return; }
            }
        };
        gen();
        if (res.length === 0 || res.length > MAXSIT) { return; }
        for (let i = 0; i < len; i++) {
            if (res.every(l => l[i] === res[0][i])) {
                if (res[0][i] === 0) { add_dot(cl[i]); }
                if (res[0][i] === 1) { add_black(cl[i]); }
            }
        }
    };
    for (let i = 0; i < board.rows; i++) {
        let nl = [], cl = [];
        for (let j = board.minbx + 1; j <= -1; j += 2) { nl.push(board.getex(j, i * 2 + 1).qnum); }
        for (let j = 0; j < board.cols; j++) { cl.push(board.getc(j * 2 + 1, i * 2 + 1)); }
        nl = nl.filter(n => n >= 0);
        f(nl, cl);
    }
    for (let i = 0; i < board.cols; i++) {
        let nl = [], cl = [];
        for (let j = board.minby + 1; j <= -1; j += 2) { nl.push(board.getex(i * 2 + 1, j).qnum); }
        for (let j = 0; j < board.rows; j++) { cl.push(board.getc(i * 2 + 1, j * 2 + 1)); }
        nl = nl.filter(n => n >= 0);
        f(nl, cl);
    }
}

function SudokuAssist() {
    let add_candidate = function (c, l) {
        if (c.isnull || c.anum !== -1) { return; }
        while (l.length < 4) { l.push(-1); }
        if (c.snum.join(',') === l.join(',')) { return; }
        if (step && flg) { return; }
        flg = true;
        [0, 1, 2, 3].forEach(n => c.setSnum(n, l[n]));
        c.draw();
    }
    let add_number = function (c, n) {
        if (c.isnull || c.anum !== -1) { return; }
        if (step && flg) { return; }
        flg = true;
        [0, 1, 2, 3].forEach(n => c.setSnum(n, -1));
        c.setAnum(n);
        c.draw();
    }
    let size = board.rows;
    ForEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_number(cell, cell.qnum);
        }
    });
    ForEachCell(cell => {
        if (cell.anum !== -1) { return; }
        let arr = () => Array(size).fill().map((_, i) => i + 1);
        let cand = arr(), row = arr(), col = arr(), box = arr();
        ForEachCell(c => {
            if (cell === c) { return; }
            let b = c.anum === -1 && c.snum.every(n => n === -1);
            if (cell.bx === c.bx) { col = b ? [] : col.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (cell.by === c.by) { row = b ? [] : row.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (cell.room === c.room) { box = b ? [] : box.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (c.anum === -1) { return; }
            if (cell.bx === c.bx || cell.by === c.by || cell.room === c.room) {
                cand = cand.filter(n => n !== c.anum);
            }
        });
        if (col.length === 1) { add_number(cell, col[0]); return; }
        if (row.length === 1) { add_number(cell, row[0]); return; }
        if (box.length === 1) { add_number(cell, box[0]); return; }
        if (cell.snum.some(n => n !== -1)) {
            add_candidate(cell, cell.snum.filter(n => cand.includes(n)).sort((a, b) => (a - b)));
        }
        if (cell.snum.filter(n => n !== -1).length === 1) {
            add_number(cell, cell.snum.find(n => n !== -1));
            return;
        }
        if (cell.snum.every(n => n === -1) && cand.length <= 4) {
            add_candidate(cell, cand);
        }
    });
}

function CirclesAndSquaresAssist() {
    ForEachCell(c => { if (c.qnum === CQNUM.wcir) add_green(c); });
    ForEachCell(c => { if (c.qnum === CQNUM.bcir) add_black(c); });
    No2x2Black();
    BlackConnected();
    RectRegion_Cell({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
        isSquare: true,
    })
}

function TatamibariAssist() {
    RectRegion_Border({
        isSizeAble: (w, h, sc, c) => {
            if (sc !== null && !(sc.qnum === 1 && w === h || sc.qnum === 2 && w < h || sc.qnum === 3 && w > h)) { return false; }
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    if (sc !== null && offset(c, i, j) !== sc && offset(c, i, j).qnum !== CQNUM.none) { return false; }
                    if (sc === null && offset(c, i, j).qnum !== CQNUM.none) { sc = offset(c, i, j); }
                }
            }
            if (sc === null) { return false; }
            return sc.qnum === CQNUM.quesmark || sc.qnum === 1 && w === h || sc.qnum === 2 && w < h || sc.qnum === 3 && w > h;
        }
    });
    NoCrossingBorder();
}

function PencilsAssist() {
    let add_tip = function (c, dir) {  // 1=↑, 2=↓, 3=←, 4=→
        if (c === undefined || c.isnull || isGreen(c) || c.anum !== CANUM.none) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(CQSUB.yellow);
        c.setAnum(dir);
        c.draw();
    }
    let add_yellow = function (c) {
        if (c === undefined || c.isnull || c.qans !== CQANS.none || c.qsub !== CQSUB.none) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(CQSUB.yellow);
        c.draw();
    };
    let add_cross = function (b) {
        if (b === undefined || b.isnull || b.line || b.qsub !== BQSUB.none || b.qans || b.ques) { return; }
        if (step && flg) { return; }
        b.setQsub(BQSUB.cross);
        b.draw();
        flg |= b.qsub === BQSUB.cross;
    };
    for (let i = 0; i < board.border.length; i++) {
        let border = board.border[i];
        if (border.qans && border.qsub === BQSUB.cross) {
            border.setQsub(BQSUB.none);
        }
    }
    // record cells with line that belongs to a tip
    let cllist = [];
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.anum !== CANUM.none) {
            let dfs = function (c) {
                if (c.isnull || cllist.includes(c)) { return; }
                cllist.push(c);
                fourside((nb, nc) => {
                    if (!nb.isnull && nb.line) {
                        dfs(nc);
                    }
                }, c.adjborder, c.adjacent);
            }
            dfs(cell);
        }
    }
    let isTipAble = function (c, dir) {
        if (c.isnull || cllist.includes(c) && c.anum !== dir || isGreen(c)) {
            return false;
        }
        return true;
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qdir !== 0) {
            add_tip(cell, cell.qdir);
        }
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
        if (cell.qnum === 1) {
            fourside(add_side, cell.adjborder);
        }
        if (cell.qnum > 1) {
            // extend clue
            for (let d = 0; d < 2; d++) {
                let ll = 0, rr = 0;
                while ((b => !b.isnull && b.qsub === BQSUB.cross)(offset(cell, ll - .5, 0, d)) &&
                    offset(cell, ll - 1, 0, d).qsub !== CQSUB.yellow) { ll--; }
                while ((b => !b.isnull && b.qsub === BQSUB.cross)(offset(cell, rr + .5, 0, d)) &&
                    offset(cell, rr + 1, 0, d).qsub !== CQSUB.yellow) { rr++; }
                let lc = ll, rc = rr;
                while ((c => !c.isnull && c.qsub !== CQSUB.yellow && (c.qnum < 0 || c.qnum === cell.qnum))(offset(cell, lc - 1, 0, d)) &&
                    !offset(cell, lc - .5, 0, d).qans && lc > 1 - cell.qnum + rr) {
                    lc--;
                }
                while ((c => !c.isnull && c.qsub !== CQSUB.yellow && (c.qnum < 0 || c.qnum === cell.qnum))(offset(cell, rc + 1, 0, d)) &&
                    !offset(cell, rc + .5, 0, d).qans && rc < cell.qnum - 1 + ll) {
                    rc++;
                }
                if ((b => b.isnull || b.qans)(offset(cell, 0, .5, d)) && (b => b.isnull || b.qans)(offset(cell, 0, -.5, d))) {
                    for (let j = rc - cell.qnum + 1; j <= lc + cell.qnum - 1; j++) {
                        add_green(offset(cell, j, 0, d));
                        add_side(offset(cell, j, -.5, d));
                        add_side(offset(cell, j, +.5, d));
                        if (j < lc + cell.qnum - 1) {
                            add_cross(offset(cell, j + .5, 0, d));
                        }
                    }
                    if (rc - lc + 1 === cell.qnum) {
                        add_side(offset(cell, rc + .5, 0, d));
                        add_side(offset(cell, lc - .5, 0, d));
                        if (!isTipAble(offset(cell, rc + 1, 0, d), d === 0 ? 4 : 1)) {
                            add_tip(offset(cell, lc - 1, 0, d), d === 0 ? 3 : 2)
                        }
                        if (!isTipAble(offset(cell, lc - 1, 0, d), d === 0 ? 3 : 2)) {
                            add_tip(offset(cell, rc + 1, 0, d), d === 0 ? 4 : 1)
                        }
                    }
                }
                if (rc - lc + 1 === cell.qnum && !isTipAble(offset(cell, rc + 1, 0, d), d === 0 ? 4 : 1) &&
                    !isTipAble(offset(cell, lc - 1, 0, d), d === 0 ? 3 : 2)) {
                    add_side(offset(cell, +.5, 0, d));
                    add_side(offset(cell, -.5, 0, d));
                }
                if (rc - lc + 1 < cell.qnum) {
                    add_side(offset(cell, +.5, 0, d));
                    add_side(offset(cell, -.5, 0, d));
                }
            }
        }
        // add tip 
        if (isGreen(cell) && (b => b.isnull || b.qans)(offset(cell, -.5, 0)) && (b => b.isnull || b.qans)(offset(cell, 0, -.5))) {
            let dc = 0, rc = 0;
            while ((b => !b.isnull && b.qsub === BQSUB.cross)(offset(cell, 0, dc + .5))) { dc++; }
            while ((b => !b.isnull && b.qsub === BQSUB.cross)(offset(cell, rc + .5, 0))) { rc++; }
            if ((b => b.isnull || b.qans)(offset(cell, 0, dc + .5)) && (b => b.isnull || b.qans)(offset(cell, rc + .5, 0))) {
                let list = [];
                if (dc === 0) {
                    list.push([offset(cell, -1, 0), 3]);
                    list.push([offset(cell, rc + 1, 0), 4]);
                }
                if (rc === 0) {
                    list.push([offset(cell, 0, -1), 1]);
                    list.push([offset(cell, 0, dc + 1), 2]);
                }
                list = list.filter(p => isTipAble(p[0], p[1]));
                if (list.length === 1) {
                    add_tip(list[0][0], list[0][1]);
                }
            }
        }
        // extend to match line and pencil
        if (cell.anum !== CANUM.none) {
            add_yellow(cell);
            let d = qdirremap(cell.anum);
            add_green(offset(cell, 0, 1, d));
            add_side(offset(cell, 0, .5, d));
            add_side(offset(cell, -.5, 1, d));
            add_side(offset(cell, +.5, 1, d));
            let pc = cell, lc = cell, llc = cell;
            while (offset(pc, 0, .5, d).qsub === BQSUB.cross || pc === cell) {
                let list = adjlist(lc.adjborder, lc.adjacent);
                list = list.filter(([nb, nc]) => {
                    if (nc === llc) { return false; }
                    if (nc.isnull || isGreen(nc) || nc.anum !== CANUM.none) { return false; }
                    if (cllist.includes(nc) && !nb.line) { return false; }
                    if (nb.isnull || nb.qsub === BQSUB.cross || nb.qans) { return false; }
                    return true;
                });
                if (list.some(p => p[0].line)) {
                    list = list.filter(p => p[0].line);
                }
                if (list.length !== 1) { break; }
                add_line(list[0][0]);
                fourside((nb, nc) => {
                    if (nc.qsub === CQSUB.yellow) {
                        add_cross(nb);
                    }
                }, lc.adjborder, lc.adjacent);
                llc = lc;
                lc = list[0][1];
                pc = offset(pc, 0, 1, d);
                add_yellow(lc);
            }
            while (lc.lcnt === 2 || lc === cell && lc.lcnt === 1) {
                add_cross(offset(pc, 0, .5, d));
                pc = offset(pc, 0, 1, d);
                add_green(pc);
                add_side(offset(pc, -.5, 0, d));
                add_side(offset(pc, +.5, 0, d));
                [llc, lc] = [lc, adjlist(lc.adjborder, lc.adjacent).find(([nb, nc]) => !nb.isnull && nb.line && nc !== llc)[1]];
            }
            if (adjlist(lc.adjborder, lc.adjacent).every(([nb, nc]) =>
                nc === llc || nb.isnull || nb.qsub === BQSUB.cross || nb.qans)) {
                add_side(offset(pc, 0, .5, d));
            }
            if (pc !== cell && (b => b.isnull || b.qans)(offset(pc, 0, .5, d))) {
                fourside((nb, nc) => {
                    if (nc.qsub === CQSUB.yellow) {
                        add_cross(nb);
                    }
                }, lc.adjborder, lc.adjacent);
            }
        }
        if (cell.lcnt === 0 && adjlist(cell.adjborder, cell.adjacent).every(([nb, nc]) => nb.isnull || nb.qans || nb.qsub === BQSUB.cross || isGreen(nc) || nc.lcnt === 2 || nc.lcnt === 1 && nc.anum !== CANUM.none)) {
            add_green(cell);
        }
        if (adjlist(cell.adjborder, cell.adjacent).every(([nb, nc]) => {
            if (nc.isnull || nb.qans && isGreen(nc)) { return true; }
            if (cllist.includes(nc) && nc.anum === CANUM.none) { return true; }
            if (nc.anum !== CANUM.none && offset(nc, 0, 1, qdirremap(nc.anum)) !== cell) { return true; }
            return false;
        })) {
            add_yellow(cell);
        }
        if (cell.lcnt > 0) {
            add_yellow(cell);
        }
        if (cell.qsub === CQSUB.yellow && adjlist(cell.adjborder).filter(b => !b.isnull && !b.qans && b.qsub !== BQSUB.cross).length === 1) {
            add_line(adjlist(cell.adjborder).find(b => !b.isnull && !b.qans && b.qsub !== BQSUB.cross));
        }
        if ([[offset(cell, -1, 0), 3], [offset(cell, 1, 0), 4], [offset(cell, 0, -1), 1], [offset(cell, 0, 1), 2]].every(([c, d]) => !isTipAble(c, d)) &&
            adjlist(cell.adjborder).filter(b => !b.isnull && !b.qans).length === 1) {
            add_cross(adjlist(cell.adjborder).find(b => !b.isnull && !b.qans));
        }
        for (let d = 0; d < 4; d++) {
            let nc = offset(cell, 1, 0, d);
            if (nc.isnull) { continue; }
            // cross between cells in cllist
            if (cllist.includes(cell) && cllist.includes(nc)) {
                add_cross(offset(cell, .5, 0, d));
            }
            // add side between inner and outer
            if (cell.qsub !== CQSUB.none && nc.qsub !== CQSUB.none && cell.qsub !== nc.qsub) {
                add_side(offset(cell, .5, 0, d));
            }
            // extend pencil by cross mark
            if (isGreen(cell) && (b => b.qsub === BQSUB.cross && !b.qans)(offset(cell, .5, 0, d))) {
                add_side(offset(cell, 0, -.5, d));
                add_side(offset(cell, 0, +.5, d));
                add_side(offset(cell, 1, -.5, d));
                add_side(offset(cell, 1, +.5, d));
                add_green(nc);
            }
            // different clue
            if (cell.qnum > 0 && nc.qnum > 0 && cell.qnum !== nc.qnum) {
                add_side(offset(cell, .5, 0, d));
            }
        }
    }
}

function MoonOrSunAssist() {
    RoomPassOnce();
    SingleLoopInCell({
        isPass: c => {
            if (c.qnum === CQNUM.none) { return false; }
            if (c.qnum === CQNUM.moon && c.room.count.moon.passed > 0) { return true; }
            if (c.qnum === CQNUM.sun && c.room.count.sun.passed > 0) { return true; }
            for (let i = 0; i < c.room.clist.length; i++) {
                let c2 = c.room.clist[i];
                if (c2.qnum !== c.qnum && c2.qsub === CQSUB.cross) { return true; }
            }
            return false;
        },
    });
    let add_Xcell = function (c) {
        if (c === undefined || c.isnull || c.lcnt > 0 || c.qnum === CQNUM.none || c.qsub === CQSUB.cross) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(CQSUB.cross);
        c.draw();
    }
    let roomType = c => {
        if (c.room.count.sun.passed > 0) return 1;
        if (c.room.count.moon.passed > 0) return 2;
        for (let i = 0; i < c.room.clist.length; i++) {
            let c2 = c.room.clist[i];
            if (c2.qnum === CQNUM.moon && c2.qsub === CQSUB.cross) { return 1; }
            if (c2.qnum === CQNUM.sun && c2.qsub === CQSUB.cross) { return 2; }
        }
        return 0;
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        fourside((nb, nc) => {
            if (nc.isnull || cell.room === nc.room) { return; }
            if (nb.line && roomType(nc) !== 0) {
                for (let j = 0; j < cell.room.clist.length; j++) {
                    let cell2 = cell.room.clist[j];
                    if (cell2.qnum === roomType(nc)) {
                        add_Xcell(cell2);
                    }
                }
            }
            if (roomType(nc) !== 0 && cell.qnum === roomType(nc)) {
                add_cross(nb);
            }
            if (roomType(cell) !== 0 && roomType(nc) !== 0 && roomType(cell) === roomType(nc)) {
                add_cross(nb);
            }
        }, cell.adjborder, cell.adjacent);
        if (cell.qnum === CQNUM.none) { continue; }
        fourside((nb, nc) => {
            if (nc.isnull || nc.qnum === CQNUM.none) { return; }
            if ((cell.qnum === nc.qnum) ^ (cell.room === nc.room)) {
                add_cross(nb);
            }
        }, cell.adjborder, cell.adjacent);
        if (!adjlist(cell.adjborder).some(b => !b.isnull && b.qsub !== BQSUB.cross)) {
            add_Xcell(cell);
        }
        if (roomType(cell) > 0 && cell.qnum !== roomType(cell)) {
            add_Xcell(cell);
        }
        if (cell.qsub === CQSUB.cross) {
            fourside(add_cross, cell.adjborder);
        }
    }
}

function ShikakuAssist() {
    let s = Array.from(new Array(board.rows), () => new Array(board.cols).fill([]));
    ForEachCell(c => {
        let x = (c.bx - 1) / 2, y = (c.by - 1) / 2;
        let s1 = x > 0 ? s[y][x - 1] : [];
        let s2 = y > 0 ? s[y - 1][x] : [];
        s[y][x] = [...s1, ...s2.filter(c => !s1.includes(c))];
        if (c.qnum !== CQNUM.none) { s[y][x].push(c); }
    });
    RectRegion_Border({
        isSizeAble: (w, h, sc, c) => {
            if (sc !== null && w * h !== sc.qnum) { return false; }
            let x = (c.bx - 1) / 2 + w - 1, y = (c.by - 1) / 2 + h - 1;
            let f = (a, b) => a < 0 || b < 0 ? [] : s[a][b];
            if (f(y, x).length - f(y, x - w).length - f(y - h, x).length + f(y - h, x - w).length !== 1) { return false; }
            sc = f(y, x).find(c => !f(y, x - w).includes(c) && !f(y - h, x).includes(c));
            return sc.qnum === CQNUM.quesmark || w * h === sc.qnum;
        }
    });
}

function SquareJamAssist() {
    RectRegion_Border({
        isSizeAble: (w, h, sc, c) => {
            if (w !== h) { return false; }
            if (sc !== null && w !== sc.qnum) { return false; }
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    if (offset(c, i, j).qnum > 0 && sc === null) { sc = offset(c, i, j); }
                    if (offset(c, i, j).qnum > 0 && offset(c, i, j).qnum !== sc.qnum) { return false; }
                }
            }
            return sc === null || w === sc.qnum;
        }
    });
    NoCrossingBorder();
}

function TasquareAssist() {
    RectRegion_Cell({
        isShaded: isBlack,
        isUnshaded: c => isGreen(c) || c.qnum !== CQNUM.none,
        add_shaded: add_black,
        add_unshaded: add_dot,
        isSquare: true,
    });
    CellConnected({
        isShaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        isUnshaded: isBlack,
        add_shaded: add_dot,
        add_unshaded: add_black,
    });
    let is2x2able = function (c) {
        for (let d = 0; d < 4; d++) {
            let list = [c, offset(c, 0, 1, d), offset(c, 1, 0, d), offset(c, 1, 1, d)];
            if (list.every(c => !c.isnull && c.qsub !== CQSUB.dot && c.qnum === CQNUM.none)) {
                return true;
            }
        }
        return false;
    }
    let isNotBlack = c => c.isnull || c.qsub === CQSUB.dot || c.qnum !== CQNUM.none;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum === CQNUM.none) { continue; }
        add_dot(cell);
        let templist = adjlist(cell.adjacent);
        if (templist.filter(c => !isNotBlack(c)).length === 1) {
            templist.forEach(c => add_black(c, true));
        }
        if (cell.qnum === CQNUM.quesmark) { continue; }
        // black cells: n around 0~3, n-3 around 4~7, 2 around 8
        if (cell.qnum <= 8) {
            let list = adjlist(cell.adjacent).filter(c => !isNotBlack(c));
            if ([0, 1, 2, 3].includes(cell.qnum) && list.length === cell.qnum ||
                [4, 5, 6].includes(cell.qnum) && list.length === cell.qnum - 3 ||
                cell.qnum === 8 && list.length === 2) {
                list.forEach(c => add_black(c));
            }
        }
        // 1*2^2 around 4~6, 2*2^2 around 8
        if (cell.qnum >= 4 && cell.qnum <= 8) {
            let list = [];
            for (let d = 0; d < 4; d++) {
                list.push([offset(cell, 2, 0, d), offset(cell, 1, 0, d)]);
            }
            list = list.filter(l => is2x2able(l[1]));
            if (list.length === Math.floor(cell.qnum / 4)) {
                list.forEach(l => { add_black(l[0]), add_black(l[1]) });
            }
        }
        //        · ·
        //  3  ->  3 
        //        · ·
        if (cell.qnum === 3) {
            add_dot(offset(cell, -1, -1));
            add_dot(offset(cell, -1, 1));
            add_dot(offset(cell, 1, -1));
            add_dot(offset(cell, 1, 1));
        }
        for (let d = 0; d < 4; d++) {
            // ? █ -> ?·█ (?<=3)
            if (cell.qnum <= 3 && isBlack(offset(cell, 2, 0, d))) {
                add_dot(offset(cell, 1, 0, d));
            }
            // 4 · -> 4··
            if (cell.qnum === 4 && isNotBlack(offset(cell, 2, 0, d))) {
                add_dot(offset(cell, 1, 0, d));
            }
            //  ·      · 
            // ·1  -> ·1 
            //          ·
            if (cell.qnum === 1 && isNotBlack(offset(cell, 0, -1, d)) && isNotBlack(offset(cell, -1, 0, d))) {
                add_dot(offset(cell, 1, 1, d));
            }
            //  ·      · 
            //  2  ->  2 
            //        · ·
            if (cell.qnum === 2 && isNotBlack(offset(cell, 0, -1, d))) {
                add_dot(offset(cell, -1, 1, d));
                add_dot(offset(cell, 1, 1, d));
            }
        }
        let blist = [];
        let dfs = function (c) {
            if (blist.includes(c) || c.isnull || c.qans !== CQANS.black) { return; }
            blist.push(c);
            fourside(dfs, c.adjacent);
        }
        adjlist(cell.adjacent).forEach(c => dfs(c));
        if (blist.length === cell.qnum) {
            fourside(add_dot, cell.adjacent);
            blist.forEach(c => fourside(add_dot, c.adjacent));
        }
    }
}

function TentaishoAssist() {
    let isDot = obj => obj.qnum > 0;
    let isEmpty = c => !c.isnull && c.ques !== CQUES.bwall;
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        let list = adjlist(cross.adjborder);
        if (list.filter(b => !b.isnull && b.qsub === BQSUB.link).length === 2 && cross.lcnt === 1) {
            list.forEach(b => add_side(b));
        }
        if (list.filter(b => !b.isnull && b.qsub === BQSUB.link).length === 3) {
            list.forEach(b => add_link(b));
        }
    }
    let n = 0;
    let id = new Map(); // map every cell to unique dot id
    let dotmap = new Map(); // get dot obj
    let bfs_id = function (clist, n) {
        while (clist.length > 0) {
            let c = clist.pop();
            let x = dotmap.get(n).bx;
            let y = dotmap.get(n).by;
            if (!isEmpty(c) || id.has(c)) { continue; }
            id.set(c, n);
            let fn = function (bbx, bby, cbx, cby) {
                let nb = board.getb(bbx, bby);
                let nc = board.getc(cbx, cby);
                if (!isEmpty(nc) || nb.qans || id.has(nc) && id.get(nc) !== id.get(c)) {
                    add_side(nb);
                    add_side(board.getb(2 * x - bbx, 2 * y - bby));
                }
                if (id.has(nc) && id.get(nc) === id.get(c)) {
                    add_link(nb);
                }
                if (isEmpty(nc) && nb.qsub === BQSUB.link) {
                    add_link(board.getb(2 * x - bbx, 2 * y - bby));
                    clist.push(nc);
                    clist.push(board.getc(2 * x - cbx, 2 * y - cby));
                }
            };
            fn(c.bx - 1, c.by, c.bx - 2, c.by);
            fn(c.bx + 1, c.by, c.bx + 2, c.by);
            fn(c.bx, c.by - 1, c.bx, c.by - 2);
            fn(c.bx, c.by + 1, c.bx, c.by + 2);
        }
    };
    let id_choice = new Map();
    let dfs_idc = function (c, n) {
        let x = dotmap.get(n).bx;
        let y = dotmap.get(n).by;
        let oc = board.getc(2 * x - c.bx, 2 * y - c.by);
        if (!isEmpty(c) || id.has(c) && id.get(c) !== n) { return; }
        if (!isEmpty(oc) || id.has(oc) && id.get(oc) !== n) { return; }
        if (id_choice.has(c) && id_choice.get(c).includes(n)) { return; }
        if (id_choice.has(oc) && id_choice.get(oc).includes(n)) { return; }
        if (!id_choice.has(c)) { id_choice.set(c, []); }
        if (!id_choice.has(oc)) { id_choice.set(oc, []); }
        id_choice.set(c, id_choice.get(c).concat([n]));
        id_choice.set(oc, id_choice.get(oc).concat([n]));
        fourside((nb, nc) => {
            if (nb.qans) { return; }
            dfs_idc(nc, n);
        }, c.adjborder, c.adjacent);
    };
    // assign cells to dots and deduce
    for (let x = board.minbx + 1; x <= board.maxbx - 1; x++) {
        for (let y = board.minby + 1; y <= board.maxby - 1; y++) {
            if (isDot(board.getobj(x, y))) {
                n++;
                dotmap.set(n, board.getobj(x, y));
                let clist = [];
                if (x % 2 === 1 && y % 2 === 1) {
                    clist.push(board.getc(x, y));
                }
                if (x % 2 === 1 && y % 2 === 0) {
                    clist.push(board.getc(x, y - 1));
                    clist.push(board.getc(x, y + 1));
                }
                if (x % 2 === 0 && y % 2 === 1) {
                    clist.push(board.getc(x - 1, y));
                    clist.push(board.getc(x + 1, y));
                }
                if (x % 2 === 0 && y % 2 === 0) {
                    clist.push(board.getc(x - 1, y - 1));
                    clist.push(board.getc(x - 1, y + 1));
                    clist.push(board.getc(x + 1, y - 1));
                    clist.push(board.getc(x + 1, y + 1));
                }
                bfs_id(clist, n);
            }
        }
    }
    // assign cells to possible dots
    n = 0;
    for (let x = board.minbx + 1; x <= board.maxbx - 1; x++) {
        for (let y = board.minby + 1; y <= board.maxby - 1; y++) {
            if (isDot(board.getobj(x, y))) {
                n++;
                let clist = [];
                if (x % 2 === 1 && y % 2 === 1) {
                    clist.push(board.getc(x, y));
                }
                if (x % 2 === 1 && y % 2 === 0) {
                    clist.push(board.getc(x, y - 1));
                    clist.push(board.getc(x, y + 1));
                }
                if (x % 2 === 0 && y % 2 === 1) {
                    clist.push(board.getc(x - 1, y));
                    clist.push(board.getc(x + 1, y));
                }
                if (x % 2 === 0 && y % 2 === 0) {
                    clist.push(board.getc(x - 1, y - 1));
                    clist.push(board.getc(x - 1, y + 1));
                    clist.push(board.getc(x + 1, y - 1));
                    clist.push(board.getc(x + 1, y + 1));
                }
                dfs_idc(clist[0], n);
            }
        }
    }
    // check not assigned cells
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (!isDot(cell) && adjlist(cell.adjborder).filter(b => !b.isnull && !b.qans).length === 1) {
            add_link(adjlist(cell.adjborder).filter(b => !b.isnull && !b.qans)[0]);
        }
        if (!isEmpty(cell) || id.has(cell)) { continue; }
        if (id_choice.has(cell) && id_choice.get(cell).length === 1) {
            bfs_id([cell], id_choice.get(cell)[0]);
        }
    }
    document.querySelector('#btncolor').click();
}

function NorinuriAssist() {
    ForEachCell(c => { if (c.qnum !== CQNUM.none) add_green(c); })
    SizeRegion_Cell({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: c => add_black(c, true),
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let list = adjlist(cell.adjacent);
        // surrounded by green
        if (!list.some(c => !c.isnull && c.qsub !== CQSUB.green)) {
            add_green(cell);
        }
        // extend domino
        if (isBlack(cell) && list.filter(c => !c.isnull && c.qsub !== CQSUB.green).length === 1) {
            let ncell = list.find(c => !c.isnull && c.qsub !== CQSUB.green);
            add_black(ncell);
        }
        // finished domino
        if (isBlack(cell) && list.some(c => isBlack(c))) {
            let ncell = list.find(isBlack(c));
            fourside(add_green, cell.adjacent);
            fourside(add_green, ncell.adjacent);
        }
        // not making triomino
        if (list.filter(isBlack(c)).length >= 2) {
            add_green(cell);
        }
        //  ·      · 
        // ·█  -> ·█ 
        //          ·
        for (let d = 0; d < 4; d++) {
            if (isBlack(cell) &&
                (offset(cell, -1, 0, d).isnull || offset(cell, -1, 0, d).qsub === CQSUB.green) &&
                (offset(cell, 0, -1, d).isnull || offset(cell, 0, -1, d).qsub === CQSUB.green)) {
                add_green(offset(cell, 1, 1, d));
            }
        }
    }
}

function NorinoriAssist() {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let list = adjlist(cell.adjacent);
        // surrounded by dot
        if (!list.some(c => !c.isnull && c.qsub !== CQSUB.dot)) {
            add_dot(cell);
        }
        // extend domino
        if (isBlack(cell) && list.filter(c => !c.isnull && c.qsub !== CQSUB.dot).length === 1) {
            let ncell = list.find(c => !c.isnull && c.qsub !== CQSUB.dot);
            add_black(ncell);
        }
        // finished domino
        if (isBlack(cell) && list.some(c => isBlack(c))) {
            let ncell = list.find(c => isBlack(c));
            fourside(add_dot, cell.adjacent);
            fourside(add_dot, ncell.adjacent);
        }
        // not making triomino
        if (list.filter(c => isBlack(c)).length >= 2) {
            add_dot(cell);
        }
        //  ·      · 
        // ·█  -> ·█ 
        //          ·
        for (let d = 0; d < 4; d++) {
            if (isBlack(cell) &&
                (offset(cell, -1, 0, d).isnull || offset(cell, -1, 0, d).qsub === CQSUB.green) &&
                (offset(cell, 0, -1, d).isnull || offset(cell, 0, -1, d).qsub === CQSUB.green)) {
                add_dot(offset(cell, 1, 1, d));
            }
        }
    }
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let list = [];
        for (let j = 0; j < room.clist.length; j++) {
            list.push(room.clist[j]);
        }
        // finish region
        if (list.filter(c => isBlack(c)).length === 2) {
            list.forEach(c => add_dot(c));
        }
        if (list.filter(c => c.qsub !== CQSUB.dot).length === 2) {
            list.forEach(c => add_black(c));
        }
        if (list.filter(c => isBlack(c)).length === 1) {
            list.forEach(c => {
                if (isBlack(c) || c.qsub === CQSUB.dot) { return; }
                if (!adjlist(c.adjacent).some(nc => !nc.isnull &&
                    (c.room !== nc.room && nc.qsub !== CQSUB.dot || c.room === nc.room && isBlack(nc)))) {
                    add_dot(c);
                }
            });
        }
    }
}

function AllorNothingAssist() {
    let add_color = function (c, color) {
        if (c.isnull || c.qsub !== CQSUB.none) { return; }
        if (step && flg) { return; }
        flg = 1;
        c.setQsub(color);
        c.draw();
    };
    let add_gray = function (c) { add_color(c, CQSUB.gray); };
    let add_yellow = function (c) { add_color(c, CQSUB.yellow); };
    let add_border_cross = function (b) { if (b.ques) { add_cross(b); } };
    SingleLoopInCell({
        isPassable: c => c.qsub !== CQSUB.gray,
        isPass: c => c.qsub === CQSUB.yellow,
        add_notpass: add_gray,
        add_pass: add_yellow,
    });
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let list = [];
        for (let j = 0; j < room.clist.length; j++) {
            list.push(room.clist[j]);
        }
        let nbcnt = function (c) {
            let templist = adjlist(c.adjacent);
            return templist.filter(nc => !nc.isnull && c.room === nc.room).length;
        };
        let list2 = list.filter(c => nbcnt(c) !== 1);
        let listodd = list.filter(c => (c.bx + c.by) % 4 === 2);
        let listeven = list.filter(c => (c.bx + c.by) % 4 === 0);
        if (list.length - list2.length === 2) {
            list2.forEach(c => fourside(add_border_cross, c.adjborder));
        }
        if (listeven.length === listodd.length + 1) {
            listodd.forEach(c => fourside(add_border_cross, c.adjborder));
        }
        if (listodd.length === listeven.length + 1) {
            listeven.forEach(c => fourside(add_border_cross, c.adjborder));
        }
        if (list.some(c => c.lcnt > 0 || c.qsub === CQSUB.yellow)) {
            list.forEach(c => add_yellow(c));
            let templist = list.filter(c => nbcnt(c) === 1);
            templist.forEach(c => fourside((nb, nc) => {
                if (!nc.isnull && room === nc.room) {
                    add_line(nb);
                }
            }, c.adjborder, c.adjacent));
        }
        if (list.some(c => c.qsub === CQSUB.gray) || list.length - list2.length > 2 ||
            Math.abs(listodd.length - listeven.length) > 1) {
            list.forEach(c => add_gray(c));
            list.forEach(c => fourside(add_cross, c.adjborder));
            list.forEach(c => fourside(add_yellow, c.adjacent));
        }
    }
}

function AqreAssist() {
    BlackConnected();
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let fn = function (c1, c2, c3) {
            if (c1.isnull || c2.isnull || c3.isnull) { return; }
            if (isBlack(c1) && isBlack(c2) && isBlack(c3)) {
                add_green(cell);
            }
            if (isGreen(c1) && isGreen(c2) && isGreen(c3)) {
                add_black(cell);
            }
        };
        if (cell.qsub === CQSUB.none && cell.qans === CQANS.none) {
            fn(offset(cell, -3, 0), offset(cell, -2, 0), offset(cell, -1, 0),);
            fn(offset(cell, -2, 0), offset(cell, -1, 0), offset(cell, 1, 0),);
            fn(offset(cell, -1, 0), offset(cell, 1, 0), offset(cell, 2, 0),);
            fn(offset(cell, 1, 0), offset(cell, 2, 0), offset(cell, 3, 0),);
            fn(offset(cell, 0, -3), offset(cell, 0, -2), offset(cell, 0, -1),);
            fn(offset(cell, 0, -2), offset(cell, 0, -1), offset(cell, 0, 1),);
            fn(offset(cell, 0, -1), offset(cell, 0, 1), offset(cell, 0, 2),);
            fn(offset(cell, 0, 1), offset(cell, 0, 2), offset(cell, 0, 3),);
        }
    }
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let qnum = room.top.qnum;
        if (qnum === CQNUM.none || qnum === CQNUM.quesmark) { continue; }
        let list = [];
        for (let j = 0; j < room.clist.length; j++) {
            list.push(room.clist[j]);
        }
        if (list.filter(c => isBlack(c)).length === qnum) {
            list.forEach(c => add_green(c));
        }
        if (qnum - list.filter(c => isBlack(c)).length ===
            list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) {
            list.forEach(c => add_black(c));
        }
    }
}

function KurodokoAssist() {
    GreenConnected();
    BlackNotAdjacent();
    SightNumber({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
    }
}

function HitoriAssist() {
    GreenConnected();
    BlackNotAdjacent();
    let uniq = new Map();
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        uniq.set(cell, true);
    }
    let fn = function (a) {
        let vis = new Map();
        for (let cell of a) {
            if (cell.qnum === CQNUM.none) continue;
            if (isGreen(cell)) vis.set(cell.qnum, cell);
        }
        for (let cell of a) {
            if (cell.qnum === CQNUM.none) continue;
            if (vis.has(cell.qnum)) add_black(cell);
        }

        let cnt = new Map();
        for (let cell of a) {
            if (cell.qnum === CQNUM.none || isBlack(cell)) continue;
            let c = cnt.has(cell.qnum) ? cnt.get(cell.qnum) : 0;
            c++;
            cnt.set(cell.qnum, c);
        }
        for (let cell of a) {
            if (cell.qnum === CQNUM.none || isBlack(cell)) continue;
            if (cnt.get(cell.qnum) >= 2) uniq.set(cell, false);
        }

        // aba
        for (let i = 0; i < a.length - 2; i++) {
            if (a[i].qnum === CQNUM.none || a[i].qnum !== a[i + 2].qnum) continue;
            add_green(a[i + 1]);
        }

        // a..aa
        for (let i = 0; i < a.length - 1; i++) {
            if (a[i].qnum === CQNUM.none || a[i].qnum !== a[i + 1].qnum) continue;
            for (let j = 0; j < a.length; j++) {
                if (j !== i && j !== i + 1 && a[j].qnum === a[i].qnum) add_black(a[j]);
            }
        }
    };
    for (let i = 0; i < board.rows; i++) {
        let a = [];
        for (let j = 0; j < board.cols; j++) {
            a.push(board.getc(2 * j + 1, 2 * i + 1));
        }
        fn(a);
    }
    for (let j = 0; j < board.cols; j++) {
        let a = [];
        for (let i = 0; i < board.rows; i++) {
            a.push(board.getc(2 * j + 1, 2 * i + 1));
        }
        fn(a);
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (uniq.get(cell)) add_green(cell);
    }
}

function CanalViewAssist() {
    CellConnected({
        isShaded: isBlack,
        isUnshaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        add_shaded: add_black,
        add_unshaded: add_dot,
    });
    SightNumber({
        isShaded: isBlack,
        isUnshaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        add_shaded: add_black,
        add_unshaded: add_dot,
    });
    No2x2Cell({
        isShaded: isBlack,
        add_unshaded: add_dot,
    });
}

function CaveAssist() {
    GreenConnected();
    CellConnected({
        isShaded: isBlack,
        isUnshaded: isGreen,
        add_shaded: add_black,
        add_unshaded: add_green,
        OutsideAsShaded: true,
    });
    SightNumber({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
    });
    NoCheckerCell({
        isShaded: isBlack,
        isUnshaded: isGreen,
        add_shaded: add_black,
        add_unshaded: add_green,
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
    }
}

function TapaAssist() {
    No2x2Cell({
        isShaded: isBlack,
        add_unshaded: add_dot,
    });
    CellConnected({
        isShaded: isBlack,
        isUnshaded: c => c.qsub === CQSUB.dot || c.qnums.length > 0,
        add_shaded: add_black,
        add_unshaded: add_dot,
    });
    let check = function (qnums, s) {
        if (s === "11111111") { return qnums.length === 1 && qnums[0] === 8 || qnums[0] === CQNUM.quesmark; }
        while (s[0] !== '0') {
            s = s.slice(1) + s[0];
        }
        s = s.split('0').filter(s => s.length > 0).map(s => s.length);
        if (s.length === 0) { s = [0]; }
        if (s.length !== qnums.length) { return false; }
        for (let i = 0; i < qnums.length; i++) {
            if (!s.includes(qnums[i])) { continue; }
            s.splice(s.indexOf(qnums[i]), 1);
        }
        return s.length === qnums.filter(n => n === CQNUM.quesmark).length;
    };
    let isEmpty = function (c) {
        return !c.isnull && c.qans === CQANS.none && c.qsub === CQSUB.none && c.qnums.length === 0;
    };
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnums.length === 0) { continue; }
        let list = [offset(cell, -1, -1), offset(cell, 0, -1), offset(cell, 1, -1), offset(cell, 1, 0),
        offset(cell, 1, 1), offset(cell, 0, 1), offset(cell, -1, 1), offset(cell, -1, 0)];
        let mask = parseInt(list.map(c => isEmpty(c) ? "1" : "0").join(""), 2);
        let blk = parseInt(list.map(c => isBlack(c) ? "1" : "0").join(""), 2);
        let setb = 0b11111111, setd = 0b00000000, n = 0;
        for (let j = mask; j >= 0; j--) {
            j &= mask;
            if (check(cell.qnums, (j | blk).toString(2).padStart(8, '0'))) {
                setb &= (j | blk);
                setd |= (j | blk);
                n++;
            }
        }
        if (n === 0) {
            add_black(cell);
            continue;
        }
        setb = setb.toString(2).padStart(8, '0');
        setd = setd.toString(2).padStart(8, '0');
        for (let j = 0; j < 8; j++) {
            if (setb[j] === '1') {
                add_black(list[j], true);
            }
            if (setd[j] === '0') {
                add_dot(list[j]);
            }
        }
    }
}

function LightandShadowAssist() {
    let add_black = function (c) {
        if (c.isnull || c.qans !== CQANS.none) { return; }
        if (step && flg) { return; }
        flg = 1;
        c.setQans(CQANS.black);
        c.draw();
    };
    let add_white = function (c) {
        if (c.isnull || c.qans !== CQANS.none) { return; }
        if (step && flg) { return; }
        flg = 1;
        c.setQans(CQANS.white);
        c.draw();
    };
    SizeRegion_Cell({
        isShaded: isBlack,
        isUnshaded: c => c.qans === CQANS.white,
        add_shaded: add_black,
        add_unshaded: add_white,
        NoUnshadedNum: false,
    });
    SizeRegion_Cell({
        isShaded: c => c.qans === CQANS.white,
        isUnshaded: isBlack,
        add_shaded: add_white,
        add_unshaded: add_black,
        NoUnshadedNum: false,
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none && cell.ques === 1) {
            add_black(cell);
        }
        if (cell.qnum !== CQNUM.none && cell.ques === 0) {
            add_white(cell);
        }
    }
}

function SlalomAssist() {
    SingleLoopInCell({
        isPassable: c => c.ques !== 1,
        isPass: c => c.bx === board.startpos.bx && c.by === board.startpos.by,
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.ques === 1) {
            fourside(add_cross, cell.adjborder);
        }
        if (cell.ques === CQUES.vgate && (cell.adjacent.top.isnull || cell.adjacent.top.ques !== CQUES.vgate)) {
            let list = [];
            let pcell = cell;
            while (!pcell.isnull && pcell.ques === CQUES.vgate) {
                add_cross(pcell.adjborder.top);
                add_cross(pcell.adjborder.bottom);
                list.push(pcell);
                pcell = pcell.adjacent.bottom;
            }
            if (list.filter(c => c.adjborder.left.line).length === 1) {
                list.forEach(c => add_cross(c.adjborder.left));
            }
            if (list.filter(c => c.adjborder.left.qsub !== BQSUB.cross).length === 1) {
                list.forEach(c => add_line(c.adjborder.left));
            }
        }
        if (cell.ques === CQUES.hgate && (cell.adjacent.left.isnull || cell.adjacent.left.ques !== CQUES.hgate)) {
            let list = [];
            let pcell = cell;
            while (!pcell.isnull && pcell.ques === CQUES.hgate) {
                add_cross(pcell.adjborder.left);
                add_cross(pcell.adjborder.right);
                list.push(pcell);
                pcell = pcell.adjacent.right;
            }
            if (list.filter(c => c.adjborder.top.line).length === 1) {
                list.forEach(c => add_cross(c.adjborder.top));
            }
            if (list.filter(c => c.adjborder.top.qsub !== BQSUB.cross).length === 1) {
                list.forEach(c => add_line(c.adjborder.top));
            }
        }
    }
}

function StarbattleAssist() {
    let add_cir = function (b) {
        if (b === undefined || b.isnull || b.line || b.qsub !== BQSUB.none) { return; }
        if (step && flg) { return; }
        b.setQsub(1);
        b.draw();
        flg |= b.qsub === BQSUB.cross;
    };
    let starcount = board.starCount.count;
    let add_star = add_black;
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let cellList = [];
        for (let j = 0; j < room.clist.length; j++) {
            cellList.push(room.clist[j]);
        }
        // finish room
        if (cellList.filter(c => c.qans === CQANS.star).length === starcount) {
            cellList.forEach(c => add_dot(c));
        }
        if (cellList.filter(c => c.qsub !== CQSUB.dot).length === starcount) {
            cellList.forEach(c => add_star(c));
        }
    }
    for (let i = 0; i < board.rows; i++) {
        let hcellList = [];
        let vcellList = [];
        for (let j = 0; j < board.cols; j++) {
            hcellList.push(board.getc(2 * i + 1, 2 * j + 1));
            vcellList.push(board.getc(2 * j + 1, 2 * i + 1));
        }
        // finish row/col
        if (hcellList.filter(c => c.qans === CQANS.star).length === starcount) {
            hcellList.forEach(c => add_dot(c));
        }
        if (hcellList.filter(c => c.qsub !== CQSUB.dot).length === starcount) {
            hcellList.forEach(c => add_star(c));
        }
        if (vcellList.filter(c => c.qans === CQANS.star).length === starcount) {
            vcellList.forEach(c => add_dot(c));
        }
        if (vcellList.filter(c => c.qsub !== CQSUB.dot).length === starcount) {
            vcellList.forEach(c => add_star(c));
        }
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qans === CQANS.star) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    add_dot(offset(cell, dx, dy));
                }
            }
        }
    }
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        if (cross.qsub !== 1) { continue; }
        for (let d = 0; d < 4; d++) {
            if (offset(cross, .5, .5, d).qsub === CQSUB.dot && offset(cross, -.5, .5, d).qsub === CQSUB.dot) {
                add_cir(offset(cross, 0, -.5, d));
                if (offset(cross, 0, -.5, d).qsub === 1) {
                    cross.setQsub(0);
                    cross.draw();
                }
            }
        }
    }
    for (let i = 0; i < board.border.length; i++) {
        let border = board.border[i];
        if (border.qsub !== 1) { continue; }
        if (border.isvert) {
            add_dot(offset(border, -.5, -1));
            add_dot(offset(border, +.5, -1));
            add_dot(offset(border, -.5, +1));
            add_dot(offset(border, +.5, +1));
        } else {
            add_dot(offset(border, -1, -.5));
            add_dot(offset(border, -1, +.5));
            add_dot(offset(border, +1, -.5));
            add_dot(offset(border, +1, +.5));
        }
        for (let j = 0; j <= 1; j++) {
            if (border.sidecell[j].qsub === CQSUB.dot) {
                add_star(border.sidecell[1 - j]);
            }
        }
    }
}

function CastleWallAssist() {
    SingleLoopInCell({
        isPassable: c => c.qnum === CQNUM.none,
    });
    // add invisible qsub at cross
    const INLOOP = 1, OUTLOOP = 2;
    let add_inout = function (cr, qsub) {
        if (cr.isnull || cr.qsub !== 0) { return; }
        cr.setQsub(qsub);
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none) {
            // add qsub around b/w clue
            if (cell.ques === CQUES.black || cell.ques === CQUES.white) {
                for (let d = 0; d < 4; d++) {
                    add_inout(offset(cell, .5, .5, d), (cell.ques === CQUES.black ? OUTLOOP : INLOOP));
                }
            }
            // finish clue
            if (cell.qnum !== CQNUM.quesmark) {
                let d = qdirremap(cell.qdir);
                let borderlist = [];
                let pcell = dir(cell.adjacent, d);
                let qnum = cell.qnum;
                while (!pcell.isnull && (pcell.qnum < 0 || pcell.qdir !== cell.qdir)) {
                    let b = dir(pcell.adjborder, d);
                    if (!b.isnull && b.sidecell[0].qnum === CQNUM.none && b.sidecell[1].qnum === CQNUM.none) {
                        borderlist.push(b);
                    }
                    pcell = dir(pcell.adjacent, d);
                }
                if (!pcell.isnull) {
                    qnum -= pcell.qnum;
                }
                if (borderlist.filter(b => b.line).length === qnum) {
                    borderlist.forEach(b => add_cross(b));
                }
                if (borderlist.filter(b => b.qsub === BQSUB.none).length === qnum) {
                    borderlist.forEach(b => add_line(b));
                }
            }
        }
    }
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        // outloop at side
        if (cross.bx === board.minbx || cross.bx === board.maxbx || cross.by === board.minby || cross.by === board.maxby) {
            add_inout(cross, OUTLOOP);
        }
        // no checker
        if (cross.qsub === 0) {
            let fn = function (cr, cr1, cr2, cr12) {
                if (cr1.isnull || cr2.isnull || cr12.isnull) { return; }
                if (cr1.qsub === 0 || cr2.qsub === 0 || cr12.qsub === 0) { return; }
                if (cr1.qsub === cr2.qsub && cr1.qsub !== cr12.qsub) {
                    add_inout(cr, cr1.qsub);
                }
            };
            for (let d = 0; d < 4; d++) {
                fn(cross, offset(cross, 1, 0, d), offset(cross, 0, 1, d), offset(cross, 1, 1, d));
            }
        }
        // add line between different i/o
        if (cross.qsub !== 0) {
            let fn = function (cr1, cr2, b) {
                if (cr1.isnull || cr2.isnull) { return; }
                if (cr1.qsub === 0 || cr2.qsub === 0) { return; }
                if (cr1.qsub === cr2.qsub) {
                    add_cross(b);
                }
                if (cr1.qsub !== cr2.qsub) {
                    add_line(b);
                }
            };
            for (let d = 0; d < 4; d++) {
                fn(cross, offset(cross, 1, 0, d), offset(cross, .5, 0, d));
            }
        }
        // extend i/o through cross/line
        if (cross.qsub !== 0) {
            let fn = function (cr1, cr2, b) {
                if (cr2.isnull) { return; }
                if (b.isnull || b.qsub === BQSUB.cross || b.sidecell[0].qnum !== CQNUM.none || b.sidecell[1].qnum !== CQNUM.none) {
                    add_inout(cr2, cr1.qsub);
                }
                if (!b.isnull && b.line) {
                    add_inout(cr2, INLOOP + OUTLOOP - cr1.qsub);
                }
            };
            for (let d = 0; d < 4; d++) {
                fn(cross, offset(cross, 1, 0, d), offset(cross, .5, 0, d));
            }
        }
    }
}

function NurimisakiAssist() {
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && c.qsub === CQSUB.none && c.qans === CQANS.none;
    let isDot = c => !c.isnull && c.qsub === CQSUB.dot && c.qnum === CQNUM.none;
    let isDotEmpty = c => isEmpty(c) || isDot(c);
    let isBorderBlack = c => c.isnull || isBlack(c);
    let isConnectBlack = c => isBorderBlack(c) || c.qnum !== CQNUM.none;
    let isCircle = c => !c.isnull && c.qnum !== CQNUM.none;
    let isDotCircle = c => isDot(c) || isCircle(c);

    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let blackcnt = 0;
        let dotcnt = 0;
        fourside(c => {
            if (isBorderBlack(c)) { blackcnt++; }
            if (isDot(c)) { dotcnt++; }
        }, cell.adjacent);

        // no clue pattern

        // add dot
        if (isEmpty(cell)) {
            for (let d = 0; d < 4; d++) {
                // cannot place black with 2x2 black rule
                if (isEmpty(offset(cell, 0, -1, d)) && isBlack(offset(cell, 1, 0, d)) && isBlack(offset(cell, 1, -1, d)) &&
                    (isBorderBlack(offset(cell, 0, -2, d)) || isBorderBlack(offset(cell, -1, -1, d)))) {
                    add_dot(cell);
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isBlack(offset(cell, -1, 0, d)) && isBlack(offset(cell, -1, -1, d)) &&
                    (isBorderBlack(offset(cell, 0, -2, d)) || isBorderBlack(offset(cell, 1, -1, d)))) {
                    add_dot(cell);
                }
                else if (isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 0, -1, d)) && isBlack(offset(cell, 1, -1, d)) &&
                    (isBorderBlack(offset(cell, 2, 0, d)) || isBorderBlack(offset(cell, 1, 1, d))) &&
                    (isBorderBlack(offset(cell, 0, -2, d)) || isBorderBlack(offset(cell, -1, -1, d)))) {
                    add_dot(cell);
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, -1, d)) && isBlack(offset(cell, 1, 0, d)) &&
                    isBorderBlack(offset(cell, -1, -1, d)) && isBorderBlack(offset(cell, 0, -2, d)) && offset(cell, 1, -2, d).isnull) {
                    add_dot(cell);
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, -1, d)) && isBlack(offset(cell, -1, 0, d)) &&
                    isBorderBlack(offset(cell, 1, -1, d)) && isBorderBlack(offset(cell, 0, -2, d)) && offset(cell, -1, -2, d).isnull) {
                    add_dot(cell);
                }
                // cannot place black with 2x2 dot rule
                else if (isBlack(offset(cell, 1, 0, d)) && isBlack(offset(cell, 1, 1, d)) && isDot(offset(cell, -1, 2, d)) &&
                    isEmpty(offset(cell, 0, 1, d)) && isDotEmpty(offset(cell, -1, 1, d)) && isDotEmpty(offset(cell, 0, 2, d))) {
                    add_dot(cell);
                }
                else if (isBlack(offset(cell, -1, 0, d)) && isBlack(offset(cell, -1, 1, d)) && isDot(offset(cell, 1, 2, d)) &&
                    isEmpty(offset(cell, 0, 1, d)) && isDotEmpty(offset(cell, 1, 1, d)) && isDotEmpty(offset(cell, 0, 2, d))) {
                    add_dot(cell);
                }
                // cannot place black with 2x2 black rule and 2x2 dot rule
                else if (isDotEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 0, -2, d)) &&
                    isBlack(offset(cell, 1, -1, d)) && isBlack(offset(cell, 1, -2, d)) && isBorderBlack(offset(cell, 0, -3, d))) {
                    add_dot(cell);
                }
                else if (isDotEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 0, -2, d)) &&
                    isBlack(offset(cell, -1, -1, d)) && isBlack(offset(cell, -1, -2, d)) && isBorderBlack(offset(cell, 0, -3, d))) {
                    add_dot(cell);
                }
                else if (isDotEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, -1, -1, d)) &&
                    isBlack(offset(cell, 0, -1, d)) && isBorderBlack(offset(cell, -1, 1, d)) && isBorderBlack(offset(cell, -1, -2, d))) {
                    add_dot(cell);
                }
                else if (isDotEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isBlack(offset(cell, 0, -1, d)) && isBorderBlack(offset(cell, 1, 1, d)) && isBorderBlack(offset(cell, 1, -2, d))) {
                    add_dot(cell);
                }
                // cannot place black with 2x3 border pattern
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, -1, d)) && isEmpty(offset(cell, 2, -1, d)) &&
                    isDotEmpty(offset(cell, 1, 0, d)) && isDotEmpty(offset(cell, 2, 0, d)) &&
                    isBorderBlack(offset(cell, -1, -1, d)) && isBorderBlack(offset(cell, 3, -1, d)) &&
                    isBorderBlack(offset(cell, 3, 0, d)) && offset(cell, 0, -2, d).isnull) {
                    add_dot(cell);
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, -1, d)) && isEmpty(offset(cell, -2, -1, d)) &&
                    isDotEmpty(offset(cell, -1, 0, d)) && isDotEmpty(offset(cell, -2, 0, d)) &&
                    isBorderBlack(offset(cell, 1, -1, d)) && isBorderBlack(offset(cell, -3, -1, d)) &&
                    isBorderBlack(offset(cell, -3, 0, d)) && offset(cell, 0, -2, d).isnull) {
                    add_dot(cell);
                }
            }
        }
        if (isDot(cell)) {
            // dot cannot be deadend
            if (blackcnt === 2) {
                fourside(add_dot, cell.adjacent);
            }
            for (let d = 0; d < 4; d++) {
                // avoid 2x2 dot
                if (isBorderBlack(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                    isEmpty(offset(cell, -1, 0, d)) && isDot(offset(cell, 1, 1, d))) {
                    add_dot(offset(cell, -1, 0, d));
                }
                else if (isBorderBlack(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                    isEmpty(offset(cell, 1, 0, d)) && isDot(offset(cell, -1, 1, d))) {
                    add_dot(offset(cell, 1, 0, d));
                }
                // dot cannot be deadend with 2x2 dot rule
                else if (isBorderBlack(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isBorderBlack(offset(cell, 2, 0, d)) &&
                    isBorderBlack(offset(cell, 1, -1, d)) && isEmpty(offset(cell, -1, 0, d))) {
                    add_dot(offset(cell, -1, 0, d));
                }
                else if (isBorderBlack(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, 0, d)) && isBorderBlack(offset(cell, -2, 0, d)) &&
                    isBorderBlack(offset(cell, -1, -1, d)) && isEmpty(offset(cell, 1, 0, d))) {
                    add_dot(offset(cell, 1, 0, d));
                }
            }
        }

        // add black
        if (isEmpty(cell)) {
            // black deadend
            if (blackcnt >= 3) {
                add_black(cell);
            }
            for (let d = 0; d < 4; d++) {
                // cannot dot with 2x2 dot rule
                if (isBorderBlack(offset(cell, -1, 0, d)) && isBorderBlack(offset(cell, 2, 0, d)) && isEmpty(offset(cell, 1, 0, d)) &&
                    offset(cell, 0, -1, d).isnull && offset(cell, 1, -1, d).isnull) {
                    add_black(cell);
                }
                else if (isBorderBlack(offset(cell, 1, 0, d)) && isBorderBlack(offset(cell, 0, -1, d)) && isDot(offset(cell, -1, 1, d)) &&
                    isDotEmpty(offset(cell, -1, 0, d)) && isDotEmpty(offset(cell, 0, 1, d))) {
                    add_black(cell);
                }
            }
        }

        // clue pattern

        // any circle clue
        if (cell.qnum !== CQNUM.none) {
            // clue deadend check
            if (blackcnt === 3) {
                fourside(add_dot, cell.adjacent);
            }
            else if (dotcnt === 1) {
                fourside(add_black, cell.adjacent);
            }
            for (let d = 0; d < 4; d++) {
                // avoid 2x2 black pattern
                if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isBlack(offset(cell, 0, -2, d)) && isBlack(offset(cell, 1, -2, d))) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isBlack(offset(cell, 2, 0, d)) && isBlack(offset(cell, 2, -1, d))) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isEmpty(offset(cell, 0, -2, d)) && isBlack(offset(cell, 1, -2, d)) &&
                    (isBorderBlack(offset(cell, 0, -3, d)) || isBorderBlack(offset(cell, -1, -2, d)))) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isEmpty(offset(cell, 2, 0, d)) && isBlack(offset(cell, 2, -1, d)) &&
                    (isBorderBlack(offset(cell, 3, 0, d)) || isBorderBlack(offset(cell, 2, 1, d)))) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                // avoid 2x2 black and 2x2 dot apttern
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isDotEmpty(offset(cell, 1, -1, d)) &&
                    isEmpty(offset(cell, 1, -2, d)) && isBlack(offset(cell, 0, -2, d)) && isBorderBlack(offset(cell, 1, -3, d))) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isDotEmpty(offset(cell, 1, -1, d)) &&
                    isEmpty(offset(cell, 2, -1, d)) && isBlack(offset(cell, 2, 0, d)) && isBorderBlack(offset(cell, 3, -1, d))) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                // avoid border 2x2 black
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isDotEmpty(offset(cell, 2, 0, d)) && isEmpty(offset(cell, 2, -1, d)) && isBorderBlack(offset(cell, 3, 0, d)) &&
                    isBorderBlack(offset(cell, 3, -1, d)) && offset(cell, 0, -2, d).isnull) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isDotEmpty(offset(cell, 0, -2, d)) && isEmpty(offset(cell, 1, -2, d)) && isBorderBlack(offset(cell, 0, -3, d)) &&
                    isBorderBlack(offset(cell, 1, -3, d)) && offset(cell, 2, 0, d).isnull) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                // avoid border 2x3 pattern
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isDotEmpty(offset(cell, 2, 0, d)) && isDotEmpty(offset(cell, 2, -1, d)) && isDotEmpty(offset(cell, 3, 0, d)) &&
                    isEmpty(offset(cell, 3, -1, d)) && isBorderBlack(offset(cell, 4, 0, d)) &&
                    isBorderBlack(offset(cell, 4, -1, d)) && offset(cell, 0, -2, d).isnull) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
                else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                    isDotEmpty(offset(cell, 0, -2, d)) && isDotEmpty(offset(cell, 1, -2, d)) && isDotEmpty(offset(cell, 0, -3, d)) &&
                    isEmpty(offset(cell, 1, -3, d)) && isBorderBlack(offset(cell, 0, -4, d)) &&
                    isBorderBlack(offset(cell, 1, -4, d)) && offset(cell, 2, 0, d).isnull) {
                    add_black(offset(cell, 0, 1, d));
                    add_black(offset(cell, -1, 0, d));
                }
            }
        }
        if (isEmpty(cell)) {
            for (let d = 0; d < 4; d++) {
                // cannot place black with 2x2 white
                if (isBlack(offset(cell, 1, 0, d)) && isBlack(offset(cell, 1, 1, d)) && isCircle(offset(cell, -1, 2, d)) &&
                    isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, -1, 1, d)) && isEmpty(offset(cell, 0, 2, d))) {
                    add_dot(cell);
                }
                else if (isBlack(offset(cell, -1, 0, d)) && isBlack(offset(cell, -1, 1, d)) && isCircle(offset(cell, 1, 2, d)) &&
                    isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, 1, 1, d)) && isEmpty(offset(cell, 0, 2, d))) {
                    add_dot(cell);
                }
                // cannot place dot with 2x2 white
                else if (isBorderBlack(offset(cell, 1, 0, d)) && isBorderBlack(offset(cell, 0, -1, d)) && isCircle(offset(cell, -1, 1, d)) &&
                    isEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, 0, 1, d))) {
                    add_black(cell);
                }
            }
        }
        if (isDot(cell)) {
            for (let d = 0; d < 4; d++) {
                // avoid 2x2 white
                if (isBorderBlack(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                    isDotEmpty(offset(cell, -1, 0, d)) && isCircle(offset(cell, 1, 1, d))) {
                    add_dot(offset(cell, -1, 0, d));
                    add_black(offset(cell, 2, 1, d));
                    add_black(offset(cell, 1, 2, d));
                }
                else if (isBorderBlack(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                    isDotEmpty(offset(cell, 1, 0, d)) && isCircle(offset(cell, -1, 1, d))) {
                    add_dot(offset(cell, 1, 0, d));
                    add_black(offset(cell, -2, 1, d));
                    add_black(offset(cell, -1, 2, d));
                }
            }
        }

        // circle clue with number
        if (cell.qnum >= 2) {
            for (let d = 0; d < 4; d++) {
                if (isEmpty(offset(cell, 0, -1, d))) {
                    // avoid eyesight too long
                    if (isDotCircle(offset(cell, 0, -cell.qnum, d))) {
                        add_black(offset(cell, 0, -1, d));
                    }
                    // situation for clue at the end
                    else if (isCircle(offset(cell, 0, -cell.qnum + 1, d)) &&
                        offset(cell, 0, -cell.qnum + 1, d).qnum !== CQNUM.circle && offset(cell, 0, -cell.qnum + 1, d).qnum !== cell.qnum) {
                        add_black(offset(cell, 0, -1, d));
                    }
                }
                if (isEmpty(offset(cell, 0, -1, d))) {
                    for (let j = 2; j < cell.qnum; j++) {
                        // eyesight not enough long
                        if (j !== cell.qnum - 1 && isConnectBlack(offset(cell, 0, -j, d))) {
                            add_black(offset(cell, 0, -1, d));
                            break;
                        }
                        if (isBorderBlack(offset(cell, 0, -j, d))) {
                            add_black(offset(cell, 0, -1, d));
                            break;
                        }
                        // avoid 2x2 dot
                        if (isDot(offset(cell, 1, -j + 1, d)) && isDot(offset(cell, 1, -j, d))) {
                            add_black(offset(cell, 0, -1, d));
                            break;
                        }
                        if (isDot(offset(cell, -1, -j + 1, d)) && isDot(offset(cell, -1, -j, d))) {
                            add_black(offset(cell, 0, -1, d));
                            break;
                        }
                    }
                }
                // extend eyesight
                if (isDot(offset(cell, 0, -1, d))) {
                    for (let j = 2; j < cell.qnum; j++) {
                        add_dot(offset(cell, 0, -j, d));
                    }
                    add_black(offset(cell, 0, -cell.qnum, d));
                }
            }
        }
    }
    // 2x2 rules
    No2x2Cell({
        isShaded: isBlack,
        add_unshaded: add_dot,
    });
    No2x2Cell({
        isShaded: c => c.qsub === CQSUB.dot,
        add_unshaded: add_black,
    });
    CellConnected({
        isShaded: isDotCircle,
        isUnshaded: isBlack,
        add_shaded: add_dot,
        add_unshaded: add_black,
    });
    CellConnected({
        isShaded: isDot,
        isUnshaded: isConnectBlack,
        add_shaded: add_dot,
        add_unshaded: add_black,
    });
}

function ChocoBananaAssist() {
    SizeRegion_Cell({
        isShaded: isBlack,
        isUnshaded: isGreen,
        add_shaded: add_black,
        add_unshaded: add_green,
        OneNumPerRegion: false,
        NoUnshadedNum: false,
    });
    SizeRegion_Cell({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
        OneNumPerRegion: false,
        NoUnshadedNum: false,
    });
    RectRegion_Cell({
        isShaded: isBlack,
        isUnshaded: isGreen,
        add_shaded: add_black,
        add_unshaded: add_green,
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum === 1 || cell.qnum === 2) {
            add_black(cell);
        }
        // non-rect
        if (isGreen(cell)) {
            let templist = [offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, -1, 0), offset(cell, 0, -1)];
            templist = templist.filter(c => !c.isnull && c.qans !== CQANS.black);
            if (templist.length === 1) {
                let ncell = templist[0];
                add_green(ncell);
                let templist2 = [offset(ncell, 1, 0), offset(ncell, 0, 1), offset(ncell, -1, 0), offset(ncell, 0, -1)];
                templist2 = templist2.filter(c => !c.isnull && c.qans !== CQANS.black && c !== cell);
                if (templist2.length === 1) {
                    add_green(templist2[0]);
                }
            }
        }
    }
}

function CreekAssist() {
    GreenConnected();
    let dotcnt = 0;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        dotcnt += cell.qsub === CQSUB.dot;
    }
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        let list = [board.getc(cross.bx - 1, cross.by - 1), board.getc(cross.bx - 1, cross.by + 1),
        board.getc(cross.bx + 1, cross.by - 1), board.getc(cross.bx + 1, cross.by + 1)];
        list = list.filter(c => !c.isnull);
        if (cross.qnum >= 0) {
            if (list.filter(c => isBlack(c)).length === cross.qnum) {
                list.forEach(c => add_dot(c));
            }
            if (list.filter(c => c.qsub !== CQSUB.dot).length === cross.qnum) {
                list.forEach(c => add_black(c));
            }
        }
        for (let d = 0; d < 4; d++) {
            // + + + +    + + + +
            //             ·   █ 
            // + 1 3 + -> + 1 3 +
            //             ·   █ 
            // + + + +    + + + +
            if (cross.qnum === 1 && offset(cross, 1, 0, d).qnum === 3) {
                add_dot(offset(cross, -.5, -.5, d));
                add_dot(offset(cross, -.5, +.5, d));
                add_black(offset(cross, 1.5, -.5, d));
                add_black(offset(cross, 1.5, +.5, d));
            }
            // + + + +    + + + +
            //                   
            // + 3 + +    + 3 + +
            //         ->    █   
            // + + 3 +    + + 3 +
            //                   
            // + + + +    + + + +
            if (cross.qnum === 3 && offset(cross, 1, 1, d).qnum === 3 && dotcnt > 0) {
                add_black(offset(cross, .5, .5, d));
            }
        }
    }
}

function SlantAssist() {
    let add_slash = function (c, qans) {
        if (c === undefined || c.isnull || c.qans !== CQANS.none) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQans(qans % 2 === 0 ? CQANS.lslash : CQANS.rslash);
        c.draw();
    };
    let isNotSide = function (c) {
        return c.bx > board.minbx && c.bx < board.maxbx && c.by > board.minby && c.by < board.maxby;
    }
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        let adjcellList = [[board.getc(cross.bx - 1, cross.by - 1), CQANS.rslash, CQANS.lslash],
        [board.getc(cross.bx - 1, cross.by + 1), CQANS.lslash, CQANS.rslash],
        [board.getc(cross.bx + 1, cross.by - 1), CQANS.lslash, CQANS.rslash],
        [board.getc(cross.bx + 1, cross.by + 1), CQANS.rslash, CQANS.lslash]];
        adjcellList = adjcellList.filter(c => !c[0].isnull);
        // finish clue
        if (cross.qnum >= 0) {
            if (adjcellList.filter(c => c[0].qans === c[1]).length === cross.qnum) {
                adjcellList.forEach(c => add_slash(c[0], c[2]));
            }
            if (adjcellList.filter(c => c[0].qans !== c[2]).length === cross.qnum) {
                adjcellList.forEach(c => add_slash(c[0], c[1]));
            }
        }
        for (let d = 0; d < 4; d++) {
            // + + + +    + + + +
            //                   
            // + 1 + +    + 1 + +
            //         ->    ╱   
            // + + 1 +    + + 1 +
            //                   
            // + + + +    + + + +
            if (cross.qnum === 1 && isNotSide(cross)) {
                let cross2 = offset(cross, 1, 1, d);
                if (cross2.qnum === 1 && isNotSide(cross2)) {
                    add_slash(offset(cross, .5, .5, d), CQANS.lslash + d);
                }
            }
            // + + + +    + + + +
            //             ╱   ╲ 
            // + 1 1 + -> + 1 1 +
            //             ╲   ╱ 
            // + + + +    + + + +
            if (cross.qnum === 1) {
                if (offset(cross, 0, 1, d).isnull || offset(cross, 0, -1, d).isnull) { continue; }
                if (!offset(cross, 1, 0, d).isnull && offset(cross, 1, 0, d).qnum === 1) {
                    add_slash(offset(cross, -0.5, -.5, d), CQANS.lslash + d);
                    add_slash(offset(cross, -0.5, +.5, d), CQANS.rslash + d);
                    add_slash(offset(cross, +1.5, -.5, d), CQANS.rslash + d);
                    add_slash(offset(cross, +1.5, +.5, d), CQANS.lslash + d);
                }
            }
            // + + + +    + + + +
            //             ╲   ╱ 
            // + 3 3 + -> + 3 3 +
            //             ╱   ╲ 
            // + + + +    + + + +
            if (cross.qnum === 3) {
                if (!offset(cross, 1, 0, d).isnull && offset(cross, 1, 0, d).qnum === 3 && isNotSide(offset(cross, 1, 0, d))) {
                    add_slash(offset(cross, -0.5, -.5, d), CQANS.rslash + d);
                    add_slash(offset(cross, -0.5, +.5, d), CQANS.lslash + d);
                    add_slash(offset(cross, +1.5, -.5, d), CQANS.lslash + d);
                    add_slash(offset(cross, +1.5, +.5, d), CQANS.rslash + d);
                }
            }
        }
    }
    // no loop
    // + + +    + + +
    //  / \      / \ 
    // + + + -> + + +
    //  \        \ \ 
    // + + +    + + +
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qans !== CQANS.none) { continue; }
        let cross1, cross2;
        cross1 = board.getobj(cell.bx - 1, cell.by - 1);
        cross2 = board.getobj(cell.bx + 1, cell.by + 1);
        if (cross1.path !== null && cross1.path === cross2.path) {
            add_slash(cell, CQANS.lslash);
        }
        cross1 = board.getobj(cell.bx - 1, cell.by + 1);
        cross2 = board.getobj(cell.bx + 1, cell.by - 1);
        if (cross1.path !== null && cross1.path === cross2.path) {
            add_slash(cell, CQANS.rslash);
        }
    }
}

function NuribouAssist() {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
        // surrounded white cell
        let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
        if (cell.qnum === CQNUM.none && templist.filter(c => isBlack(c)).length === 4) {
            add_black(cell);
        }
    }
    flg = 0;
    StripRegion_cell({
        isShaded: isBlack,
        add_unshaded: add_green,
    });
    SizeRegion_Cell({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: c => add_black(c, true),
    });
    // unreachable cell
    {
        let list = [];
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum !== CQNUM.none) {
                list.push(cell);
                if (cell.qnum === CQNUM.quesmark) { continue; }
                for (let dx = -cell.qnum + 1; dx <= cell.qnum - 1; dx++) {
                    for (let dy = -cell.qnum + Math.abs(dx) + 1; dy <= cell.qnum - Math.abs(dx) - 1; dy++) {
                        let c = offset(cell, dx, dy);
                        if (c.isnull || list.includes(c)) { continue; }
                        list.push(c);
                    }
                }
            }
        }
        if (!list.some(c => c.qnum === CQNUM.quesmark)) {
            for (let i = 0; i < board.cell.length; i++) {
                let cell = board.cell[i];
                if (!list.includes(cell)) {
                    add_black(cell);
                }
            }
        }
    }
}

function NurikabeAssist() {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        // surrounded white cell
        let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
        if (cell.qnum === CQNUM.none && templist.filter(c => isBlack(c)).length === 4) {
            add_black(cell);
        }
    }
    flg = 0;
    CellConnected({
        isShaded: isBlack,
        isUnshaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        add_shaded: c => add_black(c, true),
        add_unshaded: add_dot,
    });
    No2x2Cell({
        isShaded: isBlack,
        add_unshaded: add_dot,
    });
    SizeRegion_Cell({
        isShaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        isUnshaded: isBlack,
        add_shaded: add_dot,
        add_unshaded: c => add_black(c, true),
    });
    // unreachable cell
    {
        let list = [];
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum !== CQNUM.none) {
                list.push(cell);
                if (cell.qnum === CQNUM.quesmark) { continue; }
                for (let dx = -cell.qnum + 1; dx <= cell.qnum - 1; dx++) {
                    for (let dy = -cell.qnum + Math.abs(dx) + 1; dy <= cell.qnum - Math.abs(dx) - 1; dy++) {
                        let c = offset(cell, dx, dy);
                        if (c.isnull || list.includes(c)) { continue; }
                        list.push(c);
                    }
                }
            }
        }
        if (!list.some(c => c.qnum === CQNUM.quesmark)) {
            for (let i = 0; i < board.cell.length; i++) {
                let cell = board.cell[i];
                if (!list.includes(cell)) {
                    add_black(cell);
                }
            }
        }
    }
}

function GuideArrowAssist() {
    BlackNotAdjacent();
    GreenConnected();
    GreenNoLoopInCell();
    let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell === goalcell) {
            add_green(cell);
            continue;
        }
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
            if (cell.qnum !== CQNUM.quesmark) {
                let d = qdirremap(cell.qnum);
                add_green(dir(cell.adjacent, d));
            }
            continue;
        }
    }
    // direction consistency
    {
        let vis = new Map();
        let dfs = function (c, d) {
            if (vis.has(c)) return;
            vis.set(c, d);
            for (let d1 = 0; d1 < 4; d1++) {
                if (d1 === d) continue;
                let c1 = dir(c.adjacent, d1);
                if (c1 === undefined || c1.isnull || c1.qsub !== CQSUB.green) continue;
                dfs(c1, (d1 + 2) % 4);
            }
        };
        dfs(goalcell, -1);
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum === CQNUM.none || cell.qnum === CQNUM.quesmark) continue;
            dfs(cell, qdirremap(cell.qnum));
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            if (cell.qsub !== CQSUB.none || cell.qans !== CQANS.none) continue;

            let cnt = 0;
            fourside(c => {
                if (isGreen(c) && vis.has(c)) { cnt++; }
            }, adjcell);
            if (cnt >= 2) add_black(cell);
        }
    }
    // single out
    {
        let vis = new Map();
        vis.set(goalcell, -1);
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let d = (function () {
                if (cell.qnum === CQNUM.none || cell.qnum === CQNUM.quesmark) {
                    let cnt = 0;
                    let dd = -1;
                    for (let d1 = 0; d1 < 4; d1++) {
                        let c1 = dir(cell.adjacent, d1);
                        if (c1 === undefined || c1.isnull || isBlack(c1)) continue;
                        cnt++;
                        dd = d1;
                    }
                    if (cnt === 1) return dd;
                    return -1;
                }
                return qdirremap(cell.qnum);;
            })();
            if (d === -1) continue;
            while (true) {
                if (vis.has(cell)) break;
                vis.set(cell, d);
                cell = dir(cell.adjacent, d);
                add_green(cell);
                let cnt = 0;
                let dd = -1;
                for (let d1 = 0; d1 < 4; d1++) {
                    let c1 = dir(cell.adjacent, d1);
                    if (c1 === undefined || c1.isnull || isBlack(c1)) continue;
                    if (vis.has(c1) && vis.get(c1) === (d1 + 2) % 4) continue;
                    cnt++;
                    dd = d1;
                }
                if (cnt !== 1) break;
                d = dd;
            }
        }
    }
}

function YinyangAssist() {
    let add_color = function (c, color) {
        if (c === undefined || c.isnull || c.anum !== CANUM.none || color !== CANUM.wcir && color !== CANUM.bcir) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setAnum(color);
        c.draw();
    };
    let add_black = function (c) {
        add_color(c, CANUM.bcir);
    };
    let add_white = function (c) {
        add_color(c, CANUM.wcir);
    };
    CellConnected({
        isShaded: c => c.anum === CANUM.wcir,
        isUnshaded: c => c.anum === CANUM.bcir,
        add_shaded: add_white,
        add_unshaded: add_black,
    });
    CellConnected({
        isShaded: c => c.anum === CANUM.bcir,
        isUnshaded: c => c.anum === CANUM.wcir,
        add_shaded: add_black,
        add_unshaded: add_white,
    });
    No2x2Cell({
        isShaded: c => c.anum === CANUM.wcir,
        add_unshaded: add_black,
    });
    No2x2Cell({
        isShaded: c => c.anum === CANUM.bcir,
        add_unshaded: add_white,
    });
    NoCheckerCell({
        isShaded: c => c.anum === CANUM.wcir,
        isUnshaded: c => c.anum === CANUM.bcir,
        add_shaded: add_white,
        add_unshaded: add_black,
    });
    // cell at side is grouped when both sides are even
    if (board.rows % 2 === 0 && board.cols % 2 === 0) {
        for (let i = 1; i + 1 < board.rows; i += 2) {
            let cell1 = board.getc(board.minbx + 1, 2 * i + 1);
            let cell2 = board.getc(board.minbx + 1, 2 * i + 3);
            if (cell1.anum !== CANUM.none || cell2.anum !== CANUM.none) {
                add_color(cell1, cell2.anum);
                add_color(cell2, cell1.anum);
            }
            cell1 = board.getc(board.maxbx - 1, 2 * i + 1);
            cell2 = board.getc(board.maxbx - 1, 2 * i + 3);
            if (cell1.anum !== CANUM.none || cell2.anum !== CANUM.none) {
                add_color(cell1, cell2.anum);
                add_color(cell2, cell1.anum);
            }
        }
        for (let i = 1; i + 1 < board.cols; i += 2) {
            let cell1 = board.getc(2 * i + 1, board.minby + 1);
            let cell2 = board.getc(2 * i + 3, board.minby + 1);
            if (cell1.anum !== CANUM.none || cell2.anum !== CANUM.none) {
                add_color(cell1, cell2.anum);
                add_color(cell2, cell1.anum);
            }
            cell1 = board.getc(2 * i + 1, board.maxby - 1);
            cell2 = board.getc(2 * i + 3, board.maxby - 1);
            if (cell1.anum !== CANUM.none || cell2.anum !== CANUM.none) {
                add_color(cell1, cell2.anum);
                add_color(cell2, cell1.anum);
            }
        }
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none) {
            add_color(cell, cell.qnum);
        }
        // ○ ●    ○●●
        // ○ ○ -> ○ ○
        if (cell.anum === CANUM.none) {
            for (let d = 0; d < 4; d++) {
                let templist = [offset(cell, 1, -1, d), offset(cell, 1, 1, d), offset(cell, 0, -1, d), offset(cell, 0, 1, d)];
                if (!templist.some(c => c.isnull || c.anum === CANUM.none) &&
                    templist[0].anum === templist[1].anum && templist[2].anum !== templist[3].anum) {
                    add_color(cell, CANUM.bcir + CANUM.wcir - templist[0].anum);
                }
            }
        }
    }
    // outside
    {
        let firstcell = board.cell[0];
        let cellList = [];
        for (let j = 0; j < board.rows; j++) { cellList.push(offset(firstcell, 0, j)); }
        for (let i = 1; i < board.cols - 1; i++) { cellList.push(offset(firstcell, i, board.rows - 1)); }
        for (let j = board.rows - 1; j >= 0; j--) { cellList.push(offset(firstcell, board.cols - 1, j)); }
        for (let i = board.cols - 2; i > 0; i--) { cellList.push(offset(firstcell, i, 0)); }
        let len = cellList.length;
        if (cellList.some(c => c.anum === CANUM.bcir) && cellList.some(c => c.anum === CANUM.wcir)) {
            for (let i = 0; i < len; i++) {
                if (cellList[i].anum === CANUM.none || cellList[(i + 1) % len].anum !== CANUM.none) { continue; }
                for (let j = (i + 1) % len; j != i; j = (j + 1) % len) {
                    if (cellList[j].anum === CANUM.bcir + CANUM.wcir - cellList[i].anum) { break; }
                    if (cellList[j].anum === CANUM.none) { continue; }
                    if (cellList[j].anum === cellList[i].anum) {
                        for (let k = i; k != j; k = (k + 1) % len) {
                            add_color(cellList[k], cellList[i].anum);
                        }
                    }
                }
            }
        }
    }
}

function NuriMazeAssist() {
    No2x2Black();
    No2x2Green();
    CellConnected({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
        isLinked: (c, nb, nc) => c.room === nc.room,
    });
    CellConnected({
        isShaded: function (c) {
            let startcell = board.getc(board.startpos.bx, board.startpos.by);
            let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
            return c === startcell || c === goalcell || c.ques === CQUES.cir;
        },
        isUnshaded: c => isBlack(c) || c.ques === CQUES.tri,
        add_shaded: add_green,
        add_unshaded: () => { },
        isLinked: (c, nb, nc) => c.room === nc.room,
    });
    CellConnected({
        isShaded: c => {
            let startcell = board.getc(board.startpos.bx, board.startpos.by);
            let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
            if (c === startcell || c === goalcell) { return c.lcnt === 0; }
            return c.lcnt == 1;
        },
        isUnshaded: c => {
            let startcell = board.getc(board.startpos.bx, board.startpos.by);
            let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
            if (c === startcell || c === goalcell) { return c.lcnt === 1; }
            return c.lcnt === 2 || isBlack(c) || c.ques === CQUES.tri;
        },
        add_shaded: add_green,
        add_unshaded: () => { },
        isLinked: (c, nb, nc) => c.room === nc.room,
        cantDivideShade: n => n % 2 === 1,
        OnlyOneConnected: false,
    });
    let startcell = board.getc(board.startpos.bx, board.startpos.by);
    let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
    let circnt = 0;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        circnt += cell.ques === CQUES.cir;
    }
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let cellList = [];
        for (let j = 0; j < room.clist.length; j++) {
            cellList.push(room.clist[j]);
        }
        if (cellList.some(c => isGreen(c) || c.ques === CQUES.cir || c.ques === CQUES.tri || c.lcnt > 0) ||
            room === startcell.room || room === goalcell.room) {
            cellList.forEach(c => add_green(c));
            continue;
        }
        if (cellList.some(c => isBlack(c))) {
            cellList.forEach(c => add_black(c));
            continue;
        }
        let circnt1 = circnt, circnt2 = circnt;
        let templist = [];
        cellList.forEach(c => {
            let list = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 0, 1), offset(c, 1, 0)];
            list.forEach(c => {
                if (c.isnull || templist.includes(c)) { return; }
                templist.push(c);
            });
        });
        templist = templist.filter(c => isGreen(c));
        if (templist.length < 2) { continue; }
        // no loop
        let templist2 = templist.map(c => {
            let dfslist = [];
            let dfs = function (c) {
                if (c.isnull || c.qsub !== CQSUB.green || dfslist.includes(c)) { return; }
                dfslist.push(c);
                fourside(dfs, c.adjacent);
            };
            dfs(c);
            if (dfslist.some(c => c === startcell)) {
                circnt1 = dfslist.filter(c => c.ques === CQUES.cir).length;
            }
            if (dfslist.some(c => c === goalcell)) {
                circnt2 = dfslist.filter(c => c.ques === CQUES.cir).length;
            }
            return dfslist.filter(c => templist.includes(c)).length;
        });
        if (templist2.some(n => n > 1)) {
            cellList.forEach(c => add_black(c));
            continue;
        }
        // not enough cir
        if (circnt1 + circnt2 < circnt) {
            cellList.forEach(c => add_black(c));
            continue;
        }
        // no branch for line
        templist2 = templist.map(c => {
            let res = 0;
            let dfslist = [];
            let dfs = function (c) {
                if (c.isnull || c.qsub !== CQSUB.green || dfslist.includes(c)) { return; }
                if (c === startcell || c === goalcell || c.ques === CQUES.cir || c.lcnt > 0) {
                    res += c === startcell;
                    res += c === goalcell;
                    res += (c.ques === CQUES.cir && c.lcnt === 0);
                    res += c.lcnt;
                    res += (dfslist.some(c => c.ques === CQUES.tri) ? 2 : 0);
                    return;
                }
                dfslist.push(c);
                fourside(dfs, c.adjacent);
                dfslist.pop();
            }
            dfs(c);
            return Math.min(res, 2);
        });
        if (templist2.reduce((a, b) => a + b) > 2) {
            cellList.forEach(c => add_black(c));
            continue;
        }
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.ques === CQUES.cir) {
            let templist = [offset(cell, -1, 0), offset(cell, 1, 0), offset(cell, 0, -1), offset(cell, 0, 1)];
            templist = templist.filter(c => !c.isnull && c.qans !== CQANS.black);
            if (templist.length === 2) {
                templist.forEach(c => add_green(c));
            }
        }
        // surrounded by black
        {
            let templist = [offset(cell, -1, 0), offset(cell, 1, 0), offset(cell, 0, -1), offset(cell, 0, 1)];
            if (templist.filter(c => isBlack(c)).length === 4) {
                add_black(cell);
            }
        }
        // no 2*2
        {
            let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (!templist.some(c => c.isnull) && !templist.some(c => isGreen(c))) {
                let templist2 = templist.filter(c => !c.qans);
                if (templist2.length > 0 && !templist2.some(c => c.room !== templist2[0].room)) {
                    add_green(templist2[0]);
                }
            }
            if (!templist.some(c => c.qans)) {
                let templist2 = templist.filter(c => c.qsub !== CQSUB.green);
                if (templist2.length > 0 && !templist2.some(c => c.room !== templist2[0].room)) {
                    add_black(templist2[0]);
                }
            }
        }
    }
    // line
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjcell = cell.adjacent;
        let adjline = cell.adjborder;
        if (isBlack(cell) || cell.ques === CQUES.tri) {
            fourside(add_cross, adjline);
        }
        if (cell.qans !== CQANS.black) {
            let emptycnt = 0;
            let linecnt = 0;
            fourside((c, b) => {
                if (!c.isnull && b.qsub !== BQSUB.cross) { emptycnt++; }
                linecnt += b.line;
            }, adjcell, adjline);
            if (linecnt > 0) {
                add_green(cell);
            }
            // no branch
            if (linecnt === 2 || linecnt === 1 && (cell === startcell || cell === goalcell)) {
                fourside(add_cross, adjline);
            }
            // no deadend
            if (emptycnt === 1) {
                if (cell !== startcell && cell !== goalcell) {
                    fourside(add_cross, adjline);
                } else {
                    fourside((c, b) => {
                        if (!c.isnull && b.qsub !== BQSUB.cross) {
                            add_line(b);
                        }
                    }, adjcell, adjline);
                }
            }
            // 2 degree path
            if (emptycnt === 2 && cell !== startcell && cell !== goalcell && (linecnt === 1 || cell.ques === CQUES.cir)) {
                fourside((c, b) => {
                    add_line(b);
                    if (!b.isnull && b.line) {
                        add_green(c);
                    }
                }, adjcell, adjline);
            }
            // extend line
            if (linecnt === 1 && cell !== startcell && cell !== goalcell ||
                linecnt === 0 && (cell === startcell || cell === goalcell || cell.ques === CQUES.cir)) {
                let fn = function (c, b, list) {
                    if (c.isnull || c.qsub !== CQSUB.green || list.includes(c)) { return; }
                    if (b !== null && b.line) { return; }
                    list.push(c);
                    if (c.lcnt === 1 || c.ques === CQUES.cir || c === startcell || c === goalcell) {
                        for (let j = 1; j < list.length; j++) {
                            let cell1 = list[j - 1];
                            let cell2 = list[j];
                            let border = board.getb((cell1.bx + cell2.bx) / 2, (cell1.by + cell2.by) / 2);
                            add_line(border);
                            add_green(cell1);
                            add_green(cell2);
                        }
                    }
                    fn(c.adjacent.top, c.adjborder.top, list);
                    fn(c.adjacent.bottom, c.adjborder.bottom, list);
                    fn(c.adjacent.left, c.adjborder.left, list);
                    fn(c.adjacent.right, c.adjborder.right, list);
                    list.pop();
                }
                fn(cell, null, []);
            }
        }
    }
}

function AquapelagoAssist() {
    No2x2Green();
    BlackNotAdjacent();
    GreenConnected();
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum !== CQNUM.none) {
            add_black(cell);
        }
        if (cell.qnum > 0) {
            let templist = [];
            let fn = function (c) {
                if (c.qans !== CQANS.black) { return; }
                if (templist.includes(c)) { return; }
                templist.push(c);
                fn(offset(c, -1, -1));
                fn(offset(c, -1, +1));
                fn(offset(c, +1, -1));
                fn(offset(c, +1, +1));
            };
            fn(cell);
            if (templist.length === cell.qnum) {
                templist.forEach(c => {
                    add_green(offset(c, -1, -1));
                    add_green(offset(c, -1, +1));
                    add_green(offset(c, +1, -1));
                    add_green(offset(c, +1, +1));
                });
            }
            if (templist.length < cell.qnum) {
                let list = [];
                let fn = function (c) {
                    if (c.isnull || isBlack(c) || isGreen(c)) { return; }
                    if (list.includes(c)) { return; }
                    list.push(c);
                };
                templist.forEach(c => {
                    fn(offset(c, -1, -1));
                    fn(offset(c, -1, +1));
                    fn(offset(c, +1, -1));
                    fn(offset(c, +1, +1));
                });
                if (list.length === 1) {
                    add_black(list[0]);
                }
            }
        }
    }
}

function IcebarnAssist() {
    SingleLoopInCell();
    // add cross outside except IN and OUT
    {
        let inp = [board.arrowin.bx, board.arrowin.by];
        let outp = [board.arrowout.bx, board.arrowout.by];
        add_line(board.getb(inp[0], inp[1]));
        add_line(board.getb(outp[0], outp[1]));
        let minbx = board.minbx + 2;
        let minby = board.minby + 2;
        let maxbx = board.maxbx - 2;
        let maxby = board.maxby - 2;
        for (let j = minbx + 1; j < maxbx; j += 2) {
            add_cross(board.getb(j, minby));
            add_cross(board.getb(j, maxby));
        }
        for (let j = minby + 1; j < maxby; j += 2) {
            add_cross(board.getb(minbx, j));
            add_cross(board.getb(maxbx, j));
        }
    }
    for (let i = 0; i < board.border.length; i++) {
        let border = board.border[i];
        if (border.qdir != QDIR.none) {
            add_arrow(border, border.qdir + 10);   // from qdir to bqsub
            add_line(border);
        }
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjline = cell.adjborder;
        if (cell.ques === CQUES.ice) {
            for (let d = 0; d < 4; d++) {
                if (dir(adjline, d).qsub === BQSUB.cross) {
                    add_cross(dir(adjline, d + 2));
                }
                if (dir(adjline, d).line) {
                    add_line(dir(adjline, d + 2));
                    if (dir(adjline, d).qsub !== BQSUB.none) {
                        add_arrow(dir(adjline, d + 2), dir(adjline, d).qsub);
                    }
                }
            }
        }
        if (cell.lcnt === 2 && cell.ques !== CQUES.ice) {
            let templist = [[adjline.top, BQSUB.arrow_up, BQSUB.arrow_dn], [adjline.bottom, BQSUB.arrow_dn, BQSUB.arrow_up],
            [adjline.left, BQSUB.arrow_lt, BQSUB.arrow_rt], [adjline.right, BQSUB.arrow_rt, BQSUB.arrow_lt]];
            templist = templist.filter(b => b[0].line);
            if (templist.filter(b => b[0].qsub === BQSUB.none).length === 1) {
                if (templist[0][0].qsub !== BQSUB.none) {
                    templist = [templist[1], templist[0]];
                }
                if (templist[1][0].qsub === templist[1][1]) {
                    add_arrow(templist[0][0], templist[0][2]);
                }
                if (templist[1][0].qsub === templist[1][2]) {
                    add_arrow(templist[0][0], templist[0][1]);
                }
            }
        }
        if (cell.lcnt === 1 && cell.ques !== CQUES.ice) {
            for (let d = 0; d < 4; d++) {
                let ncell = dir(cell.adjacent, d);
                while (!ncell.isnull && ncell.ques === CQUES.ice) {
                    ncell = dir(ncell.adjacent, d);
                }
                if (ncell.isnull || ncell.lcnt !== 1 || dir(ncell.adjborder, d + 2).line) { continue; }
                let fn = function (c) {
                    let adjline = c.adjborder;
                    let templist = [[adjline.top, BQSUB.arrow_up, BQSUB.arrow_dn], [adjline.bottom, BQSUB.arrow_dn, BQSUB.arrow_up],
                    [adjline.left, BQSUB.arrow_lt, BQSUB.arrow_rt], [adjline.right, BQSUB.arrow_rt, BQSUB.arrow_lt]];
                    templist = templist.filter(b => b[0].line);
                    if (templist.length !== 1) { return 0; }
                    if (templist[0][0].qsub === templist[0][1]) { return 1; }
                    if (templist[0][0].qsub === templist[0][2]) { return 2; }
                    return 0;
                }
                if (fn(cell) && fn(cell) === fn(ncell)) {
                    add_cross(dir(adjline, d));
                }
            }
        }
    }
}

function InverseLitsoAssist() {
    BlackConnected();
    CellConnected({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
        isNotPassable: (c, nb, nc) => nb.ques,
        OnlyOneConnected: false,
    });
    No2x2Black();
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let templist = [];
        for (let j = 0; j < room.clist.length; j++) {
            templist.push(room.clist[j]);
        }
        if (templist.filter(c => c.qsub === CQSUB.dot).length === 4) {
            templist.forEach(c => add_black(c));
        }
        if (templist.filter(c => c.qans !== CQANS.black).length === 4) {
            templist.forEach(c => add_dot(c));
        }
        for (let j = 0; j < room.clist.length; j++) {
            let cell = room.clist[j];
            // clean out region lower than 4
            let templist2 = [];
            let fn = function (c) {
                if (c.room !== room || isBlack(c) || templist2.includes(c)) { return; }
                templist2.push(c);
                fourside(fn, c.adjacent);
            }
            fn(cell);
            if (templist2.length < 4) {
                templist2.forEach(c => add_black(c));
            }

            // out of reach in 3 steps
            templist2 = [];
            let fn2 = function (c, step = 3) {
                if (step < 0 || c.room !== room) { return; }
                templist2.push(c);
                fn2(c.adjacent.top, step - 1);
                fn2(c.adjacent.bottom, step - 1);
                fn2(c.adjacent.left, step - 1);
                fn2(c.adjacent.right, step - 1);
            }
            if (cell.qsub === CQSUB.dot) {
                fn2(cell);
                templist.forEach(c => {
                    if (!templist2.includes(c)) {
                        add_black(c);
                    }
                });
            }
            let list = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (!list.some(c => c.isnull || c.room !== cell.room)) {
                list.forEach(c => fn2(c));
                templist.forEach(c => {
                    if (!templist2.includes(c)) {
                        add_black(c);
                    }
                });
            }
        }
    }
}

function LitsAssist() {
    BlackConnected();
    BlackConnected_InRegion();
    No2x2Black();
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let templist = [];
        for (let j = 0; j < room.clist.length; j++) {
            templist.push(room.clist[j]);
        }
        if (templist.filter(c => c.qsub !== CQSUB.dot).length === 4) {
            templist.forEach(c => add_black(c));
        }
        if (templist.filter(c => isBlack(c)).length === 4) {
            templist.forEach(c => add_dot(c));
        }
        for (let j = 0; j < room.clist.length; j++) {
            let cell = room.clist[j];
            if (cell.qsub === CQSUB.dot) { continue; }
            // clean out region lower than 4
            let templist2 = [];
            let fn = function (c) {
                if (c.room !== room || c.qsub === CQSUB.dot || templist2.includes(c)) { return; }
                templist2.push(c);
                fourside(fn, c.adjacent);
            }
            fn(cell);
            if (templist2.length < 4) {
                templist2.forEach(c => add_dot(c));
            }
            if (cell.qans !== CQANS.black) { continue; }
            // out of reach in 3 steps
            templist2 = [];
            let fn2 = function (c, step = 0) {
                if (step > 3 || c.room !== room) { return; }
                templist2.push(c);
                fourside(nc => fn2(nc, step + 1), c.adjacent);
            }
            fn2(cell);
            templist.forEach(c => {
                if (!templist2.includes(c)) {
                    add_dot(c);
                }
            });
        }
    }
}

function NothreeAssist() {
    BlackNotAdjacent();
    GreenConnected();
    for (let i = 0; i < board.dots.length; i++) {
        let dot = board.dots[i].piece;
        if (dot.qnum !== 1) { continue; }
        let cellList = [];
        if (dot.bx % 2 === 1 && dot.by % 2 === 1) {
            cellList.push(board.getc(dot.bx, dot.by));
        }
        if (dot.bx % 2 === 0 && dot.by % 2 === 1) {
            cellList.push(board.getc(dot.bx - 1, dot.by));
            cellList.push(board.getc(dot.bx + 1, dot.by));
        }
        if (dot.bx % 2 === 1 && dot.by % 2 === 0) {
            cellList.push(board.getc(dot.bx, dot.by - 1));
            cellList.push(board.getc(dot.bx, dot.by + 1));
        }
        if (dot.bx % 2 === 0 && dot.by % 2 === 0) {
            cellList.push(board.getc(dot.bx - 1, dot.by - 1));
            cellList.push(board.getc(dot.bx + 1, dot.by - 1));
            cellList.push(board.getc(dot.bx - 1, dot.by + 1));
            cellList.push(board.getc(dot.bx + 1, dot.by + 1));
        }
        let blackcnt = cellList.filter(c => isBlack(c)).length;
        let emptycnt = cellList.filter(c => c.qans !== CQANS.black && c.qsub !== CQSUB.dot).length;
        if (blackcnt === 0 && emptycnt === 1) {
            cellList.forEach(c => add_black(c));
        }
        if (blackcnt === 1) {
            cellList.forEach(c => add_green(c));
        }
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        for (let d = 0; d < 4; d++) {
            let fn = function (list) {
                if (!list.some(c => c.isnull) && list.filter(c => isBlack(c)).length === 2) {
                    list.forEach(c => add_green(c));
                }
            }
            // O.O.O
            fn([cell, offset(cell, 2, 0, d), offset(cell, 4, 0, d)]);
            // O..O..O
            fn([cell, offset(cell, 3, 0, d), offset(cell, 6, 0, d)]);
            // O...O...O
            fn([cell, offset(cell, 4, 0, d), offset(cell, 8, 0, d)]);
            // OXXXXOX?XXO
            for (let l = 5; l * 2 < Math.max(board.cols, board.rows); l++) {
                let templist1 = [cell, offset(cell, l, 0, d), offset(cell, 2 * l, 0, d)];
                if (templist1.some(c => c.isnull)) { continue; }
                templist1 = templist1.filter(c => c.qans !== CQANS.black);
                let templist2 = [];
                for (let j = 1; j < 2 * l; j++) {
                    if (j === l) { continue; }
                    templist2.push(offset(cell, j, 0, d));
                }
                if (templist2.some(c => isBlack(c))) { continue; }
                templist2 = templist2.filter(c => c.qsub !== CQSUB.dot);
                if (templist1.length === 0 && templist2.length === 1) {
                    add_black(templist2[0]);
                }
                if (templist1.length === 1 && templist2.length === 0) {
                    add_green(templist1[0]);
                }
            }
        }
    }
}

function AyeheyaAssist() {
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let qnum = room.top.qnum;
        let rows = room.clist.getRectSize().rows;
        let cols = room.clist.getRectSize().cols;
        let tx = room.clist.getRectSize().x1 + room.clist.getRectSize().x2;
        let ty = room.clist.getRectSize().y1 + room.clist.getRectSize().y2;
        if (rows % 2 === 1 && cols % 2 === 0) {
            let c1 = board.getc(tx / 2 - 1, ty / 2);
            let c2 = board.getc(tx / 2 + 1, ty / 2);
            if (c1.room === room) { add_green(c1); }
            if (c2.room === room) { add_green(c2); }
        }
        if (rows % 2 === 0 && cols % 2 === 1) {
            let c1 = board.getc(tx / 2, ty / 2 - 1);
            let c2 = board.getc(tx / 2, ty / 2 + 1);
            if (c1.room === room) { add_green(c1); }
            if (c2.room === room) { add_green(c2); }
        }
        if (rows % 2 === 1 && cols % 2 === 1) {
            let c = board.getc(tx / 2, ty / 2);
            if (qnum >= 0 && qnum % 2 === 0 && c.room === room) {
                add_green(c);
            }
            if (qnum >= 0 && qnum % 2 === 1 && c.room === room) {
                add_black(c);
            }
        }
        for (let j = 0; j < room.clist.length; j++) {
            let cell = room.clist[j];
            if (isGreen(cell)) {
                add_green(board.getc(tx - cell.bx, ty - cell.by));
            }
            if (isBlack(cell)) {
                add_black(board.getc(tx - cell.bx, ty - cell.by));
            }
        }
    }
    HeyawakeAssist();
}

function ShakashakaAssist() {
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && c.qsub === CQSUB.none && c.qans === CQANS.none;
    let isNotBlack = c => !c.isnull && c.qnum === CQNUM.none;
    // draw triangle
    let add_tri = function (c, ndir) { // 0 = ◣, 1 = ◢, 2 = ◥, 3 = ◤
        if (c === undefined || c.isnull || !isEmpty(c)) { return; }
        if (step && flg) { return; }
        flg = true;
        ndir = (ndir % 4 + 4) % 4;
        c.setQans(ndir + 2);
        c.draw();
    };
    // check black edge
    let isEdge = function (c, ndir) { // 0 = left, 1 = bottom, 2 = right, 3 = top
        ndir = (ndir % 4 + 4) % 4;
        let tri = [(ndir + 0) % 4 + 2, (ndir + 1) % 4 + 2, (ndir + 2) % 4 + 2, (ndir + 3) % 4 + 2];
        return c.isnull || c.qnum !== CQNUM.none || c.qans === tri[0] || c.qans === tri[3];
    };
    // check if dot connects to edge
    let isDotEdge = function (c) {
        if (c.qsub !== CQSUB.dot) { return false; }
        let dfslist = [];
        let dfs = function (c, ndir = -1) {
            if (isEmpty(c) || dfslist.includes(c)) { return; }
            if (ndir !== -1 && isEdge(c, ndir + 2)) { return true; }
            if (c.qsub === CQSUB.dot) {
                dfslist.push(c);
                for (let d = 0; d < 4; d++) {
                    if (dfs(dir(c.adjacent, d + 1), d)) { return true; }
                }
            }
            return false;
        };
        return dfs(c);
    };
    let isNotDiagRect = function (c) {
        return c.isnull || c.qnum !== CQNUM.none || isDotEdge(c);
    }
    // check if connects to edge
    let isEdgeEx = function (c, ndir) { // 0 = left, 1 = bottom, 2 = right, 3 = top
        return isEdge(c, ndir) || isDotEdge(c);
    };
    // corner of a rectangle i.e. both side connects to edge
    let isCorner = function (c, ndir) { // 0 = ◣, 1 = ◢, 2 = ◥, 3 = ◤
        ndir = (ndir % 4 + 4) % 4;
        return isEdgeEx(c, ndir) && isEdgeEx(c, (ndir + 1) % 4)
    };
    // if can place a specific triangle
    let isTriAble_Basic = function (c, ndir) { // 0 = ◣, 1 = ◢, 2 = ◥, 3 = ◤
        ndir = (ndir % 4 + 4) % 4;
        let tri = [(ndir + 0) % 4 + 2, (ndir + 1) % 4 + 2, (ndir + 2) % 4 + 2, (ndir + 3) % 4 + 2];
        let fn = (c, qans) => !c.isnull && c.qans === qans;
        // already placed other triangle
        if (!isEmpty(c) && c.qans !== tri[0]) { return false; }
        // already placed the triangle
        if (c.qans === tri[0]) { return true; }
        // check if all ～s can be part of a diagonal rectangle.
        // ～～
        // ◣～
        if (isEdge(offset(c, +1, +0, ndir), ndir) || isEdge(offset(c, +0, -1, ndir), ndir + 1)) { return false; }
        if (isNotDiagRect(offset(c, +1, -1, ndir))) { return false; }
        // ＿＿＿    ＿◥＿    ＿＿＿    ＿＿＿    ＿＿＿    ＿＿＿
        // ＿◣◥ or ＿◣＿ or ◣◣＿ or ◤◣＿ or ＿◣＿ or ＿◣＿
        // ＿＿＿    ＿＿＿    ＿＿＿    ＿＿＿    ＿◣＿    ＿◢＿
        if (fn(offset(c, +1, +0, ndir), tri[2]) || fn(offset(c, +0, -1, ndir), tri[2])) { return false; }
        if (fn(offset(c, -1, +0, ndir), tri[0]) || fn(offset(c, -1, -1, ndir), tri[3])) { return false; }
        if (fn(offset(c, +0, +1, ndir), tri[0]) || fn(offset(c, +0, +1, ndir), tri[1])) { return false; }
        // ＿＿◤    ＿＿◣    ＿＿◢    ◤＿＿    ＿＿＿    ＿＿＿
        // ＿◣＿ or ＿◣＿ or ＿◣＿ or ＿◣＿ or ＿◣＿ or ＿◣＿
        // ＿＿＿    ＿＿＿    ＿＿＿    ＿＿＿    ◣＿＿    ＿＿◢
        if (fn(offset(c, +1, -1, ndir), tri[3]) || fn(offset(c, -1, -1, ndir), tri[3])) { return false; }
        if (fn(offset(c, +1, -1, ndir), tri[0]) || fn(offset(c, -1, +1, ndir), tri[0])) { return false; }
        if (fn(offset(c, +1, -1, ndir), tri[1]) || fn(offset(c, +1, +1, ndir), tri[1])) { return false; }
        // ◤＿＿    ＿＿＿    ＿◥＿    ＿＿＿
        // ＿＿＿ or ＿＿＿ or ＿＿＿ or ＿＿◥
        // ◣＿＿    ◣＿◢    ◣＿＿    ◣＿＿
        if (fn(offset(c, +0, -2, ndir), tri[3]) || fn(offset(c, +2, +0, ndir), tri[1])) { return false; }
        if (fn(offset(c, +1, -2, ndir), tri[2]) || fn(offset(c, +2, -1, ndir), tri[2])) { return false; }
        return true;
    };
    // extend of isntTri including some complex logic
    let isTriAble = function (c, ndir, itercnt = 0) { // 0 = ◣, 1 = ◢, 2 = ◥, 3 = ◤
        ndir = (ndir % 4 + 4) % 4;
        if (!isTriAble_Basic(c, ndir)) { return false; }
        if (itercnt >= 5) { return true; }
        itercnt++;
        // 〓＿◣
        // ＿～＿ && ～ !== ◥
        // ＿＿〓
        if (isNotBlack(offset(c, -1, 0, ndir)) && isNotBlack(offset(c, 0, 1, ndir)) &&
            isEdgeEx(offset(c, -2, 0, ndir), ndir + 2) && isEdgeEx(offset(c, 0, 2, ndir), ndir + 3) &&
            isNotBlack(offset(c, -1, 1, ndir)) && !isTriAble(offset(c, -1, 1, ndir), ndir + 2, itercnt)) {
            return false;
        }
        // ◣＿＿    ＿◤＿   ＿＿＿    ＿＿＿
        // ＿◣＿ or ＿◣＿ , ＿◣＿ or ＿◣◢
        // ＿＿＿    ＿＿＿   ＿＿◣    ＿＿＿
        if (!isTriAble(offset(c, -1, -1, ndir), ndir, itercnt) &&
            !isTriAble(offset(c, +0, -1, ndir), ndir + 3, itercnt)) { return false; }
        if (!isTriAble(offset(c, +1, +1, ndir), ndir, itercnt) &&
            !isTriAble(offset(c, +1, +0, ndir), ndir + 1, itercnt)) { return false; }
        return true;
    }
    let sel_tri = function (c) {
        if (!isEmpty(c)) { return; }
        let list = [0, 1, 2, 3].map(n => isTriAble(c, n));
        if (list.filter(b => b).length === 1) {
            add_tri(c, list.indexOf(true));
        }
    }
    // start assist
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        // dot by clue
        if (cell.qnum >= 0 && adjlist(cell.adjacent).filter(c => isNotBlack(c) && c.qans !== CQANS.none).length === cell.qnum) {
            fourside(add_dot, cell.adjacent);
        }
        // triangle by clue
        if (cell.qnum >= 0 && adjlist(cell.adjacent).filter(c => isNotBlack(c) && c.qsub !== CQSUB.dot).length === cell.qnum) {
            fourside(sel_tri, cell.adjacent);
        }
        // cannot place any triangle
        if (isEmpty(cell) && ![0, 1, 2, 3].some(n => isTriAble(cell, n))) {
            add_dot(cell);
        }
        for (let d = 0; d < 4; d++) {
            // ＿＊    ＊＊
            // ＊＊ -> ＊＊
            let list = [offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d)];
            if (!list.some(c => c.isnull || c.qsub !== CQSUB.dot) && isDotEdge(list[0])) {
                add_dot(cell);
            }
            // 〓＿〓 -> 〓＊〓
            if (isEdgeEx(offset(cell, -1, 0, d), d + 2) && isEdgeEx(offset(cell, 1, 0, d), d)) {
                add_dot(cell);
            }
            // ＿＿＿    －     －    ＿＊＿
            // ＿１＿ && ～ !== ◥ -> ＿１＊
            // ～＿＿    －     －    ＿＿＿
            if (cell.qnum === 1 &&
                (c => !c.isnull && (isNotBlack(c) || c.qsub === CQSUB.dot))(offset(cell, -1, 0, d)) &&
                (c => !c.isnull && (isNotBlack(c) || c.qsub === CQSUB.dot))(offset(cell, 0, +1, d)) &&
                (c => c.qnum === CQNUM.none && !isTriAble(c, d + 2))(offset(cell, -1, 1, d))) {
                add_dot(offset(cell, 1, 0, d));
                add_dot(offset(cell, 0, -1, d));
            }
            // 〓＿    ＊＿    ＊＿    ～◣
            // ＊＊ or 〓＊ or ＊〓 -> ～～
            if (isEmpty(cell)) {
                let list = [offset(cell, -1, 0, d), offset(cell, 0, 1, d), offset(cell, -1, 1, d)];
                if (list.filter(c => !c.isnull && !isEmpty(c) && c.qsub === CQSUB.dot).length === 2 &&
                    list.filter(c => !c.isnull && !isEmpty(c) && c.qsub !== CQSUB.dot).length === 1) {
                    let temp = list.find(c => !c.isnull && !isEmpty(c) && c.qsub !== CQSUB.dot);
                    if (list.indexOf(temp) === 0 && isCorner(temp, d + 1) ||
                        list.indexOf(temp) === 1 && isCorner(temp, d + 3) ||
                        list.indexOf(temp) === 2 && isCorner(temp, d + 2)) { add_tri(cell, d); }
                }
            }
            // ＿＿〓    ＿＿〓    ◣＿〓    ◢＿〓
            // ＊〓＿ or 〓＊＿ -> ～～＿ or ～～＿
            if (isEmpty(offset(cell, 0, 0, d)) && isEmpty(offset(cell, 1, 0, d)) && (
                offset(cell, 0, 1, d).qsub === CQSUB.dot && isEdge(offset(cell, 1, 1, d), d + 3) ||
                offset(cell, 1, 1, d).qsub === CQSUB.dot && isEdge(offset(cell, 0, 1, d), d + 3)) &&
                isEdgeEx(offset(cell, 2, 0, d), d)) {
                sel_tri(cell);
            }
            if (isEmpty(offset(cell, 0, 0, d)) && isEmpty(offset(cell, 1, 0, d)) && (
                offset(cell, 0, -1, d).qsub === CQSUB.dot && isEdge(offset(cell, 1, -1, d), d + 1) ||
                offset(cell, 1, -1, d).qsub === CQSUB.dot && isEdge(offset(cell, 0, -1, d), d + 1)) &&
                isEdgeEx(offset(cell, 2, 0, d), d)) {
                sel_tri(cell);
            }
        }
        // side extend
        if (cell.qans !== CQANS.none) {
            let ndir = cell.qans - 2;
            // ◣＿＿    ＿◤＿   ＿＿＿    ＿＿＿
            // ＿◣＿ or ＿◣＿ , ＿◣＿ or ＿◣◢
            // ＿＿＿    ＿＿＿   ＿＿◣    ＿＿＿
            if (!isTriAble(offset(cell, -1, -1, ndir), ndir + 0)) { add_tri(offset(cell, +0, -1, ndir), ndir + 3); }
            if (!isTriAble(offset(cell, +0, -1, ndir), ndir + 3)) { add_tri(offset(cell, -1, -1, ndir), ndir + 0); }
            if (!isTriAble(offset(cell, +1, +1, ndir), ndir + 0)) { add_tri(offset(cell, +1, +0, ndir), ndir + 1); }
            if (!isTriAble(offset(cell, +1, +0, ndir), ndir + 1)) { add_tri(offset(cell, +1, +1, ndir), ndir + 0); }
            // ＿〓＿    ＿＿〓    ＿＿＿    ＿＿＿
            // ＿＿＿ or ＿＿＿ or ＿＿〓 -> ＿◥＿
            // ◣＿＿    ◣＿＿    ◣＿＿    ◣＿＿
            if (isEdgeEx(offset(cell, 2, -1, ndir), ndir) || isEdgeEx(offset(cell, 1, -2, ndir), ndir + 1) ||
                isEdgeEx(offset(cell, 2, -2, ndir), ndir) || isEdgeEx(offset(cell, 2, -2, ndir), ndir + 1)) {
                add_tri(offset(cell, 1, -1, ndir), ndir + 2);
            }
            // rectangle opposite side extend
            // ＿◤＿    ＿◤＿
            // ◤＿＿ -> ◤＿◢
            // ◣◢＿    ◣◢＿
            let tri = [(ndir + 0) % 4 + 2, (ndir + 1) % 4 + 2, (ndir + 2) % 4 + 2, (ndir + 3) % 4 + 2];
            let turn1 = offset(cell, 0, -1, ndir);
            let turn2 = cell;
            while (!offset(turn2, 1, 1, ndir).isnull && offset(turn2, 1, 1, ndir).qans === tri[0]) {
                turn2 = offset(turn2, 1, 1, ndir);
            }
            turn2 = offset(turn2, 1, 0, ndir);
            if (turn1.qans === tri[3] && turn2.qans === tri[1]) {
                turn1 = offset(turn1, 1, -1, ndir);
                turn2 = offset(turn2, 1, -1, ndir);
                while ((!turn1.isnull && turn1.qans === tri[3]) || (!turn2.isnull && turn2.qans === tri[1])) {
                    add_tri(turn1, ndir + 3);
                    add_tri(turn2, ndir + 1);
                    turn1 = offset(turn1, 1, -1, ndir);
                    turn2 = offset(turn2, 1, -1, ndir);
                }
            }
        }
    }
}

function HeyawakeAssist() {
    GreenConnected();
    BlackNotAdjacent();
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjcell = cell.adjacent;
        let blackcnt = 0;
        fourside(c => {
            blackcnt += c.isnull || isBlack(c);
        }, adjcell);
        // no two facing doors
        for (let d = 0; d < 4; d++) {
            if (cell.qsub !== CQSUB.green) { break; }
            let pcell = dir(cell.adjacent, d);
            let bordercnt = 0;
            let emptycellList = [cell];
            while (!pcell.isnull && pcell.qans !== CQANS.black && bordercnt < 2) {
                if (dir(pcell.adjborder, d + 2).ques) {
                    bordercnt++;
                }
                emptycellList.push(pcell);
                pcell = dir(pcell.adjacent, d);
            }
            emptycellList = emptycellList.filter(c => c.qsub !== CQSUB.green);
            if (bordercnt === 2 && emptycellList.length === 1) {
                add_black(emptycellList[0]);
            }
        }
    }
    const MAXSIT = 200000;
    const MAXAREA = 50;
    for (let i = 0; i < board.roommgr.components.length; i++) {
        let room = board.roommgr.components[i];
        let qnum = room.top.qnum;
        if (qnum === CQNUM.none || qnum === CQNUM.quesmark) { continue; }
        let list = [];
        let surlist = [];
        let sitcnt = 0;
        let cst = new Map();
        let apl = new Map();
        for (let j = 0; j < room.clist.length; j++) {
            let cell = room.clist[j];
            list.push(cell);
            cst.set(cell, (isBlack(cell) ? "BLK" : (isGreen(cell) ? "GRN" : "UNK")));
            apl.set(cell, (isBlack(cell) ? "BLK" : (isGreen(cell) ? "GRN" : "UNK")));
        }
        if (qnum === list.filter(c => isBlack(c)).length) {
            list.forEach(c => add_green(c));
            continue;
        }
        // randomly chosen approximate formula
        if (list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length > MAXAREA &&
            (qnum - list.filter(c => isBlack(c)).length + 1) < list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) { continue; }
        if ((qnum - list.filter(c => isBlack(c)).length) * 2 + 5 <
            list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) { continue; }
        list.forEach(c => {
            adjlist(c.adjacent).forEach(c => {
                if (c.isnull || c.room === room || surlist.includes(c)) { return; }
                if (isGreen(c) || isBlack(c)) { return; }
                surlist.push(c);
                apl.set(c, "GRN");
            });
        });
        let dfs = function (i, blkcnt) {
            if (sitcnt > MAXSIT) { return; }
            if (i === list.length) {
                if (blkcnt !== qnum) { return; }
                let templist = [];
                let templist2 = [];
                if (list.some(c => {
                    if (cst.get(c) === "BLK") { return false; }
                    if (templist.includes(c)) { return false; }
                    let n = 0;
                    let olist = [];
                    let dfs = function (c) {
                        if (c.isnull || templist.includes(c)) { return false; }
                        if (c.room !== room) {
                            if (isBlack(c)) { return false; }
                            olist.push(c);
                            return true;
                        }
                        if (cst.get(c) === "BLK") { return false; }
                        templist.push(c);
                        n++;
                        let res = 0;
                        res |= dfs(offset(c, -1, 0));
                        res |= dfs(offset(c, 0, -1));
                        res |= dfs(offset(c, 1, 0));
                        res |= dfs(offset(c, 0, 1));
                        return res;
                    };
                    let res = dfs(c);
                    if (olist.length === 1) { templist2.push(olist[0]); }
                    if (!res && n + qnum < list.length) { return true; }
                    return false;
                })) { return; };
                list.forEach(c => {
                    if (apl.get(c) !== "UNK" && apl.get(c) !== cst.get(c)) { apl.set(c, "AMB"); }
                    if (apl.get(c) === "UNK") { apl.set(c, cst.get(c)); }
                });
                surlist.forEach(c => {
                    if (templist2.includes(c)) { return; }
                    let templist = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 1, 0), offset(c, 0, 1)];
                    if (templist.some(c => !c.isnull && c.room === room && cst.get(c) === "BLK")) { return; }
                    apl.set(c, "AMB");
                });
                return;
            }
            if (cst.get(list[i]) !== "UNK") { dfs(i + 1, blkcnt); return; }
            sitcnt++;
            let templist = [offset(list[i], -1, 0), offset(list[i], 0, -1), offset(list[i], 1, 0), offset(list[i], 0, 1)];
            if (blkcnt < qnum && !templist.some(c => isBlack(c) || cst.has(c) && cst.get(c) === "BLK")) {
                cst.set(list[i], "BLK");
                dfs(i + 1, blkcnt + 1);
                cst.set(list[i], "UNK");
            }
            cst.set(list[i], "GRN");
            dfs(i + 1, blkcnt);
            cst.set(list[i], "UNK");
        };
        dfs(0, list.filter(c => isBlack(c)).length);
        if (sitcnt > MAXSIT) { continue; }
        list.forEach(c => {
            if (apl.get(c) === "BLK") {
                add_black(c);
            }
            if (apl.get(c) === "GRN") {
                add_green(c);
            }
        });
        surlist.forEach(c => {
            if (apl.get(c) === "GRN") {
                add_green(c);
            }
        });
    }
}

function AkariAssist() {
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.light && c.qsub !== CQSUB.dot;
    let isNotLight = c => c.isnull || c.qnum !== CQNUM.none || c.qsub === CQSUB.dot
    let add_light = function (c) { add_black(c, true); };
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjcell = cell.adjacent;
        let emptycnt = 0;
        let lightcnt = 0;
        // add dot where lighted
        if (cell.qlight && cell.qans !== CQANS.light) {
            add_dot(cell);
        }
        // only one place can light
        if (cell.qnum === CQNUM.none && !cell.qlight) {
            let emptycellList = [];
            if (cell.qsub !== CQSUB.dot) {
                emptycellList.push(cell);
            }
            for (let d = 0; d < 4; d++) {
                let pcell = dir(cell.adjacent, d);
                while (!pcell.isnull && pcell.qnum === CQNUM.none) {
                    emptycellList.push(pcell);
                    pcell = dir(pcell.adjacent, d);
                }
            }
            emptycellList = emptycellList.filter(c => c.qsub !== CQSUB.dot);
            if (emptycellList.length === 1) {
                add_light(emptycellList[0]);
            }
        }
        fourside(c => {
            if (!c.isnull && c.qnum === CQNUM.none && c.qsub !== CQSUB.dot && c.qans !== CQANS.light) { emptycnt++; }
            lightcnt += (c.qans === CQANS.light);
        }, adjcell);
        if (cell.qnum >= 0) {
            // finished clue
            if (cell.qnum === lightcnt) {
                fourside(add_dot, adjcell);
            }
            // finish clue
            if (cell.qnum === emptycnt + lightcnt) {
                fourside(add_light, adjcell);
            }
            // dot at corner
            if (cell.qnum - lightcnt + 1 === emptycnt) {
                for (let d = 0; d < 4; d++) {
                    if (isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, 1, d))) {
                        add_dot(offset(cell, 1, 1, d));
                    }
                }
            }
        }
        // 3 & 1
        if (cell.qnum === 3) {
            for (let d = 0; d < 4; d++) {
                if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1) {
                    add_light(offset(cell, -1, 0, d));
                    add_light(offset(cell, 0, -1, d));
                    add_dot(offset(cell, 1, 2, d));
                    add_dot(offset(cell, 2, 1, d));
                }
            }
        }
        // 2 & 1
        if (cell.qnum === 2) {
            for (let d = 0; d < 4; d++) {
                if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1) {
                    add_dot(offset(cell, -1, -1, d));
                }
            }
        }
        // 1 & 1
        if (cell.qnum === 1) {
            for (let d = 0; d < 4; d++) {
                if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1 &&
                    isNotLight(offset(cell, 1, 2, d)) && isNotLight(offset(cell, 2, 1, d))) {
                    add_dot(offset(cell, -1, 0, d));
                    add_dot(offset(cell, 0, -1, d));
                }
            }
        }
    }
}

function MasyuAssist() {
    SingleLoopInCell({
        isPass: c => c.qnum !== CQNUM.none,
    });
    let isBlack = c => !c.isnull && c.qnum === CQNUM.bcir;
    let isWhite = c => !c.isnull && c.qnum === CQNUM.wcir;
    let isPathable = b => !b.isnull && b.qsub !== BQSUB.cross;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        for (let d = 0; d < 4; d++) {
            //  +×+      +×+
            // ●   ● -> ●   ●
            //  + +      +×+
            if (isBlack(offset(cell, -1, 0, d)) && isBlack(offset(cell, 1, 0, d)) && !isPathable(offset(cell, 0, -.5, d))) {
                add_cross(offset(cell, 0, .5, d));
            }
            // + +    +×+
            // ━○  -> ━○━
            // + +    +×+
            if (isWhite(cell) && (offset(cell, -.5, 0, d).line || !isPathable(offset(cell, 0, -.5, d)))) {
                add_line(offset(cell, -.5, 0, d));
                add_line(offset(cell, +.5, 0, d));
                add_cross(offset(cell, 0, -.5, d));
                add_cross(offset(cell, 0, +.5, d));
            }
            // + + + +    + + + +
            // ━━━○━╸  -> ━━━○━╸×
            // + + + +    + + + +
            if (isWhite(cell) && offset(cell, -.5, 0, d).line && offset(cell, -1.5, 0, d).line) {
                add_cross(offset(cell, 1.5, 0, d));
            }
            // + + + +    + +┃+ +
            // ━╸ ○ ○  -> ━╸×○×○ 
            // + + + +    + +┃+ +
            if (isWhite(cell) &&
                (offset(cell, -1.5, 0, d).line || isWhite(offset(cell, -1, 0, d))) &&
                (offset(cell, +1.5, 0, d).line || isWhite(offset(cell, +1, 0, d)))) {
                add_cross(offset(cell, -.5, 0, d));
                add_cross(offset(cell, +.5, 0, d));
                add_line(offset(cell, 0, -.5, d));
                add_line(offset(cell, 0, +.5, d));
            }
            // + + + : + + + : + +┃+ : + + + : + + +    + + +
            // ━●    :  ●×   :  ● ╹  :  ● ●  :  ●  × -> ━●×   
            // + + + ; + + + ; + + + ; + + + ; + + +    + + +
            if (isBlack(cell) && (offset(cell, -.5, 0, d).line || !isPathable(offset(cell, .5, 0, d)) ||
                offset(cell, 1, -.5, d).line || offset(cell, 1, .5, d).line ||
                isBlack(offset(cell, 1, 0, d)) || !isPathable(offset(cell, 1.5, 0, d)))) {
                add_cross(offset(cell, .5, 0, d));
                add_line(offset(cell, -.5, 0, d));
            }
            // + + +    + + +
            //  ●━╸  ->  ●━━━ 
            // + + +    + + +
            if (isBlack(cell) && offset(cell, .5, 0, d).line) {
                add_line(offset(cell, 1.5, 0, d));
            }
            // + + + + +    + + + + +
            //  ●   ○ ○  -> ━●   ○ ○ 
            // + + + + +    + + + + +
            if (isBlack(cell) && isWhite(offset(cell, 2, 0, d)) && isWhite(offset(cell, 3, 0, d))) {
                add_line(offset(cell, -.5, 0, d));
            }
            // + + + +    + + + +
            //  ○   ○      ○   ○ 
            // + + + + -> + + + +
            //    ●          ●   
            // + + + +    + +┃+ +
            if (isBlack(cell) && isWhite(offset(cell, -1, -1, d)) && isWhite(offset(cell, 1, -1, d))) {
                add_line(offset(cell, 0, .5, d));
            }
        }
    }
}

function SimpleloopAssist() {
    SingleLoopInCell({
        isPassable: c => c.ques !== CQUES.bwall,
        isPass: c => c.ques !== CQUES.bwall,
    });
}

function KoburinAssist() {
    SingleLoopInCell({
        isPassable: c => c.qnum === CQNUM.none,
        isPass: c => c.qsub === CQSUB.dot,
        add_notpass: c => add_black(c, true),
        add_pass: add_dot,
    });
    let isPathable = c => !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.black;
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.black && c.qsub !== CQSUB.dot && c.lcnt === 0;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjcell = cell.adjacent;
        let adjline = cell.adjborder;
        // check clue
        if (cell.qnum >= 0) {
            let list = adjlist(cell.adjacent);
            if (list.filter(c => isBlack(c)).length === cell.qnum) {
                list.forEach(c => add_dot(c));
            }
            if (list.filter(c => !c.isnull && c.qnum === CQNUM.none && c.qsub !== CQSUB.dot).length === cell.qnum) {
                list.forEach(c => add_black(c, true));
            }
        }
        // add cross
        if (cell.qnum !== CQNUM.none) {
            fourside(add_cross, adjline);
            for (let d = 0; d < 4; d++) {
                //        · ·
                //  3  ->  3 
                //        · ·
                if (cell.qnum === 3) {
                    add_dot(offset(cell, -1, -1));
                    add_dot(offset(cell, -1, +1));
                    add_dot(offset(cell, +1, -1));
                    add_dot(offset(cell, +1, +1));
                }
                //          █  
                //  3   -> █3  
                //    █       █
                if (cell.qnum === 3 && ((b => b.isnull || b.qsub === BQSUB.cross)(offset(cell, 1.5, 1, d)) ||
                    (c => c.isnull || isBlack(c) || c.qnum !== CQNUM.none)(offset(cell, 2, 1, d)))) {
                    add_black(offset(cell, -1, 0, d), true);
                    add_black(offset(cell, 0, -1, d), true);
                }
                if (cell.qnum === 3 && ((b => b.isnull || b.qsub === BQSUB.cross)(offset(cell, 1.5, -1, d)) ||
                    (c => c.isnull || isBlack(c) || c.qnum !== CQNUM.none)(offset(cell, 2, -1, d)))) {
                    add_black(offset(cell, -1, 0, d), true);
                    add_black(offset(cell, 0, 1, d), true);
                }
                //         ·   
                //  2   ->  2  
                //    █       █
                if (cell.qnum === 2 && ((b => b.isnull || b.qsub === BQSUB.cross)(offset(cell, 1.5, 1, d)) ||
                    (c => c.isnull || isBlack(c) || c.qnum !== CQNUM.none)(offset(cell, 2, 1, d)))) {
                    add_dot(offset(cell, -1, -1, d));
                }
                if (cell.qnum === 2 && ((b => b.isnull || b.qsub === BQSUB.cross)(offset(cell, 1.5, -1, d)) ||
                    (c => c.isnull || isBlack(c) || c.qnum !== CQNUM.none)(offset(cell, 2, -1, d)))) {
                    add_dot(offset(cell, -1, 1, d));
                }
            }
            continue;
        }
        // add dot around black
        if (isBlack(cell)) {
            fourside(add_cross, adjline);
            fourside(add_dot, adjcell);
            continue;
        }
        let emptycnt = 0;
        let linecnt = 0;
        fourside((b, c) => {
            if (isPathable(c) && b.qsub !== BQSUB.cross) { emptycnt++; }
            linecnt += b.line;
        }, adjline, adjcell);
        // no branch
        if (linecnt === 2) {
            fourside(add_cross, adjline);
        }
        // no deadend
        if (emptycnt <= 1) {
            add_black(cell, true);
            fourside(add_cross, adjline);
            fourside(add_dot, adjcell);
        }
        // 2 degree cell no deadend
        if (emptycnt === 2) {
            fourside((b, c) => {
                if (!isPathable(c) || b.qsub === BQSUB.cross) { return; }
                add_dot(c);
            }, adjline, adjcell);
        }
    }
}

function YajilinAssist() {
    SingleLoopInCell({
        isPassable: c => !c.isnull && c.qnum === CQNUM.none && !isBlack(c),
        isPass: c => c.qsub === CQSUB.dot,
        add_notpass: c => add_black(c, true),
        add_pass: add_dot,
    });
    let isPassable = c => !c.isnull && c.qnum === CQNUM.none && !isBlack(c);
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && !isBlack(c) && c.qsub !== CQSUB.dot && c.lcnt === 0;
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        // check clue
        if (cell.qnum >= 0 && cell.qdir !== QDIR.none) {
            let d = qdirremap(cell.qdir);
            let qnum = cell.qnum;
            let list = [];
            let dn = 0, lc = null;
            while ((c => !c.isnull && (c.qnum < 0 || c.qdir !== cell.qdir))(offset(cell, 0, -dn - 1, d))) {
                dn++;
                let c = offset(cell, 0, -dn, d);
                if (isBlack(c)) { qnum--; }
                if (!isEmpty(c)) { continue; }
                if (lc === null) {
                    lc = c;
                    continue;
                }
                if (lc === offset(c, 0, 1, d)) {
                    list.push([lc, c]);
                    lc = null;
                } else {
                    list.push([lc]);
                    lc = c;
                }
            }
            if (lc !== null) { list.push([lc]); }
            if ((c => c.qnum >= 0 && c.qdir === cell.qdir)(offset(cell, 0, -dn - 1, d))) {
                qnum -= offset(cell, 0, -dn - 1, d).qnum;
            }
            if (list.length === qnum) {
                list.forEach(p => {
                    if (p.length === 1) {
                        add_black(p[0]);
                    }
                    if (p.length === 2) {
                        add_cross(offset(p[0], 0, -.5, d));
                    }
                });
            }
            if (qnum === 0) {
                list.forEach(p => {
                    add_dot(p[0]);
                    if (p.length === 2) {
                        add_dot(p[1]);
                    }
                });
            }
        }
        // add cross
        if (cell.qnum !== CQNUM.none) {
            fourside(add_cross, cell.adjborder);
            continue;
        }
        // add dot around black
        if (isBlack(cell)) {
            fourside(add_cross, cell.adjborder);
            fourside(add_dot, cell.adjacent);
            continue;
        }
        let emptycnt = 0;
        let linecnt = 0;
        fourside((nb, nc) => {
            if (isPassable(nc) && nb.qsub !== BQSUB.cross) { emptycnt++; }
            linecnt += nb.line;
        }, cell.adjborder, cell.adjacent);
        // no branch
        if (linecnt === 2) {
            fourside(add_cross, cell.adjborder);
        }
        // no deadend
        if (emptycnt <= 1) {
            add_black(cell);
            fourside(add_cross, cell.adjborder);
            fourside(add_dot, cell.adjacent);
        }
        // 2 degree cell no deadend
        if (emptycnt === 2) {
            fourside((nb, nc) => {
                if (!isPassable(nc) || nb.qsub === BQSUB.cross) { return; }
                add_dot(nc);
            }, cell.adjborder, cell.adjacent);
        }
        // prevent multiple loops
        let list = adjlist(cell.adjborder, cell.adjacent);
        list = list.filter(([b, c]) => isPassable(c) && b.qsub !== BQSUB.cross);
        if (list.length === 0 || list[0][1].path !== undefined && list[0][1].path !== null && list.every(([b, c]) => c.path === list[0][1].path) && board.linegraph.components.length > 1) {
            add_black(cell);
        }
        for (let d = 0; d < 4; d++) {
            if (!isPassable(offset(cell, -1, 0, d))) { continue; }
            if (!isPassable(offset(cell, 0, -1, d))) { continue; }
            if (isPassable(offset(cell, -2, 0, d)) && offset(cell, -1.5, 0, d).qsub !== BQSUB.cross) { continue; }
            if (isPassable(offset(cell, 0, -2, d)) && offset(cell, 0, -1.5, d).qsub !== BQSUB.cross) { continue; }
            if (!offset(cell, -1, -1.5, d).line && !offset(cell, -1.5, -1, d).line) { continue; }
            add_dot(cell);
        }
    }
}

function SlitherlinkAssist() {
    let add_bg_color = function (c, color) {
        if (c === undefined || c.isnull || c.qsub !== CQSUB.none || c.qsub === color) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(color);
        c.draw();
    }
    let add_bg_inner_color = function (c) { add_bg_color(c, CQSUB.green); }
    let add_bg_outer_color = function (c) { add_bg_color(c, CQSUB.yellow); }
    let isCross = b => b.isnull || b.qsub === BQSUB.cross;
    let isLine = b => b.line;
    let isYellow = c => c.isnull || c.qsub === CQSUB.yellow;
    let add_oneline = function (b1, b2) {
        if (b1.qsub === BQSUB.cross || b1.isnull || b2.line) {
            add_cross(b1);
            add_line(b2);
        }
        if (b2.qsub === BQSUB.cross || b2.isnull || b1.line) {
            add_cross(b2);
            add_line(b1);
        }
    }
    CellConnected({
        isShaded: isGreen,
        isUnshaded: c => isYellow(c) || c.qsub === CQSUB.none && c.qnum === 3,
        add_shaded: add_bg_inner_color,
        add_unshaded: add_bg_outer_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
    });
    CellConnected({
        isShaded: isYellow,
        isUnshaded: c => isGreen(c) || c.qsub === CQSUB.none && c.qnum === 3,
        add_shaded: add_bg_outer_color,
        add_unshaded: add_bg_inner_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
        OutsideAsShaded: true,
    });
    NoCheckerCell({
        isShaded: isGreen,
        isUnshaded: isYellow,
        add_shaded: add_bg_inner_color,
        add_unshaded: add_bg_outer_color,
    });
    // counting this due to some small loop joke
    let twocnt = 0;
    let threecnt = 0;
    for (let i = 0; i < board.cell.length; i++) {
        twocnt += board.cell[i].qnum === 2;
        threecnt += board.cell[i].qnum === 3;
    }
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let blist = adjlist(cell.adjborder);
        if (blist.filter(b => b.line).length === cell.qnum) {
            blist.forEach(b => add_cross(b));
        }
        if (blist.filter(b => b.qsub !== BQSUB.cross).length === cell.qnum) {
            blist.forEach(b => add_line(b));
        }
        // deduce single clue
        //  1
        // 2·3·
        //  4c5
        //  ·6·
        let fn = function (c, b1, b2, b3, b4, b5, b6) {
            //  ×       ×  
            // ×· · -> ×·×·
            //   1      ×1 
            //  · ·     · ·
            if (c.qnum === 1 && isCross(b1) && isCross(b2)) {
                add_cross(b3);
                add_cross(b4);
            }
            //  ×       × 
            // ×· · -> ×┏━╸
            //   3      ┃3 
            //  · ·     ╹ ·
            if (c.qnum === 3 && isCross(b1) && isCross(b2)) {
                add_line(b3);
                add_line(b4);
            }
            //  ×       ×  
            // ━╸ ·    ━╸ ·
            //   1  ->   1×
            //  · ·     ·×·
            if (c.qnum === 1 && (isCross(b1) && isLine(b2) || isLine(b1) && isCross(b2))) {
                add_cross(b5);
                add_cross(b6);
            }
            //          ×       ┃  
            //  · ·    ━╸ ·    ×╹ ·
            //   1× ->   1× or   1×
            //  ·×·     ·×·     ·×·
            if (c.qnum === 1 && isCross(b5) && isCross(b6)) {
                add_oneline(b1, b2);
            }
            //          ×  
            // ━╸ ·    ━╸ ╻
            //   3  ->   3┃
            //  · ·     ╺━┛
            if (c.qnum === 3 && (isLine(b1) || isLine(b2))) {
                add_cross(b1);
                add_cross(b2);
                add_line(b5);
                add_line(b6);
            }
            //          ×       ┃  
            //  · ╻    ━╸ ╻    ×╹ ╻
            //   3┃ ->   3┃ or   3┃
            //  ╺━┛     ╺━┛     ╺━┛
            if (c.qnum === 3 && isLine(b5) && isLine(b6)) {
                add_oneline(b1, b2);
            }
            //  ×       ×  
            // ×· ╻    ×·×╻
            //   2┃ ->  ×2┃
            //  · ╹     ╺━┛
            if (c.qnum === 2 && isCross(b1) && isCross(b2) && (isLine(b5) || isLine(b6))) {
                add_cross(b3);
                add_cross(b4);
                add_line(b5);
                add_line(b6);
            }
            //  ×       ×  
            // ×· ·    ×┏━╸
            //   2× ->  ┃2×
            //  · ·     ╹×·
            if (c.qnum === 2 && isCross(b1) && isCross(b2) && (isCross(b5) || isCross(b6))) {
                add_line(b3);
                add_line(b4);
                add_cross(b5);
                add_cross(b6);
            }
            //          ×  
            // ━╸ ·    ━╸ ·
            //   2× ->   2×
            //  · ·     ╺━╸
            if (c.qnum === 2 && (isLine(b1) || isLine(b2)) && (isCross(b5) || isCross(b6))) {
                add_cross(b1);
                add_cross(b2);
                add_line(b5);
                add_line(b6);
            }
            //          ×       ┃  
            //  · ·    ━╸ ·    ×╹ ·
            //   2× ->   2× or   2×
            //  ╺━╸     ╺━╸     ╺━╸
            if (c.qnum === 2 && (isLine(b5) && isCross(b6) || isCross(b5) && isLine(b6))) {
                add_oneline(b1, b2);
            }
        };
        for (let d = 0; d < 4; d++) {
            fn(cell, offset(cell, -1, -.5, d), offset(cell, -.5, -1, d),
                offset(cell, 0, -.5, d), offset(cell, -.5, 0, d),
                offset(cell, .5, 0, d), offset(cell, 0, .5, d),);
            // · · ·    ┏━╸ ·
            //  3       ┃3   
            // · · · -> ╹ · ╻
            //    3        3┃
            // · · ·    · ╺━┛
            if (cell.qnum === 3 && offset(cell, 1, 1, d).qnum === 3) {
                add_line(offset(cell, 0, -.5, d));
                add_line(offset(cell, -.5, 0, d));
                add_line(offset(cell, 1.5, 1, d));
                add_line(offset(cell, 1, 1.5, d));
            }
            // ┏━╸ ·    ┏━╸ ·
            // ┃3       ┃3   
            // ╹ · · -> ╹ · ·
            //    1        1×
            // · · ·    · ·×·
            if (cell.qnum === 3 && offset(cell, 1, 1, d).qnum === 1 &&
                isLine(offset(cell, 0, -.5, d)) && isLine(offset(cell, -.5, 0, d))) {
                add_cross(offset(cell, 1.5, 1, d));
                add_cross(offset(cell, 1, 1.5, d));
            }
            //  × ×      × × 
            // ×· ·     ×· ╺━
            //   2   ->   2  
            // ━╸ ·     ━╸ · 
            //           ×   
            if (cell.qnum === 2 &&
                isCross(offset(cell, -.5, -1, d)) && isCross(offset(cell, -1, -.5, d))) {
                add_oneline(offset(cell, .5, -1, d), offset(cell, 1, -.5, d));
                add_oneline(offset(cell, -1, .5, d), offset(cell, -.5, 1, d));
            }
            //  ×        ×   
            // ×· ·     ×· · 
            //   2   ->   2  
            //  · ·×     · ·×
            //             × 
            if (cell.qnum === 2 &&
                isCross(offset(cell, -.5, -1, d)) && isCross(offset(cell, -1, -.5, d)) &&
                (isCross(offset(cell, 1, .5, d)) || isCross(offset(cell, .5, 1, d)))) {
                add_cross(offset(cell, 1, .5, d));
                add_cross(offset(cell, .5, 1, d));
            }
            //  ×        ×   
            // ×· ·     ×┏━╸ 
            //   2   ->  ┃2× 
            //  · ╺━     ╹×┏━
            //             ┃ 
            if (cell.qnum === 2 &&
                isCross(offset(cell, -.5, -1, d)) && isCross(offset(cell, -1, -.5, d)) &&
                (isLine(offset(cell, 1, .5, d)) || isLine(offset(cell, .5, 1, d)))) {
                add_line(offset(cell, 0, -.5, d));
                add_line(offset(cell, -.5, 0, d));
                add_cross(offset(cell, .5, 0, d));
                add_cross(offset(cell, 0, .5, d));
                add_line(offset(cell, 1, .5, d));
                add_line(offset(cell, .5, 1, d));
            }
            //            ×  
            // · · ·    ╻ ╻ ╻
            //  3 3  -> ┃3┃3┃
            // · · ·    ╹ ╹ ╹
            //            ×  
            if (cell.qnum === 3 && (threecnt > 2 || twocnt > 0) &&
                offset(cell, 1, 0, d).qnum === 3) {
                add_line(offset(cell, -.5, 0, d));
                add_line(offset(cell, .5, 0, d));
                add_line(offset(cell, 1.5, 0, d));
                add_cross(offset(cell, .5, -1, d));
                add_cross(offset(cell, .5, 1, d));
            }
            //            ×  
            // · · ·    · · ╻
            // ×2 3  -> ×2 3┃
            // · · ·    · · ╹
            //            ×  
            if (cell.qnum === 2 && offset(cell, 1, 0, d).qnum === 3 && isCross(offset(cell, -.5, 0, d))) {
                add_line(offset(cell, 1.5, 0, d));
                add_cross(offset(cell, .5, -1, d));
                add_cross(offset(cell, .5, 1, d));
            }
            //   ×        ×  
            // · · ·    · ╺━╸
            //  1 3  -> ×1 3 
            // · · ·    ·×· ·
            if (cell.qnum === 1 && offset(cell, 1, 0, d).qnum === 3 && isCross(offset(cell, .5, -1, d))) {
                add_line(offset(cell, 1, -.5, d));
                add_cross(offset(cell, -.5, 0, d));
                add_cross(offset(cell, 0, .5, d));
            }
            // ·×· ·    ·×· ·
            // ×1       ×1   
            // · · · -> · · ·
            //    1        1×
            // · · ·    · ·×·
            if (cell.qnum === 1 && offset(cell, 1, 1, d).qnum === 1 &&
                isCross(offset(cell, 0, -.5, d)) && isCross(offset(cell, -.5, 0, d))) {
                add_cross(offset(cell, 1.5, 1, d));
                add_cross(offset(cell, 1, 1.5, d));
            }
        }
    }
    // connectivity at cross
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        let blist = adjlist(cross.adjborder);
        let linecnt = blist.filter(b => b.line).length;
        let crosscnt = blist.filter(b => b.qsub === BQSUB.cross).length;
        if (linecnt === 2 || crosscnt === 3) {
            blist.forEach(b => add_cross(b));
        }
        if (linecnt === 1 && crosscnt === 2) {
            blist.forEach(b => add_line(b));
        }
    }
    // avoid forming multiple loop
    for (let i = 0; i < board.border.length; i++) {
        let border = board.border[i];
        if (border.qsub === BQSUB.cross) { continue; }
        if (border.line) { continue; }
        let cr1 = border.sidecross[0];
        let cr2 = border.sidecross[1];
        if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
            add_cross(border);
        }
    }
    // deduce color
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjline = cell.adjborder;
        let adjcell = cell.adjacent;
        // neighbor color
        {
            fourside((b, c) => {
                if (!c.isnull && cell.qsub !== CQSUB.none && cell.qsub === c.qsub) {
                    add_cross(b);
                }
                if (cell.qsub === CQSUB.yellow && c.isnull) {
                    add_cross(b);
                }
                if (!c.isnull && cell.qsub !== CQSUB.none && c.qsub !== CQSUB.none && cell.qsub !== c.qsub) {
                    add_line(b);
                }
                if (cell.qsub === CQSUB.green && c.isnull) {
                    add_line(b);
                }
            }, adjline, adjcell);
        }
        // deduce neighbor color
        if (cell.qsub === CQSUB.none) {
            fourside((b, c) => {
                if (b.line && c.isnull) {
                    add_bg_inner_color(cell);
                }
                if (b.qsub === BQSUB.cross && c.isnull) {
                    add_bg_outer_color(cell);
                }
                if (b.line && !c.isnull && c.qsub !== CQSUB.none) {
                    add_bg_color(cell, CQSUB.green + CQSUB.yellow - c.qsub);
                }
                if (b.qsub === BQSUB.cross && !c.isnull && c.qsub !== CQSUB.none) {
                    add_bg_color(cell, c.qsub);
                }
            }, adjline, adjcell);
        }
        {
            let innercnt = adjlist(cell.adjacent).filter(c => isGreen(c)).length;
            let outercnt = adjlist(cell.adjacent).filter(c => isYellow(c)).length;
            // surrounded by green
            if (innercnt === 4) {
                add_bg_inner_color(cell);
            }
            // number and color deduce
            if (cell.qnum >= 0) {
                if (cell.qnum < innercnt || 4 - cell.qnum < outercnt) {
                    add_bg_inner_color(cell);
                }
                if (cell.qnum < outercnt || 4 - cell.qnum < innercnt) {
                    add_bg_outer_color(cell);
                }
                if (isGreen(cell) && cell.qnum === outercnt) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (isYellow(cell) && cell.qnum === innercnt) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (isYellow(cell) && cell.qnum === 4 - outercnt) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (isGreen(cell) && cell.qnum === 4 - innercnt) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qnum === 2 && outercnt === 2) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qnum === 2 && innercnt === 2) {
                    fourside(add_bg_outer_color, adjcell);
                }
                // 2 different color around 1 or 3
                if ((cell.qnum === 1 || cell.qnum === 3) && innercnt === 1 && outercnt === 1) {
                    fourside((c, d) => {
                        if (!c.isnull && c.qsub === CQSUB.none) {
                            if (cell.qnum === 1) { add_cross(d); }
                            if (cell.qnum === 3) { add_line(d); }
                        }
                    }, adjcell, adjline);
                }
                // same diagonal color as 3
                if (cell.qnum === 3 && cell.qsub !== CQSUB.none) {
                    for (let d = 0; d < 4; d++) {
                        if (!dir(adjcell, d).isnull && !dir(adjcell, d + 1).isnull && dir(dir(adjcell, d).adjacent, d + 1).qsub === cell.qsub) {
                            add_line(dir(adjline, d + 2));
                            add_line(dir(adjline, d + 3));
                        }
                    }
                }
                if (cell.qnum === 2) {
                    //  ×   
                    // ×· · 
                    //   2 A
                    //  · ·a
                    //   Bb  
                    for (let d = 0; d < 4; d++) {
                        let b1 = offset(cell, -.5, -1, d);
                        let b2 = offset(cell, -1, -.5, d);
                        if (!(b1.isnull || b1.qsub === BQSUB.cross)) { continue; }
                        if (!(b2.isnull || b2.qsub === BQSUB.cross)) { continue; }
                        let c1 = dir(adjcell, d + 2);
                        let c2 = dir(adjcell, d + 3);
                        // A=B
                        add_bg_color(c1, (c2.isnull ? CQSUB.yellow : c2.qsub));
                        add_bg_color(c2, (c1.isnull ? CQSUB.yellow : c1.qsub));
                    }
                }
            }
        }
    }
}
