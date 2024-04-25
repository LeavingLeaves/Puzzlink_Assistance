// ==UserScript==
// @name         Puzz.link Assistance
// @version      24.4.25.1
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @match        https://pzprxs.vercel.app/p*/*
// @match        http://pzv.jp/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=puzz.link
// @grant        none
// @namespace    https://greasyfork.org/users/1192854
// @license      GPL
// ==/UserScript==

'use strict';

const MAXLOOP = 50;
const MAXDFSCELLNUM = 200;
let flg = true, flg2 = true;
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
    // Yinyang
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
const BQNUM = {
    none: -1,
    wcir: 1,
    bcir: 2,
};
const CRQSUB = {
    none: undefined,
    out: 0,
    in: 1,
}

const GENRELIST = [
    ["Akari", AkariAssist],
    ["All or Nothing", AllorNothingAssist],
    ["Ant Mill", AntMillAssist],
    ["Aqre", AqreAssist],
    ["Aquapelago", AquapelagoAssist],
    ["Ayeheya", AyeheyaAssist],
    ["Barns", BarnsAssist],
    ["Canal View", CanalViewAssist],
    ["Castle Wall", CastleWallAssist],
    ["Cave", CaveAssist],
    ["Choco Banana", ChocoBananaAssist],
    ["Circles and Squares", CirclesAndSquaresAssist],
    ["Creek", CreekAssist],
    ["Double Choco", DoubleChocoAssist],
    ["Fillomino", FillominoAssist],
    ["Guide Arrow", GuideArrowAssist],
    ["Heyawake", HeyawakeAssist],
    ["Hitori", HitoriAssist],
    ["Icebarn", IcebarnAssist],
    ["Inverse LITSO", InverseLitsoAssist],
    ["Koburin", KoburinAssist],
    ["Kropki", KropkiAssist],
    ["Kurodoko", KurodokoAssist],
    ["Light and Shadow", LightandShadowAssist],
    ["LITS", LitsAssist],
    ["Masyu", MasyuAssist],
    ["Mid-loop", MidloopAssist],
    ["Minarism", MinarismAssist],
    ["Myopia", MyopiaAssist],
    ["Moon or Sun", MoonOrSunAssist],
    ["Nawabari", NawabariAssist],
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
    ["Putteria", PutteriaAssist],
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
let initDone = false;
let main = function () {
    GENRENAME = ui.puzzle.info.en;
    if (initDone || GENRENAME === undefined) { return; }
    initDone = true;
    if (document.querySelector("#assist") !== null) { return; }
    console.log(`Puzzle Genre Name: ${GENRENAME}`);
    console.log(`Puzzle Link: ${window.location.href}`);
    console.log("Assistance running...");
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
};
ui.puzzle.on('ready', main, false);
let initTimer = setInterval(() => {
    if (initDone) {
        clearInterval(initTimer);
        return;
    }
    console.log("Puzz.link Assistance didn't launch. Relaunching...");
    main();
}, 1000);
// for postMessage
window.addEventListener(
    "message",
    (event) => {
        if (event.data === "assist") {
            assist();
        }
        if (event.data === "undo") {
            ui.puzzle.undo();
        }
        if (event.data === "redo") {
            ui.puzzle.redo();
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
    console.time("Assisted. Elapsed Time");
    flg = true;
    board = ui.puzzle.board;
    for (let loop = 0; loop < (step ? 1 : MAXLOOP); loop++) {
        if (!flg && !flg2) { break; }
        flg = flg2 = false;
        if (GENRELIST.some(g => g[0] === GENRENAME)) {
            GENRELIST.find(g => g[0] === GENRENAME)[1]();
        } else { GeneralAssist(); }
    }
    ui.puzzle.redraw();
    console.timeEnd("Assisted. Elapsed Time");
    window.parent.postMessage(ui.puzzle.check().complete ? "Solved" : "Not Solved", "*");
    if (ui.puzzle.check().complete) { printBoard(); }
}
function printBoard() {
    // only some genres are able (i.e. looks good) to show in text.
    let res = "";
    let hasSide = false;
    forEachCell(cell => fourside(b => hasSide ||= (!b.isnull && b.qans), cell.adjborder));
    if (GENRENAME === "Slitherlink" || GENRENAME === "Myopia") {
        for (let i = 0; i < board.cross.length; i++) {
            let cross = board.cross[i];
            let t;
            t |= cross.adjborder.top.line << 0;
            t |= cross.adjborder.left.line << 1;
            t |= cross.adjborder.bottom.line << 2;
            t |= cross.adjborder.right.line << 3;
            res += "·╹╸┛╻┃┓┫╺┗━┻┏┣┳╋"[t];
            if (cross.bx === board.maxbx) { res += '\n'; }
        }
    } else if (hasSide) {
        for (let i = 0; i < board.cross.length; i++) {
            let cross = board.cross[i];
            let t = 0;
            t |= (cross.by > board.minby && (cross.bx === board.minbx || cross.bx === board.maxbx)) << 0;
            t |= (cross.bx > board.minbx && (cross.by === board.minby || cross.by === board.maxby)) << 1;
            t |= (cross.by < board.maxby && (cross.bx === board.minbx || cross.bx === board.maxbx)) << 2;
            t |= (cross.bx < board.maxbx && (cross.by === board.minby || cross.by === board.maxby)) << 3;
            t |= (cross.adjborder.top.qans) << 0;
            t |= (cross.adjborder.left.qans) << 1;
            t |= (cross.adjborder.bottom.qans) << 2;
            t |= (cross.adjborder.right.qans) << 3;
            res += "·╹╸┛╻┃┓┫╺┗━┻┏┣┳╋"[t];
            if (cross.bx === board.maxbx) { res += '\n'; }
        }
    } else {
        let color = undefined;
        if (board.roommgr.components !== undefined) { color = Array(board.roommgr.components.length).fill(undefined); }
        // const palette = ["\x1b[31m\x1b[101m", "\x1b[32m\x1b[102m", "\x1b[33m\x1b[103m", "\x1b[36m\x1b[106m"];
        const palette = ["\x1b[101m", "\x1b[102m", "\x1b[103m", "\x1b[106m"];
        if (board.roommgr.components !== undefined) {
            let temp = board.roommgr.getSideAreaInfo().map(([a, b]) => a.id > b.id ? [a.id, b.id] : [b.id, a.id]);
            let edge = Array.from(Array(board.roommgr.components.length), i => []);
            temp.forEach(([a, b]) => edge[a].push(b));
            for (let i = 0; i < color.length;) {
                if (color[i] === undefined) { color[i] = 0; } else { color[i]++; }
                while (edge[i].some(j => color[i] === color[j])) { color[i]++; }
                if (color[i] >= 4) {
                    color[i] = undefined;
                    i--;
                    continue;
                }
                i++;
            }
        }
        let hasNum = false;
        forEachCell(cell => hasNum ||= cell.qnum !== 0);
        forEachCell(cell => {
            if (color !== undefined && color[cell.room.id] !== undefined) {
                res += palette[color[cell.room.id]];
            }
            if (isIce(cell)) { res += "\x1b[106m"; }
            res += (() => {
                if (GENRENAME === "Akari") {
                    if (isBlack(cell)) { return "○"; }
                    if (cell.qnum !== CQNUM.none) { return "█"; }
                    return "·";
                }
                if (isBlack(cell) && GENRENAME === "Star Battle") { return "★" };
                if (isBlack(cell) || [CQUES.bwall, CQUES.white, CQUES.black].includes(cell.ques)) { return "█"; }
                if (cell.lcnt > 0) {
                    let t;
                    t |= cell.adjborder.top.line << 0;
                    t |= cell.adjborder.left.line << 1;
                    t |= cell.adjborder.bottom.line << 2;
                    t |= cell.adjborder.right.line << 3;
                    return "·╹╸┛╻┃┓┫╺┗━┻┏┣┳╋"[t];
                }
                if (GENRENAME === "No Three") { return "·"; }
                if (GENRENAME === "Shakashaka" && cell.qnum !== CQNUM.none) { return "█"; }
                if (GENRENAME === "Shakashaka" && cell.qans !== CQANS.none) { return "··◣◢◥◤"[cell.qans]; }
                if (cell.anum !== -1) {
                    let num = cell.anum;
                    if (num === CQNUM.quesmark) return "？";
                    if (num >= 0 && num < 10) return "０１２３４５６７８９".split('')[num];
                    if (num >= 10 && num < 100) return num.toString();
                    return "＃";
                }
                if (cell.qnum !== CQNUM.none && cell.qdir !== 0) {
                    let num = cell.qnum;
                    let dir = ".^v<>"[cell.qdir];
                    if (num >= 0 && num < 10) return num.toString() + dir;
                    if (num >= 10 && num < 36) return String.fromCharCode(num - 10 + 65) + dir;
                    if (num >= 36) return "#" + dir;
                }
                if (hasNum && cell.qnum !== CQNUM.none && GENRENAME !== "Heyawake") {
                    let num = cell.qnum;
                    if (num === CQNUM.quesmark) return "？";
                    if (num >= 0 && num < 10) return "０１２３４５６７８９".split('')[num];
                    if (num >= 10 && num < 100) return num.toString();
                    return "＃";
                }
                if (GENRENAME === "Masyu" || GENRENAME === "Yinyang") {
                    if (cell.qnum === CQNUM.bcir || cell.anum === CANUM.bcir) { return "●"; }
                    if (cell.qnum === CQNUM.wcir || cell.anum === CANUM.wcir) { return "○"; }
                }
                return "·";
            })();
            if (isIce(cell)) { res += "\x1b[49m"; }
            if (cell.bx === board.cols * 2 - 1) { res += '\n'; }
        });
    }
    console.log("Solution:\n" + res);
}

let isBlack = c => !c.isnull && c.qans === CQANS.black;
let isGreen = c => !c.isnull && c.qsub === CQSUB.green;
let isDot = isGreen;
let isIce = c => !c.isnull && c.ques === CQUES.ice;
let isSide = b => !b.isnull && b.qans === 1;
let isLink = b => !b.isnull && b.qsub === BQSUB.link;
let isLine = b => !b.isnull && b.line === 1;
let isInside = c => c.bx >= 0 && c.by >= 0 && c.bx <= board.cols * 2 && c.by <= board.rows * 2;
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
    return [c.top, c.left, c.bottom, c.right][d];
}
let qdirRemap = function (qdir) {
    return [-1, 0, 2, 1, 3][qdir];
}
let getShape = function (clist) {
    let minx = board.maxbx, miny = board.maxby, maxx = board.minbx, maxy = board.minby;
    for (let i = 0; i < clist.length; i++) {
        minx = Math.min(minx, clist[i].bx);
        miny = Math.min(miny, clist[i].by);
        maxx = Math.max(maxx, clist[i].bx);
        maxy = Math.max(maxy, clist[i].by);
    }
    let s = [[], [], [], [], [], [], [], []];
    for (let y = 0; y <= maxy - miny; y += 2) {
        for (let x = 0; x <= maxx - minx; x += 2) {
            s[0].push(clist.includes(board.getc(minx + x, miny + y)) ? 1 : 0);
            s[1].push(clist.includes(board.getc(minx + x, maxy - y)) ? 1 : 0);
        }
    }
    for (let x = 0; x <= maxx - minx; x += 2) {
        for (let y = 0; y <= maxy - miny; y += 2) {
            s[4].push(clist.includes(board.getc(minx + x, miny + y)) ? 1 : 0);
            s[5].push(clist.includes(board.getc(minx + x, maxy - y)) ? 1 : 0);
        }
    }
    s[2] = s[1].concat().reverse();
    s[3] = s[0].concat().reverse();
    s[6] = s[5].concat().reverse();
    s[7] = s[4].concat().reverse();
    for (var h = 0; h < 8; h++) {
        s[h] = (h < 4 ? (maxx - minx) / 2 + 1 : (maxy - miny) / 2 + 1) + ":" + s[h].join("");
    }
    s = s.sort();
    return s[0];
}
function forEachCell(f = cell => { }) { for (let i = 0; i < board.cell.length; i++) { f(board.cell[i]); } }
function forEachBorder(f = border => { }) { for (let i = 0; i < board.border.length; i++) { f(board.border[i]); } }
function forEachCross(f = cross => { }) { for (let i = 0; i < board.cross.length; i++) { f(board.cross[i]); } }
function forEachRoom(f = room => { }) {
    for (let i = 0; i < board.roommgr.components.length; i++) { f(board.roommgr.components[i]); }
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
let add_black = function (c, notOnNum = false) {
    if (notOnNum && (c.qnum !== CQNUM.none || c.qnums.length > 0)) { return; }
    if (c === undefined || c.isnull || c.lcnt !== 0 || c.qsub === CQSUB.dot || c.qans !== CQANS.none) { return; }
    if (step && flg) { return; }
    flg = true;
    c.setQans(CQANS.black);
    c.draw();
};
let add_dot = function (c) {
    if (c === undefined || c.isnull || c.qnum !== CQNUM.none || c.qnums.length > 0
        || c.qans !== CQANS.none || c.qsub !== CQSUB.none || c.anum !== CANUM.none) { return; }
    if (step && flg) { return; }
    flg |= c.lcnt === 0;
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
let add_inout = function (cr, qsub) {
    if (cr.isnull || cr.qsub !== CRQSUB.none) { return; }
    flg2 = 1;
    cr.setQsub(qsub);
}
let add_number = function (c, n) {
    if (c === undefined || c.isnull || c.anum !== CANUM.none) { return; }
    if (step && flg) { return; }
    flg = true;
    c.setAnum(n);
    c.draw();
};

// single rule deduction
function NoDeadendBorder() {
    forEachCross(cross => {
        let list = adjlist(cross.adjborder);
        if (list.some(b => b.isnull)) { return; }
        if (list.filter(b => b.qans).length === 1 &&
            list.filter(b => b.qsub !== BQSUB.link).length === 2) {
            list.forEach(b => add_side(b));
        }
        if (list.filter(b => b.qsub !== BQSUB.link).length === 1) {
            list.forEach(b => add_link(b));
        }
    });
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
    forEachRoom(room => {
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
    });
}
function No2x2Cell({ isShaded, add_unshaded } = {}) {
    forEachCell(cell => {
        let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
        if (templist.some(c => c.isnull)) { return; }
        templist = templist.filter(c => !isShaded(c));
        if (templist.length === 1) {
            add_unshaded(templist[0]);
        }
    });
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
    OnlyOneConnected = true,
    UnshadeEmpty = true,
    Obj = "cell" } = {}) {
    let forEachObj = (Obj === "cell" ? forEachCell : forEachCross);
    // use tarjan to find cut vertex
    let n = 0;
    let ord = new Map();
    let low = new Map();
    let shdn = new Map();
    let fth = new Map();
    let vst = new Set();
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
                    if (c.isnull || !isInside(c) || cellset.has(c) || isUnshaded(c)) { return; }
                    cellset.add(c);
                    for (let d = 0; d < 4; d++) {
                        let nb = offset(c, .5, 0, d);
                        let nc = offset(c, 1, 0, d);
                        while (isIce(nc)) { nc = offset(nc, 1, 0, d); }
                        if (nb.isnull || nc.isnull) { continue; }
                        if (isLinked(c, nb, nc)) {
                            linkdfs(nc);
                        }
                    }
                }
                linkdfs(c);
                if (!v) {
                    cellset.forEach(cl => {
                        ord.set(cl, ord.get(c));
                        shdn.set(ord.get(cl), shdn.get(ord.get(cl)) + isShaded(cl));
                        fth.set(cl, f);
                    });
                }
                let fn = function (c, nb, nc) {
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
                        if (!vst.has(ordnc)) {
                            shdn.set(ordc, shdn.get(ordc) + shdn.get(ordnc));
                            vst.add(ordnc);
                        }
                        if (ordc <= low.get(ordnc) && cantDivideShade(shdn.get(ordnc))) {
                            cellset.forEach(c => {
                                if (!isShaded(c) && !shadelist.includes(c)) {
                                    shadelist.push(c);
                                }
                            });
                        }
                    }
                };
                for (let c of cellset) {
                    for (let d = 0; d < 4; d++) {
                        let nb = offset(c, .5, 0, d);
                        let nc = offset(c, 1, 0, d);
                        while (isIce(nc)) { nc = offset(nc, 1, 0, d); }
                        fn(c, nb, nc);
                    }
                }
            }
            if (!v && c.isnull) {
                if (Obj === "cell") {
                    for (let i = 0; i < board.cols; i++) {
                        stack.push({ cell: board.getobj(2 * i + 1, board.minby + 1), father: c, visited: false });
                        stack.push({ cell: board.getobj(2 * i + 1, board.maxby - 1), father: c, visited: false });
                    }
                    for (let i = 0; i < board.rows; i++) {
                        stack.push({ cell: board.getobj(board.minbx + 1, 2 * i + 1), father: c, visited: false });
                        stack.push({ cell: board.getobj(board.maxbx - 1, 2 * i + 1), father: c, visited: false });
                    }
                }
            }
        }
    }
    if (OutsideAsShaded) {
        dfs(board.emptycell);
    } else {
        forEachObj(cell => {
            if (!isShaded(cell) || ord.has(cell)) { return; }
            if (n > 0 && OnlyOneConnected) { return; }
            dfs(cell);
        });
    }
    shadelist.forEach(c => add_shaded(c));
    if (ord.size > 0 && UnshadeEmpty) {
        forEachObj(cell => {
            if (ord.has(cell) || isShaded(cell) || isUnshaded(cell) || isIce(cell)) { return; }
            add_unshaded(cell);
        });
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
        UnshadeEmpty: false,
    });
}
function CellNoLoop({ isShaded, isUnshaded, add_unshaded } = {}) {
    let ord = new Map();
    let n = 0;
    forEachCell(cell => {
        if (!isShaded(cell) || ord.has(cell)) { return; }
        let dfs = function (c) {
            if (c.isnull || !isShaded(c) || ord.has(c)) { return; }
            ord.set(c, n);
            fourside(dfs, c.adjacent);
        }
        dfs(cell);
        n++;
    });
    forEachCell(cell => {
        if (isShaded(cell) || isUnshaded(cell)) { return; }
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
    });
}
function GreenNoLoopInCell() {
    CellNoLoop({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_unshaded: add_black,
    });
}
function BlackNotAdjacent() {
    forEachCell(cell => {
        if (!isBlack(cell)) { return; }
        fourside(add_green, cell.adjacent);
    });
}
function BlackDomino() {
    forEachCell(cell => {
        let list = adjlist(cell.adjacent);
        // surrounded by dot
        if (list.every(c => c.isnull || isGreen(c))) {
            add_green(cell);
        }
        // extend domino
        if (isBlack(cell) && list.filter(c => !c.isnull && c.qsub !== CQSUB.dot).length === 1) {
            let ncell = list.find(c => !c.isnull && c.qsub !== CQSUB.dot);
            add_black(ncell);
        }
        // finished domino
        if (isBlack(cell) && list.some(c => isBlack(c))) {
            fourside(add_dot, cell.adjacent);
        }
        // not making triomino
        if (list.filter(c => isBlack(c)).length >= 2) {
            add_green(cell);
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
    });
}
function SingleLoopInCell({ isPassable = c => true, isPathable = b => b.qsub !== BQSUB.cross,
    isPass = c => c.qsub === CQSUB.dot, isPath = b => b.line,
    add_notpass = c => { }, add_pass = c => { }, add_notpath = add_cross, add_path = add_line } = {}) {
    let initied = false;
    forEachCross(cross => { initied |= cross.qsub !== 0; })
    if (!initied) {
        forEachCross(cross => cross.setQsub(CRQSUB.none));
    }
    let hasIce = false;
    forEachCell(cell => { hasIce |= isIce(cell); });
    if (!hasIce) {
        CellConnected({
            isShaded: cr => cr.qsub === CRQSUB.in,
            isUnshaded: cr => cr.qsub === CRQSUB.out,
            add_shaded: cr => add_inout(cr, CRQSUB.in),
            add_unshaded: cr => add_inout(cr, CRQSUB.out),
            isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross || c.qsub === CRQSUB.in && nc.qsub === CRQSUB.in,
            isNotPassable: (c, nb, nc) => nb.line,
            Obj: "cross",
        });
        CellConnected({
            isShaded: cr => cr.qsub === CRQSUB.out,
            isUnshaded: cr => cr.qsub === CRQSUB.in,
            add_shaded: cr => add_inout(cr, CRQSUB.out),
            add_unshaded: cr => add_inout(cr, CRQSUB.in),
            isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross || c.qsub === CRQSUB.out && nc.qsub === CRQSUB.out,
            isNotPassable: (c, nb, nc) => nb.line,
            Obj: "cross",
        });
    }
    forEachCell(cell => {
        if (!isPassable(cell)) {
            add_notpass(cell);
            fourside(add_notpath, cell.adjborder);
        }
        let emptycnt = 0;
        let linecnt = 0;
        fourside((c, b) => {
            if (!isPassable(c) || !isPathable(b)) {
                add_notpath(b);
            }
            if (!c.isnull && isPassable(c) && isPathable(b)) { emptycnt++; }
            linecnt += isPath(b);
        }, cell.adjacent, cell.adjborder);
        if (linecnt > 0) {
            add_pass(cell);
        }
        // no branch and no cross
        if (linecnt === 2 && !isIce(cell)) {
            fourside(add_notpath, cell.adjborder);
        }
        // no deadend
        if (emptycnt <= 1) {
            fourside(add_notpath, cell.adjborder);
            add_notpass(cell);
        }
        // 2 degree path
        if (emptycnt === 2 && (linecnt === 1 || isPass(cell))) {
            fourside(add_path, cell.adjborder);
        }
        // avoid forming multiple loop
        if (cell.path !== null && !isIce(cell)) {
            for (let d = 0; d < 4; d++) {
                let ncell = dir(cell.adjacent, d);
                while (isIce(ncell)) { ncell = dir(ncell.adjacent, d); }
                if (cell.lcnt === 1 && ncell.lcnt === 1 && cell.path === ncell.path && board.linegraph.components.length > 1) {
                    add_notpath(dir(cell.adjborder, d));
                }
            }
        }
        if (!isIce(cell) && linecnt === 0) {
            let list = [];
            for (let d = 0; d < 4; d++) {
                let nb = dir(cell.adjborder, d);
                let nc = dir(cell.adjacent, d);
                while (isIce(nc)) { nc = dir(nc.adjacent, d); }
                if (nb.isnull || nc.isnull || nb.qsub === BQSUB.cross) { continue; }
                list.push(nc);
            }
            if (list.length > 0 && list[0].path !== null && list.every(c => c.path === list[0].path && board.linegraph.components.length > 1)) {
                fourside(add_notpath, cell.adjborder);
            }
        }
        if (isIce(cell)) {
            let fn = (b1, b2) => {
                if (b1.line) { add_line(b2); }
                if (b1.qsub === BQSUB.cross || b1.isnull) { add_cross(b2) };
            }
            for (let d = 0; d < 4; d++) {
                fn(offset(cell, .5, 0, d), offset(cell, -.5, 0, d));
            }
        }
        // ┏╸     ┏╸ 
        // ┃·  -> ┃╺━
        // ┗╸     ┗╸ 
        if (cell.lcnt === 0 && isPass(cell)) {
            let list = [];
            fourside((c, b) => {
                if (isPathable(b)) { list.push([c, b]); }
            }, cell.adjacent, cell.adjborder);
            if (list.length === 3) {
                let fn = function (a, b, c) {
                    if (a[0].path !== null && a[0].path === b[0].path &&
                        !isIce(a[0]) && !isIce(b[0]) &&
                        board.linegraph.components.length > 1) {
                        add_path(c[1]);
                    }
                }
                fn(list[0], list[1], list[2]);
                fn(list[1], list[2], list[0]);
                fn(list[2], list[0], list[1]);
            }
        }
    });
    add_inout(board.getobj(0, 0), CRQSUB.out);
    // add invisible qsub at cross
    if (!hasIce) {
        for (let i = 0; i < board.cross.length; i++) {
            let cross = board.cross[i];
            // no checker
            if (cross.qsub === CRQSUB.none) {
                let fn = function (cr, cr1, cr2, cr12) {
                    if (cr1.isnull || cr2.isnull || cr12.isnull) { return; }
                    if (cr1.qsub === CRQSUB.none || cr2.qsub === CRQSUB.none || cr12.qsub === CRQSUB.none) { return; }
                    if (cr1.qsub === cr2.qsub && cr1.qsub !== cr12.qsub) {
                        add_inout(cr, cr1.qsub);
                    }
                };
                for (let d = 0; d < 4; d++) {
                    if (!isIce(offset(cross, .5, .5, d)))
                        fn(cross, offset(cross, 1, 0, d), offset(cross, 0, 1, d), offset(cross, 1, 1, d));
                }
            }
        }
    }
    let crossSet = new Set();
    let dfs = function (cr) {
        if (cr.qsub === CRQSUB.none || crossSet.has(cr)) { return; }
        crossSet.add(cr);
        for (let d = 0; d < 4; d++) {
            let ncr = offset(cr, 1, 0, d);
            let b = offset(cr, .5, 0, d);
            if (ncr.isnull) { continue; }
            if (cr.qsub !== CRQSUB.none) {
                // add line between different i/o
                (() => {
                    if (cr.isnull || ncr.isnull) { return; }
                    if (cr.qsub === CRQSUB.none || ncr.qsub === CRQSUB.none) { return; }
                    if (cr.qsub === ncr.qsub) {
                        add_cross(b);
                    }
                    if (cr.qsub !== ncr.qsub) {
                        add_line(b);
                    }
                })();
                // extend i/o through cross/line
                (() => {
                    if (ncr.isnull) { return; }
                    if (b.isnull || b.qsub === BQSUB.cross) {
                        add_inout(ncr, cr.qsub);
                    }
                    if (!b.isnull && b.line && GENRENAME !== "Icebarn") {
                        add_inout(ncr, cr.qsub ^ 1);
                    }
                    if (!b.isnull && b.line && b.qsub !== BQSUB.none && GENRENAME === "Icebarn") {
                        add_inout(ncr, cr.qsub + ([BQSUB.arrow_up, BQSUB.arrow_lt, BQSUB.arrow_dn, BQSUB.arrow_rt][d] === b.qsub ? 1 : -1));
                    }
                })();
                dfs(ncr);
            }
        }
    };
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        dfs(cross);
    }
}
function SingleLoopInBorder() {
    let add_bg_color = function (c, color) {
        if (c === undefined || c.isnull || c.qsub !== CQSUB.none || c.qsub === color) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(color);
        c.draw();
    }
    let add_bg_inner_color = function (c) { add_bg_color(c, CQSUB.green); }
    let add_bg_outer_color = function (c) { add_bg_color(c, CQSUB.yellow); }
    let isYellow = c => c.isnull || c.qsub === CQSUB.yellow;
    CellConnected({
        isShaded: isGreen,
        isUnshaded: isYellow,
        add_shaded: add_bg_inner_color,
        add_unshaded: add_bg_outer_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
    });
    CellConnected({
        isShaded: isYellow,
        isUnshaded: isGreen,
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
    // use qsub for each cross to track what it can be
    forEachCross(cross => {
        if (cross.qsub === 0 || cross.qsub.length === 0) {
            let qsub = [[]];
            let list = adjlist(cross.adjborder);
            for (let i = 0; i < 4; i++) {
                for (let j = i + 1; j < 4; j++) {
                    qsub.push([list[i], list[j]]);
                }
            }
            cross.setQsub(qsub);
        }
        cross.setQsub(cross.qsub.filter(s => s.every(b => !b.isnull && b.qsub !== BQSUB.cross)));
        fourside(b => {
            if (b.line) { cross.setQsub(cross.qsub.filter(s => s.includes(b))); }
            if (cross.qsub.every(s => s.includes(b))) { add_line(b); }
            if (cross.qsub.every(s => !s.includes(b))) { add_cross(b); }
        }, cross.adjborder);
    });
    // connectivity at cross
    forEachCross(cross => {
        let blist = adjlist(cross.adjborder);
        let linecnt = blist.filter(b => b.line).length;
        let crosscnt = blist.filter(b => b.qsub === BQSUB.cross).length;
        if (linecnt === 2 || crosscnt === 3) {
            blist.forEach(b => add_cross(b));
        }
        if (linecnt === 1 && crosscnt === 2) {
            blist.forEach(b => add_line(b));
        }
    });
    // avoid forming multiple loop
    forEachBorder(border => {
        if (border.qsub === BQSUB.cross || border.line) { return; }
        let cr1 = border.sidecross[0], cr2 = border.sidecross[1];
        if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
            add_cross(border);
        }
    });
    // deduce color
    forEachCell(cell => {
        // neighbor color
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
        }, cell.adjborder, cell.adjacent);
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
            }, cell.adjborder, cell.adjacent);
        }
        let innercnt = adjlist(cell.adjacent).filter(c => isGreen(c)).length;
        let outercnt = adjlist(cell.adjacent).filter(c => isYellow(c)).length;
        // surrounded by green
        if (innercnt === 4) {
            add_bg_inner_color(cell);
        }
    });
}
function NoCheckerCell({ isShaded, isUnshaded, add_shaded, add_unshaded } = {}) {
    forEachCell(cell => {
        if (isShaded(cell) || isUnshaded(cell)) { return; }
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
    });
}
function SightNumber({ isShaded, isUnshaded, add_shaded, add_unshaded } = {}) {
    forEachCell(cell => {
        let qnum = cell.qnum;
        if (qnum === CQNUM.none || qnum === CQNUM.quesmark) { return; }
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
    });
}
function SizeRegion_Cell({ isShaded, isUnshaded, add_shaded, add_unshaded, OneNumPerRegion = true, NoUnshadedNum = true } = {}) {
    // TODO: maybe rewrite this someday
    forEachCell(cell => {
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
        if (!isShaded(cell) && !isUnshaded(cell)) {
            let cellList = [cell];
            let dfs = function (c) {
                if (c.isnull || !isShaded(c) || cellList.includes(c)) { return; }
                cellList.push(c);
                dfs(c.adjacent.top);
                dfs(c.adjacent.bottom);
                dfs(c.adjacent.left);
                dfs(c.adjacent.right);
            }
            fourside(dfs, cell.adjacent);
            let qnumlist = cellList.filter(c => c.qnum !== CQNUM.none);
            if (qnumlist.length > 1 && OneNumPerRegion) {
                add_unshaded(cell);
            }
            qnumlist = qnumlist.filter(c => c.qnum !== CQNUM.quesmark);
            if (qnumlist.length > 0 && qnumlist.some(c => c.qnum !== qnumlist[0].qnum)) {
                add_unshaded(cell);
            }
            if (qnumlist.length > 0 && cellList.length > qnumlist[0].qnum) {
                add_unshaded(cell);
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
    });
}
function SizeRegion_Border({ isLinkable = (c, nb, nc) => !nb.isnull && !nc.isnull,
    isSideable = (c, nb, nc) => !nb.isnull && !nc.isnull,
    OneNumPerRegion = false } = {}) {
    NoDeadendBorder();
    // use tarjan to find cut vertex
    let n = 0;
    let ord = new Map();
    let low = new Map();
    let cgn = new Map();
    let ctn = new Map();
    let clg = new Map();
    let clt = new Map();
    let fth = new Map();
    let vst = new Set();
    let acl, an;
    let linklist = [], sidelist = [];
    // to avoid Maximum call stack size exceeded, manually use a stack to track the cells
    let dfs = function (sc) {
        let stack = [{ cell: sc, father: null, visited: false }];
        while (stack.length > 0) {
            let cur = stack[stack.length - 1];
            let c = cur.cell;
            let f = cur.father;
            let v = cur.visited;
            if (!v) {
                if (ord.has(c)) { stack.pop(); continue; }
                ord.set(c, n);
                low.set(n, n);
                cgn.set(n, 1);
                ctn.set(n, 1);
                clg.set(n, []);
                clt.set(n, []);
                fth.set(c, f);
                n++;
                stack[stack.length - 1] = { cell: c, father: f, visited: true };
            } else {
                stack.pop();
            }
            const cellset = new Set();
            let linkdfs = function (c) {
                if (c.isnull || !isInside(c) || cellset.has(c)) { return; }
                cellset.add(c);
                for (let d = 0; d < 4; d++) {
                    let nb = offset(c, .5, 0, d);
                    let nc = offset(c, 1, 0, d);
                    if (nb.isnull || nc.isnull) { continue; }
                    if (isLink(nb) && isLinkable(c, nb, nc)) {
                        linkdfs(nc);
                    }
                }
            }
            linkdfs(c);
            if (!v) {
                cellset.forEach(cl => {
                    ord.set(cl, ord.get(c));
                    if (cl.qnum !== CQNUM.none) {
                        clg.set(ord.get(cl), [...clg.get(ord.get(cl)), cl.qnum]);
                        clt.set(ord.get(cl), [...clt.get(ord.get(cl)), cl.qnum]);
                    }
                    fth.set(cl, f);
                });
                cgn.set(ord.get(c), cellset.size);
                ctn.set(ord.get(c), cellset.size);
            }
            let fn = function (c, nb, nc) {
                if (nc.isnull || isSide(nb)) { return; }
                if (!isLink(nb) && clg.get(ord.get(c)).includes(cellset.size)) {
                    sidelist.push(nb);
                    return;
                }
                if (nc === f || f !== null && ord.get(f) === ord.get(nc) || !isLinkable(c, nb, nc)) { return; }
                if (ord.get(c) === ord.get(nc)) { return; }
                if (!isLink(nb) && isSideable(c, nb, nc) && ord.has(nc)) {
                    let cl = clg.get(ord.get(c)), cln = clg.get(ord.get(nc));
                    if (OneNumPerRegion && cl.length > 0 && cln.length > 0) {
                        sidelist.push(nb);
                    }
                    cl = cl.filter(n => n !== CQNUM.quesmark);
                    cln = cln.filter(n => n !== CQNUM.quesmark);
                    if (cl.some(n1 => cln.some(n2 => n1 !== n2))) {
                        sidelist.push(nb);
                    }
                    if ([...cl, ...cln].some(n => n < cgn.get(ord.get(c)) + cgn.get(ord.get(nc)))) {
                        sidelist.push(nb);
                    }
                }
                if (!isLinkable(c, nb, nc)) { return; }
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
                    if (!vst.has(ordnc)) {
                        ctn.set(ordc, ctn.get(ordc) + ctn.get(ordnc));
                        clt.set(ordc, [...clt.get(ordc), ...clt.get(ordnc)]);
                        vst.add(ordnc);
                    }
                    if (ordc < low.get(ordnc)) {
                        let siz = function (cl) {
                            if (OneNumPerRegion) {
                                cl = cl.map(n => n === CQNUM.quesmark ? 1 : n);
                            }
                            if (!OneNumPerRegion) {
                                cl = cl.filter(n => n !== CQNUM.quesmark);
                                cl = Array.from(new Set(cl));
                            }
                            return cl.reduce((a, b) => a + b, 0);
                        }
                        let cl = clt.get(ordnc);
                        if (siz(cl) > ctn.get(ordnc)) {
                            linklist.push(nb);
                        }
                        let ocl = [];
                        acl.forEach(n => {
                            if (cl.includes(n)) {
                                cl.splice(cl.indexOf(n), 1);
                            }
                            else {
                                ocl.push(n);
                            }
                        });
                        if (siz(ocl) > an - ctn.get(ordnc)) {
                            linklist.push(nb);
                        }
                    }
                }
            };
            for (let c of cellset) {
                for (let d = 0; d < 4; d++) {
                    let nb = offset(c, .5, 0, d);
                    let nc = offset(c, 1, 0, d);
                    fn(c, nb, nc);
                }
            }
        }
    }
    forEachCell(cell => {
        if (ord.has(cell)) { return; }
        acl = [];
        an = 0;
        let cset = new Set();
        let fn = function (c) {
            if (cset.has(c)) { return; }
            cset.add(c);
            an++;
            if (c.qnum !== CQNUM.none) {
                acl.push(c.qnum);
            }
            fourside((nb, nc) => {
                if (nb.isnull || nc.isnull) { return; }
                if (isSide(nb) || !isLinkable(c, nb, nc)) { return; }
                fn(nc);
            }, c.adjborder, c.adjacent);
        };
        fn(cell);
        dfs(cell);
    });
    sidelist.forEach(b => add_side(b));
    linklist.forEach(b => add_link(b));
}
function StripRegion_cell({ isShaded, add_unshaded } = {}) {
    forEachCell(cell => {
        let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
        if (templist.some(c => c.isnull)) { return; }
        // can't be over 2 shades in each 2*2
        if (templist.filter(c => isShaded(c)).length === 2) {
            templist.forEach(c => add_unshaded(c));
        }
    });
}
function RectRegion_Cell({ isShaded, isUnshaded, add_shaded, add_unshaded, isSizeAble = (w, h, sc, c) => true } = {}) {
    forEachCell(cell => {
        if (isShaded(cell) || isUnshaded(cell)) { return; }
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
    });
    // record the (un)shade count in (0,0) to (a,b)
    let scnt = Array.from(new Array(board.rows), () => new Array(board.cols).fill(0));
    let ucnt = Array.from(new Array(board.rows), () => new Array(board.cols).fill(0));
    for (let i = 0; i < board.rows; i++) {
        for (let j = 0; j < board.cols; j++) {
            scnt[i][j] = (b => isShaded(b) ? 1 : 0)(board.getc(2 * j + 1, 2 * i + 1));
            scnt[i][j] += (i > 0 ? scnt[i - 1][j] : 0) + (j > 0 ? scnt[i][j - 1] : 0) - (i > 0 && j > 0 ? scnt[i - 1][j - 1] : 0);
            ucnt[i][j] = (b => isUnshaded(b) ? 1 : 0)(board.getc(2 * j + 1, 2 * i + 1));
            ucnt[i][j] += (i > 0 ? ucnt[i - 1][j] : 0) + (j > 0 ? ucnt[i][j - 1] : 0) - (i > 0 && j > 0 ? ucnt[i - 1][j - 1] : 0);
        }
    }
    // check if there can be a rectangle exactly between c1 and c2
    let isRectAble = function (c1, c2) {
        if (c1.isnull || c2.isnull) { return 0; }
        let [x1, x2] = [(c1.bx - 1) / 2, (c2.bx - 1) / 2].sort((x, y) => x - y);
        let [y1, y2] = [(c1.by - 1) / 2, (c2.by - 1) / 2].sort((x, y) => x - y);
        let f = (a, b) => a < 0 || b < 0 ? 0 : ucnt[Math.min(a, board.rows - 1)][Math.min(b, board.cols - 1)];
        return f(y2, x2) - f(y1 - 1, x2) - f(y2, x1 - 1) + f(y1 - 1, x1 - 1) === 0;
    }
    let isRectAble2 = function (c1, c2, dir = ['L', 'U', 'R', 'D']) {
        if (c1.isnull || c2.isnull) { return 0; }
        let [x1, x2] = [(c1.bx - 1) / 2, (c2.bx - 1) / 2].sort((x, y) => x - y);
        let [y1, y2] = [(c1.by - 1) / 2, (c2.by - 1) / 2].sort((x, y) => x - y);
        let f = (a, b) => a < 0 || b < 0 ? 0 : scnt[Math.min(a, board.rows - 1)][Math.min(b, board.cols - 1)];
        if (dir.includes('L') && f(y2, x1 - 1) - f(y2, x1 - 2) - f(y1 - 1, x1 - 1) + f(y1 - 1, x1 - 2) !== 0) { return false; }
        if (dir.includes('U') && f(y1 - 1, x2) - f(y1 - 2, x2) - f(y1 - 1, x1 - 1) + f(y1 - 2, x1 - 1) !== 0) { return false; }
        if (dir.includes('R') && f(y2, x2 + 1) - f(y2, x2) - f(y1 - 1, x2 + 1) + f(y1 - 1, x2) !== 0) { return false; }
        if (dir.includes('D') && f(y2 + 1, x2) - f(y2, x2) - f(y2 + 1, x1 - 1) + f(y2, x1 - 1) !== 0) { return false; }
        return true;
    }
    forEachCell(cell => {
        if (!isShaded(cell) && cell.qnum <= 0) { return; }
        if (isShaded(cell.adjborder.top)) { return; }
        if (isShaded(cell.adjborder.left)) { return; }
        let wid = 1, hei = 1;
        while (isShaded(offset(cell, wid, 0))) { wid++; }
        while (isShaded(offset(cell, 0, hei))) { hei++; }
        let sc = null;
        for (let dx = 0; dx < wid; dx++) {
            for (let dy = 0; dy < hei; dy++) {
                if (offset(cell, dx, dy).qnum >= 0) {
                    sc = offset(cell, dx, dy);
                }
            }
        }
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
        if (!isShaded(cell) && rectlist.length === 0) {
            add_unshaded(cell);
        }
        if (!isShaded(cell) || rectlist.length === 0) { return; }
        let ml = rectlist.reduce((m, obj) => Math.max(m, obj.dl), -board.cols);
        let mu = rectlist.reduce((m, obj) => Math.max(m, obj.du), -board.rows);
        let mr = rectlist.reduce((m, obj) => Math.min(m, obj.dr), +board.cols);
        let md = rectlist.reduce((m, obj) => Math.min(m, obj.dd), +board.rows);
        for (let j = ml; j <= mr; j++) { add_shaded(offset(cell, j, 0)); }
        for (let j = mu; j <= md; j++) { add_shaded(offset(cell, 0, j)); }
        if (rectlist.every(obj => obj.dl === ml)) { add_unshaded(offset(cell, ml - 1, 0)); }
        if (rectlist.every(obj => obj.dr === mr)) { add_unshaded(offset(cell, mr + 1, 0)); }
        if (rectlist.every(obj => obj.du === mu)) { add_unshaded(offset(cell, 0, mu - 1)); }
        if (rectlist.every(obj => obj.dd === md)) { add_unshaded(offset(cell, 0, md + 1)); }
    });
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
    forEachCell(c => { if (adjlist(c.adjborder).every(b => b.isnull || b.qsub !== BQSUB.link)) emptycnt++; });
    forEachCell(cell => {
        if (isLink(cell.adjborder.top)) { return; }
        if (isLink(cell.adjborder.left)) { return; }
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
            .every(b => b.isnull || b.qans)) { return; }
        // ignore empty cell when there are too many
        if (emptycnt > 500 && sc === null) { return; }
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
        if (rectlist.length === 0) { return; }
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
    });
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
    if (checklist.some(f => f.name === "checkConnectUnshadeOutside")) {
        CellConnected({
            isShaded: isGreen,
            isUnshaded: isBlack,
            add_shaded: add_green,
            add_unshaded: add_black,
            OutsideAsShaded: true,
        });
    }
    if (checklist.some(f => f.name === "checkConnectShade") &&
        checklist.some(f => f.name === "checkConnectUnshadeRB" || f.name === "checkConnectUnshade" || f.name === "checkConnectUnshadeOutside")) {
        NoCheckerCell({
            isShaded: isBlack,
            isUnshaded: isGreen,
            add_shaded: add_black,
            add_unshaded: add_green,
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
        forEachCell(c => { if (c.qnum === CQNUM.wcir) add_green(c); })
    }
    if (checklist.some(f => f.name === "checkShadeOnCircle")) {
        forEachCell(c => { if (c.qnum === CQNUM.bcir) add_black(c); })
    }
    if (checklist.some(f => f.name === "checkUnshadeSquare")) {
        RectRegion_Cell({
            isShaded: isGreen,
            isUnshaded: isBlack,
            add_shaded: add_green,
            add_unshaded: add_black,
            isSizeAble: (w, h, sc, c) => w === h,
        })
    }
    if (checklist.some(f => f.name === "checkBorderCross")) {
        NoCrossingBorder();
    }
    if (checklist.some(f => f.name === "checkNumberAndUnshadeSize")) {
        forEachCell(c => { if (c.qnum !== CQNUM.none) add_green(c); })
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
    if (checklist.some(f => f.name === "checkSideAreaShadeCell")) {
        forEachCell(c => {
            if (!isBlack(c)) { return; }
            for (let d = 0; d < 4; d++) {
                let nb = offset(c, 0.5, 0, d);
                let nc = offset(c, 1, 0, d)
                if (!nb.isnull && nb.ques) {
                    add_green(nc);
                }
            }
        });
    }

}

// assist for certain genre
function AntMillAssist() {
    BlackDomino();
    const squ = 1, crs = 2;
    let isDominoAble = function (border) {
        if (border.isnull) { return false; }
        if (isGreen(border.sidecell[0]) || isGreen(border.sidecell[1])) { return false; }
        if (border.ques === crs) { return false; }
        let clist, nclist;
        if (border.isvert) {
            clist = [offset(border, +1.5, +1), offset(border, +1.5, -1), offset(border, -1.5, +1), offset(border, -1.5, -1)];
            nclist = [offset(border, +1.5, 0), offset(border, -1.5, 0), offset(border, +.5, +1), offset(border, +.5, -1), offset(border, -.5, +1), offset(border, -.5, -1)];
        } else {
            clist = [offset(border, +1, +1.5), offset(border, -1, +1.5), offset(border, +1, -1.5), offset(border, -1, -1.5)];
            nclist = [offset(border, 0, +1.5), offset(border, 0, -1.5), offset(border, +1, +.5), offset(border, -1, +.5), offset(border, +1, -.5), offset(border, -1, -.5)];
        }
        clist = clist.filter(c => !c.isnull && !isGreen(c));
        return clist.length >= 2 && nclist.every(c => !isBlack(c));
    }
    forEachBorder(border => {
        if (border.ques === squ) {
            if (isBlack(border.sidecell[0])) { add_black(border.sidecell[1]); }
            if (isBlack(border.sidecell[1])) { add_black(border.sidecell[0]); }
            if (isGreen(border.sidecell[0])) { add_green(border.sidecell[1]); }
            if (isGreen(border.sidecell[1])) { add_green(border.sidecell[0]); }
            if (!isDominoAble(border)) {
                add_green(border.sidecell[0]);
                add_green(border.sidecell[1]);
            }
        }
        if (border.ques === crs) {
            if (isBlack(border.sidecell[0])) { add_green(border.sidecell[1]); }
            if (isBlack(border.sidecell[1])) { add_green(border.sidecell[0]); }
            if (isGreen(border.sidecell[0])) { add_black(border.sidecell[1]); }
            if (isGreen(border.sidecell[1])) { add_black(border.sidecell[0]); }
        }
        if (isBlack(border.sidecell[0]) && isBlack(border.sidecell[1])) {
            let clist;
            if (border.isvert) {
                clist = [offset(border, +1.5, +1), offset(border, +1.5, -1), offset(border, -1.5, +1), offset(border, -1.5, -1)];
            } else {
                clist = [offset(border, +1, +1.5), offset(border, -1, +1.5), offset(border, +1, -1.5), offset(border, -1, -1.5)];
            }
            clist = clist.filter(c => !c.isnull && !isGreen(c));
            if (clist.length === 2) {
                clist.forEach(c => add_black(c));
            }
            if (clist.filter(c => isBlack(c)).length === 2) {
                clist.forEach(c => add_green(c));
            }
        }
    });
    forEachCell(cell => {
        for (let d = 0; d < 4; d++) {
            if (isBlack(cell) && !isDominoAble(offset(cell, .5, 0, d))) {
                add_green(offset(cell, 1, 0, d));
            }
        }
        if (adjlist(cell.adjborder).filter(b => b.ques === squ).length > 1) {
            add_green(cell);
        }
        if (adjlist(cell.adjborder).every(b => !isDominoAble(b))) {
            add_green(cell);
        }
    });
}

function DoubleChocoAssist() {
    SizeRegion_Border({
        isLinkable: (c, nb, nc) => c.ques === nc.ques,
        isSideable: (c, nb, nc) => c.ques === nc.ques,
    });
}

function MyopiaAssist() {
    SingleLoopInBorder();
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            if (cell.qnum === 15 && board.linegraph.components.length > 0 && adjlist(cell.adjborder).every(b => !b.line)) {
                adjlist(cell.adjborder).forEach(b => add_cross(b));
            }
            let arr = [0b0001, 0b0100, 0b0010, 0b1000].map(n => (cell.qnum & n) !== 0);
            let dist = [];
            for (let di = 0.5; di < Math.min(board.rows, board.cols); di++) {
                let temp = [0, 1, 2, 3].map(n => offset(cell, 0, -di, n));
                if (temp.some((b, i) => b.isnull && arr[i])) { break; }
                if (temp.some((b, i) => b.line && !arr[i])) { break; }
                if (temp.every((b, i) => !arr[i] || !b.isnull && b.qsub !== BQSUB.cross)) {
                    dist.push(di);
                }
                if (temp.some((b, i) => b.line && arr[i])) { break; }
            }
            let l = dist.reduce((a, b) => Math.min(a, b), Math.min(board.rows, board.cols));
            for (let di = 0.5; di <= l; di++) {
                let temp = [0, 1, 2, 3].map(n => offset(cell, 0, -di, n));
                temp.forEach((b, i) => {
                    if (di < l || !arr[i]) {
                        add_cross(b);
                    }
                    if (dist.length === 1 && di === l && arr[i]) {
                        add_line(b);
                    }
                });
            }
        }
    });
}

function PutteriaAssist() {
    forEachCell(cell => {
        if (cell.qnum === CQNUM.quesmark) {
            add_dot(cell);
        }
        if (cell.qnum !== CQNUM.quesmark && cell.qnum !== CQNUM.none) {
            add_number(cell, cell.qnum);
        }
        if (cell.anum !== CANUM.none) {
            fourside((nc) => {
                add_dot(nc);
            }, cell.adjacent);
        }
        // 2 2    2·2
        // 2 2 -> 2·2
        for (let d = 0; d < 4; d++) {
            let list = [cell, offset(cell, 0, 1, d), offset(cell, 2, 0, d), offset(cell, 2, 1, d)];
            if (list.every(c => !c.isnull && c.room.clist.length === 2)) {
                add_dot(offset(cell, 1, 0, d));
                add_dot(offset(cell, 1, 1, d));
            }
        }
    });
    forEachRoom(room => {
        let clist = [];
        for (let j = 0; j < room.clist.length; j++) {
            if (room.clist[j].qsub === CQSUB.dot || room.clist[j].qnum === CQNUM.quesmark) { continue; }
            clist.push(room.clist[j]);
        }
        if (clist.some(c => c.anum !== CANUM.none)) {
            clist.forEach(c => add_dot(c));
        }
        if (clist.length === 1) {
            add_number(clist[0], room.clist.length);
            return;
        }
        if (clist.length === 2) {
            for (let d = 0; d < 4; d++) {
                if (offset(clist[0], 1, 1, d) === clist[1]) {
                    add_dot(offset(clist[0], 0, 1, d));
                    add_dot(offset(clist[0], 1, 0, d));
                }
                if (offset(clist[0], 2, 0, d) === clist[1]) {
                    add_dot(offset(clist[0], 1, 0, d));
                }
            }
        }
        if (clist.length > 0 && clist.every(c => c.bx === clist[0].bx)) {
            for (let j = 0; j < board.rows; j++) {
                let ac = board.getc(clist[0].bx, j * 2 + 1);
                if (ac.room !== room && ac.room.clist.length === room.clist.length) {
                    add_dot(ac);
                }
            }
        }
        if (clist.length > 0 && clist.every(c => c.by === clist[0].by)) {
            for (let i = 0; i < board.cols; i++) {
                let ac = board.getc(i * 2 + 1, clist[0].by);
                if (ac.room !== room && ac.room.clist.length === room.clist.length) {
                    add_dot(ac);
                }
            }
        }
    });
    let fn = function (clist) {
        let set = new Set();
        clist.forEach(cell => {
            if (cell.anum !== CANUM.none) {
                set.add(cell.anum);
            }
        });
        clist.forEach(cell => {
            if (set.has(cell.room.clist.length)) {
                add_dot(cell);
            }
        });
    }
    for (let i = 0; i < board.cols; i++) {
        let clist = [];
        for (let j = 0; j < board.rows; j++) {
            clist.push(board.getc(i * 2 + 1, j * 2 + 1));
        }
        fn(clist);
    }
    for (let j = 0; j < board.rows; j++) {
        let clist = [];
        for (let i = 0; i < board.cols; i++) {
            clist.push(board.getc(i * 2 + 1, j * 2 + 1));
        }
        fn(clist);
    }
}

function FillominoAssist() {
    SizeRegion_Border();
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none && cell.qnum !== CQNUM.quesmark) { add_number(cell, cell.qnum); }
        if (cell.anum !== CANUM.none) {
            fourside((nb, nc) => {
                if (nb.isnull || nc.isnull) { return; }
                if (nc.anum === cell.anum) {
                    add_link(nb);
                }
                if (nc.anum !== CANUM.none && nc.anum !== cell.anum) {
                    add_side(nb);
                }
                if (nb.qsub === BQSUB.link) {
                    add_number(nc, cell.anum);
                }
            }, cell.adjborder, cell.adjacent);
            let clist = [];
            let dfs = function (c) {
                if (clist.includes(c)) { return; }
                clist.push(c);
                fourside((nb, nc) => {
                    if (!nb.qans && !nc.isnull && (nc.anum === cell.anum || nc.anum === CANUM.none)) { dfs(nc); }
                }, c.adjborder, c.adjacent);
            };
            dfs(cell);
            if (clist.length === cell.anum) {
                clist.forEach(c => add_number(c, cell.anum));
            }
        }
        if (cell.anum === CANUM.none) {
            let temp = adjlist(cell.adjborder, cell.adjacent);
            temp = temp.filter(([nb, nc]) => !nb.isnull && !nc.isnull && nc.anum !== CANUM.none);
            temp = temp.map(([nb, nc]) => nc.anum);
            temp.forEach(n => {
                if (temp.filter(nn => nn === n).length <= 1) { return; }
                let clist = [];
                let dfs = function (c) {
                    if (clist.includes(c)) { return; }
                    clist.push(c);
                    fourside((nb, nc) => {
                        if (!nc.isnull && nc.anum === n) { dfs(nc); }
                    }, c.adjborder, c.adjacent);
                };
                dfs(cell);
                if (clist.length > n) {
                    fourside((nb, nc) => {
                        if (!nc.isnull && nc.anum === n) {
                            add_side(nb);
                        }
                    }, cell.adjborder, cell.adjacent);
                }
            })
        }
    });
}

function NawabariAssist() {
    RectRegion_Border({
        isSizeAble: (w, h, sc, c) => {
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    if (offset(c, i, j).qnum === CQNUM.none) { continue; }
                    if (sc !== null && sc !== offset(c, i, j)) { return false; }
                    sc = offset(c, i, j);
                }
            }
            if (sc === null) { return false; }
            let sn = 0;
            sn += (c.bx === sc.bx ? 1 : 0);
            sn += (c.by === sc.by ? 1 : 0);
            sn += (c.bx + (w - 1) * 2 === sc.bx ? 1 : 0);
            sn += (c.by + (h - 1) * 2 === sc.by ? 1 : 0);
            return sc.qnum === CQNUM.quesmark || sc.qnum === sn;
        }
    });
}

function BarnsAssist() {
    SingleLoopInCell({
        isPass: c => true,
        isPathable: b => !b.isnull && !b.ques && b.qsub !== BQSUB.cross,
    });
}

function MinarismAssist() {
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_number(cell, cell.qnum);
        }
    });
    forEachCell(cell => {
        if (cell.anum !== -1) { return; }
        let arr = () => Array(size).fill().map((_, i) => i + 1);
        let cand = arr(), row = arr(), col = arr();
        forEachCell(c => {
            if (cell === c) { return; }
            let b = c.anum === -1 && c.snum.every(n => n === -1);
            if (cell.bx === c.bx) { col = b ? [] : col.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (cell.by === c.by) { row = b ? [] : row.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (c.anum === -1) { return; }
            if (cell.bx === c.bx || cell.by === c.by) {
                cand = cand.filter(n => n !== c.anum);
            }
        });
        if (col.length === 1) { add_number(cell, col[0]); return; }
        if (row.length === 1) { add_number(cell, row[0]); return; }
        if (cell.snum.some(n => n !== -1)) {
            add_candidate(cell, cell.snum.filter(n => cand.includes(n)).sort((a, b) => (a - b)));
            cand = cand.filter(n => cell.snum.includes(n));
        }
        if (cell.snum.filter(n => n !== -1).length === 1) {
            add_number(cell, cell.snum.find(n => n !== -1));
            return;
        }
        for (let d = 0; d < 4; d++) {
            if (offset(cell, .5, 0, d).isnull) { continue; }
            let ncell = offset(cell, 1, 0, d);
            let nlist = arr();
            if (ncell.snum.some(n => n !== -1)) { nlist = ncell.snum.filter(n => n !== -1); }
            if (ncell.anum !== -1) { nlist = [ncell.anum]; }
            if (offset(cell, .5, 0, d).qnum !== BQNUM.none) {
                let dt = offset(cell, .5, 0, d).qnum;
                cand = cand.filter(n => nlist.includes(n - dt) || nlist.includes(n + dt));
            }
            if ([4, 1, 3, 2][d] === offset(cell, .5, 0, d).qdir) {
                cand = cand.filter(n => nlist.some(m => n > m));
            }
            if ([3, 2, 4, 1][d] === offset(cell, .5, 0, d).qdir) {
                cand = cand.filter(n => nlist.some(m => n < m));
            }
        }
        if (cand.length <= 4) {
            add_candidate(cell, cand);
        }
    });
}

function KropkiAssist() {
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_number(cell, cell.qnum);
        }
    });
    forEachCell(cell => {
        if (cell.anum !== -1) { return; }
        let arr = () => Array(size).fill().map((_, i) => i + 1);
        let cand = arr(), row = arr(), col = arr();
        forEachCell(c => {
            if (cell === c) { return; }
            let b = c.anum === -1 && c.snum.every(n => n === -1);
            if (cell.bx === c.bx) { col = b ? [] : col.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (cell.by === c.by) { row = b ? [] : row.filter(n => n !== c.anum && !c.snum.includes(n)); }
            if (c.anum === -1) { return; }
            if (cell.bx === c.bx || cell.by === c.by) {
                cand = cand.filter(n => n !== c.anum);
            }
        });
        if (col.length === 1) { add_number(cell, col[0]); return; }
        if (row.length === 1) { add_number(cell, row[0]); return; }
        if (cell.snum.some(n => n !== -1)) {
            add_candidate(cell, cell.snum.filter(n => cand.includes(n)).sort((a, b) => (a - b)));
            cand = cand.filter(n => cell.snum.includes(n));
        }
        if (cell.snum.filter(n => n !== -1).length === 1) {
            add_number(cell, cell.snum.find(n => n !== -1));
            return;
        }
        for (let d = 0; d < 4; d++) {
            if (offset(cell, .5, 0, d).isnull) { continue; }
            let ncell = offset(cell, 1, 0, d);
            let nlist = arr();
            if (ncell.snum.some(n => n !== -1)) { nlist = ncell.snum.filter(n => n !== -1); }
            if (ncell.anum !== -1) { nlist = [ncell.anum]; }
            if (offset(cell, .5, 0, d).qnum === BQNUM.wcir) {
                cand = cand.filter(n => nlist.includes(n - 1) || nlist.includes(n + 1));
            }
            if (offset(cell, .5, 0, d).qnum === BQNUM.bcir) {
                cand = cand.filter(n => nlist.includes(n / 2) || nlist.includes(n * 2));
            }
            if (offset(cell, .5, 0, d).qnum === BQNUM.none) {
                cand = cand.filter(n => nlist.some(m => ![n - 1, n + 1, n / 2, n * 2].includes(m)));
            }
        }
        if (cand.length <= 4) {
            add_candidate(cell, cand);
        }
    });
}

function MidloopAssist() {
    SingleLoopInCell({
        isPass: c => c.qnum === CQNUM.bcir,
    });
    let isDot = c => !c.isnull && c.qnum === CQNUM.bcir;
    forEachCell(cell => {
        for (let d = 0; d < 4; d++) {
            if (isDot(cell) && offset(cell, .5, .5, d).qsub !== CRQSUB.none) {
                add_inout(offset(cell, -.5, -.5, d), offset(cell, .5, .5, d).qsub ^ 1);
            }
        }
    });
    for (let i = board.minbx + 1; i <= board.maxbx - 1; i++) {
        for (let j = board.minby + 1; j <= board.maxby - 1; j++) {
            let obj = board.getobj(i, j);
            if (!isDot(obj)) { continue; }
            let d, b1, b2;
            if (i % 2 === 0 && j % 2 === 0) { continue; }
            if (i % 2 === 0 || j % 2 === 0) {
                add_line(obj);
                d = (i % 2 === 0 ? 0 : 1);
                b1 = b2 = obj;
            }
            if (i % 2 === 1 && j % 2 === 1) {
                if (adjlist(obj.adjborder).every(b => !b.isnull && !b.line && b.qsub !== BQSUB.cross) &&
                    [offset(obj, 0, -.5), offset(obj, 0, -1), offset(obj, 0, +.5), offset(obj, 0, +1),
                    offset(obj, -.5, 0), offset(obj, -1, 0), offset(obj, +.5, 0), offset(obj, +1, 0),].every(obj => !isDot(obj))) { continue; }
                if ([obj.adjborder.top, obj.adjborder.bottom].some(b => b.isnull || b.qsub === BQSUB.cross) ||
                    [obj.adjborder.left, obj.adjborder.right].some(b => !b.isnull && b.line) ||
                    [offset(obj, 0, -.5), offset(obj, 0, -1),
                    offset(obj, 0, +.5), offset(obj, 0, +1),].some(obj => isDot(obj))) {
                    d = 0;
                    b1 = obj.adjborder.left;
                    b2 = obj.adjborder.right;
                } else {
                    d = 1;
                    b1 = obj.adjborder.top;
                    b2 = obj.adjborder.bottom;
                }
                add_line(b1);
                add_line(b2);
            }
            while (!b1.isnull && !b2.isnull && (b1.line || b2.line)) {
                add_line(b1);
                add_line(b2);
                b1 = offset(b1, -1, 0, d);
                b2 = offset(b2, +1, 0, d);
                if (b1.qsub === BQSUB.cross || b2.qsub === BQSUB.cross ||
                    b1.isnull || b2.isnull ||
                    [offset(b1, -.5, 0, d), offset(b1, -1, 0, d),
                    offset(b2, +.5, 0, d), offset(b2, +1, 0, d),].some(obj => isDot(obj))) {
                    add_cross(b1);
                    add_cross(b2);
                }
            }
        }
    }
}

function PipelinkAssist() {
    forEachCell(cell => {
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
    forEachCell(cell => {
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
    forEachCell(cell => {
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
    forEachCell(cell => {
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
    forEachCell(cell => {
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_number(cell, cell.qnum);
        }
    });
    forEachCell(cell => {
        if (cell.anum !== -1) { return; }
        let arr = () => Array(size).fill().map((_, i) => i + 1);
        let cand = arr(), row = arr(), col = arr(), box = arr();
        forEachCell(c => {
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
    forEachCell(c => { if (c.qnum === CQNUM.wcir) add_green(c); });
    forEachCell(c => { if (c.qnum === CQNUM.bcir) add_black(c); });
    No2x2Black();
    BlackConnected();
    RectRegion_Cell({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: add_black,
        isSizeAble: (w, h, sc, c) => w === h,
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
    forEachCell(cell => {
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
    });
    let isTipAble = function (c, dir) {
        if (c.isnull || cllist.includes(c) && c.anum !== dir || isGreen(c)) {
            return false;
        }
        return true;
    }
    forEachCell(cell => {
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
            let d = qdirRemap(cell.anum);
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
            if (nc.anum !== CANUM.none && offset(nc, 0, 1, qdirRemap(nc.anum)) !== cell) { return true; }
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
    });
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
    forEachCell(cell => {
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
        if (cell.qnum === CQNUM.none) { return; }
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
    });
}

function ShikakuAssist() {
    let s = Array.from(new Array(board.rows), () => new Array(board.cols).fill([]));
    forEachCell(c => {
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
        isSizeAble: (w, h, sc, c) => w === h,
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
    forEachCell(cell => {
        if (cell.qnum === CQNUM.none) { return; }
        add_dot(cell);
        let templist = adjlist(cell.adjacent);
        if (templist.filter(c => !isNotBlack(c)).length === 1) {
            templist.forEach(c => add_black(c, true));
        }
        if (cell.qnum === CQNUM.quesmark) { return; }
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
    });
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
    forEachCell(cell => {
        if (!isDot(cell) && adjlist(cell.adjborder).filter(b => !b.isnull && !b.qans).length === 1) {
            add_link(adjlist(cell.adjborder).filter(b => !b.isnull && !b.qans)[0]);
        }
        if (!isEmpty(cell) || id.has(cell)) { return; }
        if (id_choice.has(cell) && id_choice.get(cell).length === 1) {
            bfs_id([cell], id_choice.get(cell)[0]);
        }
    });
    document.querySelector('#btncolor').click();
}

function NorinuriAssist() {
    forEachCell(c => { if (c.qnum !== CQNUM.none) add_green(c); })
    BlackDomino();
    SizeRegion_Cell({
        isShaded: isGreen,
        isUnshaded: isBlack,
        add_shaded: add_green,
        add_unshaded: c => add_black(c, true),
    });
}

function NorinoriAssist() {
    BlackDomino();
    forEachRoom(room => {
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
    });
}

function AllorNothingAssist() {
    let add_color = function (c, color) {
        if (c.isnull || c.qsub !== CQSUB.none) { return; }
        if (step && flg) { return; }
        flg = true;
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
    forEachRoom(room => {
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
    });
}

function AqreAssist() {
    BlackConnected();
    forEachCell(cell => {
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
    });
    forEachRoom(room => {
        let qnum = room.top.qnum;
        if (qnum === CQNUM.none || qnum === CQNUM.quesmark) { return; }
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
    });
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
    });
}

function HitoriAssist() {
    GreenConnected();
    BlackNotAdjacent();
    let uniq = new Map();
    forEachCell(cell => uniq.set(cell, true));
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
    forEachCell(cell => {
        if (uniq.get(cell)) add_green(cell);
    });
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
    });
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
    forEachCell(cell => {
        if (cell.qnums.length === 0) { return; }
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
            return;
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
    });
}

function LightandShadowAssist() {
    let add_black = function (c) {
        if (c.isnull || c.qans !== CQANS.none) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQans(CQANS.black);
        c.draw();
    };
    let add_white = function (c) {
        if (c.isnull || c.qans !== CQANS.none) { return; }
        if (step && flg) { return; }
        flg = true;
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none && cell.ques === 1) {
            add_black(cell);
        }
        if (cell.qnum !== CQNUM.none && cell.ques === 0) {
            add_white(cell);
        }
    });
}

function SlalomAssist() {
    SingleLoopInCell({
        isPassable: c => c.ques !== 1,
        isPass: c => c.bx === board.startpos.bx && c.by === board.startpos.by,
    });
    forEachCell(cell => {
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
    });
}

function StarbattleAssist() {
    let isCircle = b => !b.isnull && b.qsub === 1;
    let isStar = isBlack;
    let starcount = board.starCount.count;
    let add_star = add_black;
    let add_cir = function (b) {
        if (b === undefined || b.isnull || b.line || b.qsub !== BQSUB.none) { return; }
        if (step && flg) { return; }
        if (b.bx % 2 === 0 && b.by % 2 === 0) {
            if (adjlist(b.adjborder).some(b => isCircle(b))) { return; }
        }
        if (b.bx === board.minbx) { b = offset(b, +.5, 0); }
        if (b.bx === board.maxbx) { b = offset(b, -.5, 0); }
        if (b.by === board.minby) { b = offset(b, 0, +.5); }
        if (b.by === board.maxby) { b = offset(b, 0, -.5); }
        if (b.bx % 2 === 1 && b.by % 2 === 1) {
            add_star(b);
            return;
        }
        b.setQsub(1);
        b.draw();
        flg |= b.qsub === 1;
    };
    if (board.rows === starcount * 4) {
        let ct = board.getobj(board.cols, board.rows);
        for (let i = 0; i < starcount; i++) {
            for (let j = 0; j < starcount; j++) {
                for (let d = 0; d < 4; d++) {
                    add_cir(offset(ct, 2 * i + 1, 2 * j + 1, d));
                    add_dot(offset(ct, 2 * i + 0.5, 2 * j + 0.5, d));
                    add_dot(offset(ct, 2 * i + 1.5, 2 * j + 1.5, d));
                }
            }
        }
    }
    // try covering area with 2*2
    let tryCovering = function (clist, n = starcount) {
        clist = clist.filter(c => !isDot(c));
        if (clist.filter(c => c.qsub !== CQSUB.dot).length <= n * 4) {
            let fg = false;
            let dfs = function (list = [], dlist = []) {
                if (list.filter(c => clist.includes(c)).length + (n - dlist.length) * 4 < clist.length) { return; }
                if (dlist.length === n) {
                    dlist.forEach(b => add_cir(b));
                    list.forEach(c => {
                        if (!clist.includes(c)) {
                            add_dot(c);
                        }
                    });
                    fg = true;
                }
                if (fg) { return; }
                let c = clist.find(cc => !list.includes(cc));
                if (c === undefined) { return; }
                for (let d = 0; d < 4; d++) {
                    let l = [c, offset(c, 1, 0, d), offset(c, 0, 1, d), offset(c, 1, 1, d)].filter(cc => !c.isnull);
                    if (l.some(cc => list.includes(cc))) { continue; }
                    dfs([...list, ...l], [...dlist, offset(c, .5, .5, d)]);
                    if (fg) { return; }
                }
            };
            dfs();
        }
    };
    for (let i = 0; i < board.rows - 1; i++) {
        let hclist = [], vclist = [];
        for (let j = 0; j < board.cols; j++) {
            hclist.push(board.getc(j * 2 + 1, i * 2 + 1));
            hclist.push(board.getc(j * 2 + 1, i * 2 + 3));
            vclist.push(board.getc(i * 2 + 1, j * 2 + 1));
            vclist.push(board.getc(i * 2 + 3, j * 2 + 1));
        }
        tryCovering(hclist, starcount * 2);
        tryCovering(vclist, starcount * 2);
    }
    forEachRoom(room => {
        let clist = [];
        for (let j = 0; j < room.clist.length; j++) {
            if (!isDot(room.clist[j])) {
                clist.push(room.clist[j]);
            }
        }
        // finish room
        if (clist.filter(c => c.qans === CQANS.star).length === starcount) {
            clist.forEach(c => add_dot(c));
        }
        if (clist.filter(c => c.qsub !== CQSUB.dot).length === starcount) {
            clist.forEach(c => add_star(c));
        }
        tryCovering(clist);
    });
    for (let i = 0; i < board.rows; i++) {
        let hcellList = [];
        let vcellList = [];
        for (let j = 0; j < board.cols; j++) {
            hcellList.push(board.getc(2 * j + 1, 2 * i + 1));
            vcellList.push(board.getc(2 * i + 1, 2 * j + 1));
        }
        hcellList = hcellList.filter(c => !isDot(c));
        vcellList = vcellList.filter(c => !isDot(c));
        // finish row/col
        if (hcellList.filter(c => isStar(c) || !isStar(c) && !isStar(c.adjacent.right) &&
            isCircle(c.adjborder.right) && !isCircle(c.adjborder.left)).length === starcount) {
            hcellList.forEach(c => !isCircle(c.adjborder.left) && !isCircle(c.adjborder.right) && add_dot(c));
        }
        if (vcellList.filter(c => isStar(c) || !isStar(c) && !isStar(c.adjacent.bottom) &&
            isCircle(c.adjborder.bottom) && !isCircle(c.adjborder.top)).length === starcount) {
            vcellList.forEach(c => !isCircle(c.adjborder.top) && !isCircle(c.adjborder.bottom) && add_dot(c));
        }
        for (let j = 0; j < hcellList.length; j++) {
            if (hcellList[j].adjacent.right === hcellList[j + 1]) {
                hcellList[j] = [hcellList[j], hcellList[j + 1]];
                hcellList.splice(j + 1, 1);
            } else {
                hcellList[j] = [hcellList[j]];
            }
        }
        if (hcellList.length === starcount) {
            hcellList.forEach(l => {
                if (l.length === 1) {
                    add_star(l[0]);
                }
                if (l.length === 2) {
                    add_cir(l[0].adjborder.right);
                }
            });
        }
        for (let j = 0; j < vcellList.length; j++) {
            if (vcellList[j].adjacent.bottom === vcellList[j + 1]) {
                vcellList[j] = [vcellList[j], vcellList[j + 1]];
                vcellList.splice(j + 1, 1);
            } else {
                vcellList[j] = [vcellList[j]];
            }
        }
        if (vcellList.length === starcount) {
            vcellList.forEach(l => {
                if (l.length === 1) {
                    add_star(l[0]);
                }
                if (l.length === 2) {
                    add_cir(l[0].adjborder.bottom);
                }
            });
        }
    }
    forEachCell(cell => {
        if (cell.qans === CQANS.star) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    add_dot(offset(cell, dx, dy));
                }
            }
        }
    });
    // adjust circle
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
        for (let j = 0; j < 2; j++) {
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
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            // add qsub around b/w clue
            if (cell.ques === CQUES.black || cell.ques === CQUES.white) {
                for (let d = 0; d < 4; d++) {
                    add_inout(offset(cell, .5, .5, d), (cell.ques === CQUES.black ? CRQSUB.out : CRQSUB.in));
                }
            }
            // finish clue
            if (cell.qnum !== CQNUM.quesmark) {
                let d = qdirRemap(cell.qdir);
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
    });
}

function NurimisakiAssist() {
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && c.qsub === CQSUB.none && c.qans === CQANS.none;
    let isDot = c => !c.isnull && c.qsub === CQSUB.dot && c.qnum === CQNUM.none;
    let isDotEmpty = c => isEmpty(c) || isDot(c);
    let isBorderBlack = c => c.isnull || isBlack(c);
    let isConnectBlack = c => isBorderBlack(c) || c.qnum !== CQNUM.none;
    let isCircle = c => !c.isnull && c.qnum !== CQNUM.none;
    let isDotCircle = c => isDot(c) || isCircle(c);

    forEachCell(cell => {
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
    });
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
        isSizeAble: (w, h, sc, c) => {
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    if (offset(c, i, j).qnum > 0 && offset(c, i, j).qnum !== w * h) { return false; }
                }
            }
            return true;
        },
    });
    forEachCell(cell => {
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
    });
}

function CreekAssist() {
    GreenConnected();
    let dotcnt = 0;
    forEachCell(cell => {
        dotcnt += cell.qsub === CQSUB.dot;
    });
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
    forEachCell(cell => {
        if (cell.qans !== CQANS.none) { return; }
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
    });
}

function NuribouAssist() {
    forEachCell(cell => {
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
        }
        // surrounded white cell
        let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
        if (cell.qnum === CQNUM.none && templist.filter(c => isBlack(c)).length === 4) {
            add_black(cell);
        }
    });
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
        forEachCell(cell => {
            if (cell.qnum !== CQNUM.none) {
                list.push(cell);
                if (cell.qnum === CQNUM.quesmark) { return; }
                for (let dx = -cell.qnum + 1; dx <= cell.qnum - 1; dx++) {
                    for (let dy = -cell.qnum + Math.abs(dx) + 1; dy <= cell.qnum - Math.abs(dx) - 1; dy++) {
                        let c = offset(cell, dx, dy);
                        if (c.isnull || list.includes(c)) { continue; }
                        list.push(c);
                    }
                }
            }
        });
        if (!list.some(c => c.qnum === CQNUM.quesmark)) {
            forEachCell(cell => {
                if (!list.includes(cell)) {
                    add_black(cell);
                }
            });
        }
    }
}

function NurikabeAssist() {
    forEachCell(cell => {
        // surrounded white cell
        let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
        if (cell.qnum === CQNUM.none && templist.filter(c => isBlack(c)).length === 4) {
            add_black(cell);
        }
    });
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
        forEachCell(cell => {
            if (cell.qnum !== CQNUM.none) {
                list.push(cell);
                if (cell.qnum === CQNUM.quesmark) { return; }
                for (let dx = -cell.qnum + 1; dx <= cell.qnum - 1; dx++) {
                    for (let dy = -cell.qnum + Math.abs(dx) + 1; dy <= cell.qnum - Math.abs(dx) - 1; dy++) {
                        let c = offset(cell, dx, dy);
                        if (c.isnull || list.includes(c)) { continue; }
                        list.push(c);
                    }
                }
            }
        });
        if (!list.some(c => c.qnum === CQNUM.quesmark)) {
            forEachCell(cell => {
                if (!list.includes(cell)) {
                    add_black(cell);
                }
            });
        }
    }
}

function GuideArrowAssist() {
    BlackNotAdjacent();
    GreenConnected();
    GreenNoLoopInCell();
    let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
    forEachCell(cell => {
        if (cell === goalcell) {
            add_green(cell);
            return;
        }
        if (cell.qnum !== CQNUM.none) {
            add_green(cell);
            if (cell.qnum !== CQNUM.quesmark) {
                let d = qdirRemap(cell.qnum);
                add_green(dir(cell.adjacent, d));
            }
            return;
        }
    });
    // direction consistency
    {
        let vis = new Map();
        let dfs = function (c, d) {
            if (vis.has(c)) { return; }
            vis.set(c, d);
            for (let d1 = 0; d1 < 4; d1++) {
                if (d1 === d) { continue; }
                let c1 = dir(c.adjacent, d1);
                if (c1 === undefined || c1.isnull || c1.qsub !== CQSUB.green) { continue; }
                dfs(c1, (d1 + 2) % 4);
            }
        };
        dfs(goalcell, -1);
        forEachCell(cell => {
            if (cell.qnum === CQNUM.none || cell.qnum === CQNUM.quesmark) { return; }
            dfs(cell, qdirRemap(cell.qnum));
        });
        forEachCell(cell => {
            if (cell.qsub !== CQSUB.none || cell.qans !== CQANS.none) { return; }

            let cnt = 0;
            fourside(c => {
                if (isGreen(c) && vis.has(c)) { cnt++; }
            }, cell.adjacent);
            if (cnt >= 2) add_black(cell);
        });
    }
    // single out
    {
        let vis = new Map();
        vis.set(goalcell, -1);
        forEachCell(cell => {
            let d = (function () {
                if (cell.qnum === CQNUM.none || cell.qnum === CQNUM.quesmark) {
                    let cnt = 0;
                    let dd = -1;
                    for (let d1 = 0; d1 < 4; d1++) {
                        let c1 = dir(cell.adjacent, d1);
                        if (c1 === undefined || c1.isnull || isBlack(c1)) { continue; }
                        cnt++;
                        dd = d1;
                    }
                    if (cnt === 1) { return dd; }
                    return -1;
                }
                return qdirRemap(cell.qnum);;
            })();
            if (d === -1) { return; }
            while (true) {
                if (vis.has(cell)) { break; }
                vis.set(cell, d);
                cell = dir(cell.adjacent, d);
                add_green(cell);
                let cnt = 0;
                let dd = -1;
                for (let d1 = 0; d1 < 4; d1++) {
                    let c1 = dir(cell.adjacent, d1);
                    if (c1 === undefined || c1.isnull || isBlack(c1)) { continue; }
                    if (vis.has(c1) && vis.get(c1) === (d1 + 2) % 4) { continue; }
                    cnt++;
                    dd = d1;
                }
                if (cnt !== 1) { break; }
                d = dd;
            }
        });
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
    forEachCell(cell => {
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
    });
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
    let startcell = board.getc(board.startpos.bx, board.startpos.by);
    let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
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
        isShaded: c => {
            return c === startcell || c === goalcell || c.ques === CQUES.cir;
        },
        isUnshaded: c => isBlack(c) || c.ques === CQUES.tri,
        add_shaded: add_green,
        add_unshaded: () => { },
        isLinked: (c, nb, nc) => c.room === nc.room,
    });
    CellConnected({
        isShaded: c => {
            if (c === startcell || c === goalcell) { return c.lcnt === 0; }
            return c.lcnt == 1;
        },
        isUnshaded: c => {
            if (c === startcell || c === goalcell) { return c.lcnt === 1; }
            return c.lcnt === 2 || isBlack(c) || c.ques === CQUES.tri;
        },
        add_shaded: add_green,
        add_unshaded: () => { },
        isLinked: (c, nb, nc) => c.room === nc.room,
        cantDivideShade: n => n % 2 === 1,
        OnlyOneConnected: false,
        UnshadeEmpty: false,
    });
    let circnt = 0;
    forEachCell(cell => {
        circnt += cell.ques === CQUES.cir;
    });
    forEachRoom(room => {
        let cellList = [];
        for (let j = 0; j < room.clist.length; j++) {
            cellList.push(room.clist[j]);
        }
        if (cellList.some(c => isGreen(c) || c.ques === CQUES.cir || c.ques === CQUES.tri || c.lcnt > 0) ||
            room === startcell.room || room === goalcell.room) {
            cellList.forEach(c => add_green(c));
            return;
        }
        if (cellList.some(c => isBlack(c))) {
            cellList.forEach(c => add_black(c));
            return;
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
        if (templist.length < 2) { return; }
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
            return;
        }
        // not enough cir
        if (circnt1 + circnt2 < circnt) {
            cellList.forEach(c => add_black(c));
            return;
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
            return;
        }
    });
    forEachCell(cell => {
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
    });
    // line
    forEachCell(cell => {
        if (isBlack(cell) || cell.ques === CQUES.tri) {
            fourside(add_cross, cell.adjborder);
        }
        if (cell.qans !== CQANS.black) {
            let emptycnt = 0;
            let linecnt = 0;
            fourside((c, b) => {
                if (!c.isnull && b.qsub !== BQSUB.cross) { emptycnt++; }
                linecnt += b.line;
            }, cell.adjacent, cell.adjborder);
            if (linecnt > 0) {
                add_green(cell);
            }
            // no branch
            if (linecnt === 2 || linecnt === 1 && (cell === startcell || cell === goalcell)) {
                fourside(add_cross, cell.adjborder);
            }
            // no deadend
            if (emptycnt === 1) {
                if (cell !== startcell && cell !== goalcell) {
                    fourside(add_cross, cell.adjborder);
                } else {
                    fourside((c, b) => {
                        if (!c.isnull && b.qsub !== BQSUB.cross) {
                            add_line(b);
                        }
                    }, cell.adjacent, cell.adjborder);
                }
            }
            // 2 degree path
            if (emptycnt === 2 && cell !== startcell && cell !== goalcell && (linecnt === 1 || cell.ques === CQUES.cir)) {
                fourside((c, b) => {
                    add_line(b);
                    if (!b.isnull && b.line) {
                        add_green(c);
                    }
                }, cell.adjacent, cell.adjborder);
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
    });
}

function AquapelagoAssist() {
    No2x2Green();
    BlackNotAdjacent();
    GreenConnected();
    forEachCell(cell => {
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
    });
}

function IcebarnAssist() {
    let add_arrow = function (b, dir) {
        if (b === undefined || b.isnull || b.qsub !== BQSUB.none) { return; }
        if (step && flg) { return; }
        flg = true;
        b.setQsub(dir);
        b.draw();
    };
    let genlist = c => {
        if (c.adjborder === undefined) { return []; }
        return [[c.adjborder.top, BQSUB.arrow_up, BQSUB.arrow_dn], [c.adjborder.bottom, BQSUB.arrow_dn, BQSUB.arrow_up],
        [c.adjborder.left, BQSUB.arrow_lt, BQSUB.arrow_rt], [c.adjborder.right, BQSUB.arrow_rt, BQSUB.arrow_lt]]
    };
    let has_in = function (c) {
        let templist = genlist(c);
        templist = templist.filter(b => !b[0].isnull && b[0].line);
        return templist.some(([b, o_arr, i_arr]) => b.qsub === i_arr);
    }
    let has_out = function (c) {
        let templist = genlist(c);
        templist = templist.filter(b => !b[0].isnull && b[0].line);
        return templist.some(([b, o_arr, i_arr]) => b.qsub === o_arr);
    }
    SingleLoopInCell();
    // add cross outside except IN and OUT
    let inb = board.getb(board.arrowin.bx, board.arrowin.by);
    let outb = board.getb(board.arrowout.bx, board.arrowout.by);
    {
        add_line(inb);
        add_line(outb);
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
    let iceSet = new Set();
    forEachCell(cell => {
        // pass all ice
        if (isIce(cell) && !iceSet.has(cell)) {
            let list = [], blist = [];
            let dfs = function (c) {
                if (c.isnull || !isIce(c) || iceSet.has(c)) { return; }
                iceSet.add(c);
                list.push(c);
                fourside(b => blist.push(b), c.adjborder);
                fourside(dfs, c.adjacent);
            }
            dfs(cell);
            blist = blist.filter(b => b.sidecell.some(c => isIce(c)) && b.sidecell.some(c => !c.isnull && !isIce(c)));
            blist = blist.filter(b => b.qsub !== BQSUB.cross);
            if (blist.length === 2) {
                blist.forEach(b => add_line(b));
            }
        }
        // extend arrow
        if (cell.lcnt === 2 && !isIce(cell)) {
            let list = genlist(cell);
            list = list.filter(b => b[0].line);
            if (list.filter(b => b[0].qsub === BQSUB.none).length === 1) {
                if (list[0][0].qsub !== BQSUB.none) {
                    list = [list[1], list[0]];
                }
                if (list[1][0].qsub === list[1][1]) {
                    add_arrow(list[0][0], list[0][2]);
                }
                if (list[1][0].qsub === list[1][2]) {
                    add_arrow(list[0][0], list[0][1]);
                }
            }
        }
        // choose path
        if (cell.lcnt === 1 && !isIce(cell)) {
            for (let d = 0; d < 4; d++) {
                let ncell = dir(cell.adjacent, d);
                while (!ncell.isnull && isIce(ncell)) {
                    ncell = dir(ncell.adjacent, d);
                }
                if (ncell.isnull || ncell.lcnt !== 1 || dir(ncell.adjborder, d + 2).line) { continue; }
                if (has_in(cell) && has_in(ncell) || has_out(cell) && has_out(ncell)) {
                    add_cross(dir(cell.adjborder, d));
                }
                if (board.linegraph.components.length > 2 &&
                    (cell.path === inb.path && ncell.path === outb.path || cell.path === outb.path && ncell.path === inb.path)) {
                    add_cross(dir(cell.adjborder, d));
                }
            }
        }
    });
    // this is moved here because the following two CellConnected may have bug if line on ice isn't fully labeled with arrow
    forEachCell(cell => {
        if (isIce(cell)) {
            for (let d = 0; d < 4; d++) {
                let pcell = cell;
                while (isIce(pcell) && dir(pcell.adjborder, d).qsub === BQSUB.cross && dir(pcell.adjborder, d + 2).qsub === BQSUB.cross) {
                    add_cross(dir(pcell.adjborder, d + 2));
                    pcell = dir(pcell.adjacent, d + 2);
                }
                pcell = cell;
                while (isIce(pcell) && dir(pcell.adjborder, d).line && (!dir(pcell.adjborder, d + 2).line ||
                    dir(pcell.adjborder, d).qsub !== BQSUB.none && dir(pcell.adjborder, d + 2).qsub === BQSUB.none)) {
                    add_line(dir(pcell.adjborder, d + 2));
                    if (dir(pcell.adjborder, d).qsub !== BQSUB.none) {
                        add_arrow(dir(pcell.adjborder, d + 2), dir(pcell.adjborder, d).qsub);
                    }
                    pcell = dir(pcell.adjacent, d + 2);
                }
            }
        }
    });
    // used to avoid all in/out arrow region
    CellConnected({
        isShaded: c => !has_out(c) && has_in(c),
        isUnshaded: c => has_out(c),
        add_shaded: () => { },
        add_unshaded: c => fourside(add_cross, c.adjborder),
        isNotPassable: (c, nb, nc) => nb.qsub === BQSUB.cross,
        OnlyOneConnected: false,
    });
    CellConnected({
        isShaded: c => !has_in(c) && has_out(c),
        isUnshaded: c => has_in(c),
        add_shaded: () => { },
        add_unshaded: c => fourside(add_cross, c.adjborder),
        isNotPassable: (c, nb, nc) => nb.qsub === BQSUB.cross,
        OnlyOneConnected: false,
    });
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
        UnshadeEmpty: false,
    });
    No2x2Black();
    const LITSO = [
        [[0, 0], [1, 0], [2, 0], [0, 1]],// L
        [[0, 0], [1, 0], [2, 0], [2, 1]],
        [[0, 0], [0, 1], [1, 1], [2, 1]],
        [[0, 0], [0, 1], [-1, 1], [-2, 1]],
        [[0, 0], [1, 0], [0, 1], [0, 2]],
        [[0, 0], [1, 0], [1, 1], [1, 2]],
        [[0, 0], [0, 1], [0, 2], [1, 2]],
        [[0, 0], [0, 1], [0, 2], [-1, 2]],
        [[0, 0], [1, 0], [2, 0], [3, 0]],// I
        [[0, 0], [0, 1], [0, 2], [0, 3]],
        [[0, 0], [1, 0], [2, 0], [1, 1]],// T
        [[0, 0], [1, 0], [2, 0], [1, -1]],
        [[0, 0], [0, 1], [0, 2], [1, 1]],
        [[0, 0], [0, 1], [0, 2], [-1, 1]],
        [[0, 0], [1, 0], [1, 1], [2, 1]],// S
        [[0, 0], [1, 0], [1, -1], [2, -1]],
        [[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 0], [0, 1], [-1, 1], [-1, 2]],
        [[0, 0], [1, 0], [0, 1], [1, 1]],// O
    ];
    const CANDMAX = 50;
    forEachRoom(room => {
        let clist = [], bclist = [];
        for (let j = 0; j < room.clist.length; j++) {
            if (isBlack(room.clist[j])) { continue; }
            if (isGreen(room.clist[j])) { bclist.push(room.clist[j]); }
            clist.push(room.clist[j]);
        }
        let clistSet = new Set(clist);
        let cand = [];
        for (let j = 0; j < clist.length; j++) {
            let list = LITSO;
            list = list.map(l => l.map(([dx, dy]) => offset(clist[j], dx, dy)));
            list = list.filter(l => !l.some(c => !clistSet.has(c)));
            if (bclist.length > 0) {
                list = list.filter(l => bclist.every(c => l.includes(c)));
            }
            list = list.filter(l => {
                let nlist = [];
                l.forEach(c => {
                    fourside(nc => {
                        if (isGreen(nc) && nc.room !== room) {
                            nlist.push(nc);
                        }
                    }, c.adjacent);
                });
                // no 2*2
                let no2x2 = true;
                clist.forEach(c => {
                    if (no2x2 === false) { return; }
                    for (let d = 0; d < 4; d++) {
                        if ([c, offset(c, 1, 0, d), offset(c, 0, 1, d), offset(c, 1, 1, d)].every(cc => isBlack(cc) || cc.room === room && !l.includes(cc))) {
                            no2x2 = false;
                            return;
                        }
                    }
                });
                if (no2x2 === false) { return false; }
                // no same shape
                let cshape = getShape(l);
                nlist = nlist.map(c => {
                    let clist = [];
                    for (let i = 0; i < c.room.clist.length; i++) {
                        if (isGreen(c.room.clist[i])) { clist.push(c.room.clist[i]); }
                        if (clist.length > 4) return null;
                    }
                    return getShape(clist);
                });
                return !nlist.includes(cshape);
            });
            cand.push(...list);
            if (cand.length > CANDMAX) { break; }
        }
        if (cand.length > CANDMAX) { return; }
        for (let j = 0; j < clist.length; j++) {
            if (cand.every(l => l.includes(clist[j]))) {
                add_dot(clist[j]);
            }
            if (cand.every(l => !l.includes(clist[j]))) {
                add_black(clist[j]);
            }
        }
    });
}

function LitsAssist() {
    BlackConnected();
    BlackConnected_InRegion();
    No2x2Black();
    const LITS = [
        [[0, 0], [1, 0], [2, 0], [0, 1]],// L
        [[0, 0], [1, 0], [2, 0], [2, 1]],
        [[0, 0], [0, 1], [1, 1], [2, 1]],
        [[0, 0], [0, 1], [-1, 1], [-2, 1]],
        [[0, 0], [1, 0], [0, 1], [0, 2]],
        [[0, 0], [1, 0], [1, 1], [1, 2]],
        [[0, 0], [0, 1], [0, 2], [1, 2]],
        [[0, 0], [0, 1], [0, 2], [-1, 2]],
        [[0, 0], [1, 0], [2, 0], [3, 0]],// I
        [[0, 0], [0, 1], [0, 2], [0, 3]],
        [[0, 0], [1, 0], [2, 0], [1, 1]],// T
        [[0, 0], [1, 0], [2, 0], [1, -1]],
        [[0, 0], [0, 1], [0, 2], [1, 1]],
        [[0, 0], [0, 1], [0, 2], [-1, 1]],
        [[0, 0], [1, 0], [1, 1], [2, 1]],// S
        [[0, 0], [1, 0], [1, -1], [2, -1]],
        [[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 0], [0, 1], [-1, 1], [-1, 2]],
    ];
    const CANDMAX = 50;
    forEachRoom(room => {
        let clist = [], bclist = [];
        for (let j = 0; j < room.clist.length; j++) {
            if (isGreen(room.clist[j])) { continue; }
            if (isBlack(room.clist[j])) { bclist.push(room.clist[j]); }
            clist.push(room.clist[j]);
        }
        let clistSet = new Set(clist);
        let cand = [];
        for (let j = 0; j < clist.length; j++) {
            let list = LITS;
            list = list.map(l => l.map(([dx, dy]) => offset(clist[j], dx, dy)));
            list = list.filter(l => !l.some(c => !clistSet.has(c)));
            if (bclist.length > 0) {
                list = list.filter(l => bclist.every(c => l.includes(c)));
            }
            list = list.filter(l => {
                let nlist = [], con = false;
                l.forEach(c => {
                    fourside(nc => {
                        if (isBlack(nc) && nc.room !== room) {
                            nlist.push(nc);
                        }
                        if (!nc.isnull && !isGreen(nc) && nc.room !== room) {
                            con = true;
                        }
                    }, c.adjacent);
                });
                // connectivity
                if (!con && board.roommgr.components.length > 1) { return false; }
                // no 2*2
                let no2x2 = true;
                l.forEach(c => {
                    if (no2x2 === false) { return; }
                    for (let d = 0; d < 4; d++) {
                        if ([c, offset(c, 1, 0, d), offset(c, 0, 1, d), offset(c, 1, 1, d)].every(cc => nlist.includes(cc) || l.includes(cc))) {
                            no2x2 = false;
                            return;
                        }
                    }
                });
                if (no2x2 === false) { return false; }
                // no same shape
                let cshape = getShape(l);
                nlist = nlist.map(c => {
                    let clist = [];
                    for (let i = 0; i < c.room.clist.length; i++) {
                        if (isBlack(c.room.clist[i])) { clist.push(c.room.clist[i]); }
                    }
                    return getShape(clist);
                });
                return !nlist.includes(cshape);
            });
            cand.push(...list);
            if (cand.length > CANDMAX) { break; }
        }
        if (cand.length > CANDMAX) { return; }
        for (let j = 0; j < clist.length; j++) {
            if (cand.every(l => l.includes(clist[j]))) {
                add_black(clist[j]);
            }
            if (cand.every(l => !l.includes(clist[j]))) {
                add_dot(clist[j]);
            }
        }
    });
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
    forEachCell(cell => {
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
    });
}

function AyeheyaAssist() {
    forEachRoom(room => {
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
    });
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
    forEachCell(cell => {
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
    });
}

function HeyawakeAssist() {
    GreenConnected();
    BlackNotAdjacent();
    forEachCell(cell => {
        let blackcnt = 0;
        fourside(c => {
            blackcnt += c.isnull || isBlack(c);
        }, cell.adjacent);
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
    });
    const MAXSIT = 200000;
    const MAXAREA = 50;
    forEachRoom(room => {
        let qnum = room.top.qnum;
        if (qnum === CQNUM.none || qnum === CQNUM.quesmark) { return; }
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
            return
        }
        // randomly chosen approximate formula
        if (list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length > MAXAREA &&
            (qnum - list.filter(c => isBlack(c)).length + 1) < list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) { return; }
        if ((qnum - list.filter(c => isBlack(c)).length) * 2 + 5 <
            list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) { return; }
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
        if (sitcnt > MAXSIT) { return; }
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
    });
}

function AkariAssist() {
    let isEmpty = c => !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.light && c.qsub !== CQSUB.dot;
    let isNotLight = c => c.isnull || c.qnum !== CQNUM.none || c.qsub === CQSUB.dot
    let add_light = function (c) { add_black(c, true); };
    forEachCell(cell => {
        let emptycnt = 0;
        let lightcnt = 0;
        // add dot where lighted
        if (cell.qlight && cell.qans !== CQANS.light) {
            add_dot(cell);
        }
        // only one place can light
        let emptycellList = [];
        if (cell.qnum === CQNUM.none && !cell.qlight) {
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
        // only two cells can lit up this cell
        if (cell.qsub === CQSUB.dot && !cell.qlight && emptycellList.length === 2) {
            let [ec1, ec2] = emptycellList;
            if (ec1.bx !== ec2.bx && ec1.by !== ec2.by) {
                if (ec1.bx === cell.bx) { [ec1, ec2] = [ec2, ec1]; }
                let oc = board.getc(ec1.bx, ec2.by);
                let f = true;
                for (let i = cell.bx; i !== ec1.bx; i += (ec1.bx > cell.bx ? 1 : -1)) {
                    f &= board.getc(i, ec2.by).qnum === CQNUM.none;
                }
                for (let i = cell.by; i !== ec2.by; i += (ec2.by > cell.by ? 1 : -1)) {
                    f &= board.getc(ec1.bx, i).qnum === CQNUM.none;
                }
                if (f && oc.qnum === CQNUM.none) {
                    add_dot(oc);
                }
            }
        }
        fourside(c => {
            if (!c.isnull && c.qnum === CQNUM.none && c.qsub !== CQSUB.dot && c.qans !== CQANS.light) { emptycnt++; }
            lightcnt += (c.qans === CQANS.light);
        }, cell.adjacent);
        if (cell.qnum >= 0) {
            // finished clue
            if (cell.qnum === lightcnt) {
                fourside(add_dot, cell.adjacent);
            }
            // finish clue
            if (cell.qnum === emptycnt + lightcnt) {
                fourside(add_light, cell.adjacent);
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
        for (let d = 0; d < 4; d++) {
            //             
            //  22  => ●22●
            //             
            if (cell.qnum === 2 && offset(cell, 1, 0, d).qnum === 2) {
                add_light(offset(cell, -1, 0, d));
                add_light(offset(cell, 2, 0, d));
            }
            //
            //  21· => ●21·
            //             
            if (cell.qnum === 2 && offset(cell, 1, 0, d).qnum === 1 && isNotLight(offset(cell, 2, 0, d))) {
                add_light(offset(cell, -1, 0, d));
            }
            //          ●  
            //  3   => ●3  
            //   1       1·
            //           · 
            if (cell.qnum === 3 && offset(cell, 1, 1, d).qnum === 1) {
                add_light(offset(cell, -1, 0, d));
                add_light(offset(cell, 0, -1, d));
                add_dot(offset(cell, 1, 2, d));
                add_dot(offset(cell, 2, 1, d));
            }
            //         ·   
            //  2   =>  2  
            //   1       1 
            //             
            if (cell.qnum === 2 && offset(cell, 1, 1, d).qnum === 1) {
                add_dot(offset(cell, -1, -1, d));
            }
            //          ●
            // ·2   => ·2
            //   1       1·
            //           · 
            if (cell.qnum === 2 && offset(cell, 1, 1, d).qnum === 1 &&
                (isNotLight(offset(cell, -1, 0, d)) || isNotLight(offset(cell, 0, -1, d)))) {
                add_light(offset(cell, -1, 0, d));
                add_light(offset(cell, 0, -1, d));
                add_dot(offset(cell, 1, 2, d));
                add_dot(offset(cell, 2, 1, d));
            }
            //          ·
            //  1   => ·1
            //   1·      1·
            //   ·       · 
            if (cell.qnum === 1 && offset(cell, 1, 1, d).qnum === 1 &&
                isNotLight(offset(cell, 1, 2, d)) && isNotLight(offset(cell, 2, 1, d))) {
                add_dot(offset(cell, -1, 0, d));
                add_dot(offset(cell, 0, -1, d));
            }
        }
    });
}

function MasyuAssist() {
    SingleLoopInCell({
        isPass: c => c.qnum !== CQNUM.none,
    });
    let isBlack = c => !c.isnull && c.qnum === CQNUM.bcir;
    let isWhite = c => !c.isnull && c.qnum === CQNUM.wcir;
    let isPathable = b => !b.isnull && b.qsub !== BQSUB.cross;
    forEachCell(cell => {
        for (let d = 0; d < 4; d++) {
            if (isWhite(cell) && offset(cell, .5, .5, d).qsub !== CRQSUB.none) {
                add_inout(offset(cell, -.5, -.5, d), offset(cell, .5, .5, d).qsub ^ 1);
            }
            if (isBlack(cell) && isWhite(offset(cell, -1, -1, d)) && isWhite(offset(cell, 1, 1, d)) &&
                offset(cell, .5, .5, d).qsub !== CRQSUB.none) {
                add_inout(offset(cell, -.5, -.5, d), offset(cell, .5, .5, d).qsub);
            }
            if (isBlack(cell) && isWhite(offset(cell, -1, -1, d)) && isWhite(offset(cell, 1, 1, d)) &&
                offset(cell, -.5, .5, d).qsub !== CRQSUB.none) {
                add_inout(offset(cell, .5, -.5, d), offset(cell, -.5, .5, d).qsub ^ 1);
            }
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
    });
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
    forEachCell(cell => {
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
            fourside(add_cross, cell.adjborder);
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
            return;
        }
        // add dot around black
        if (isBlack(cell)) {
            fourside(add_cross, cell.adjborder);
            fourside(add_dot, cell.adjacent);
            return;
        }
        let emptycnt = 0;
        let linecnt = 0;
        fourside((b, c) => {
            if (isPathable(c) && b.qsub !== BQSUB.cross) { emptycnt++; }
            linecnt += b.line;
        }, cell.adjborder, cell.adjacent);
        // no branch
        if (linecnt === 2) {
            fourside(add_cross, cell.adjborder);
        }
        // no deadend
        if (emptycnt <= 1) {
            add_black(cell, true);
            fourside(add_cross, cell.adjborder);
            fourside(add_dot, cell.adjacent);
        }
        // 2 degree cell no deadend
        if (emptycnt === 2) {
            fourside((b, c) => {
                if (!isPathable(c) || b.qsub === BQSUB.cross) { return; }
                add_dot(c);
            }, cell.adjborder, cell.adjacent);
        }
    });
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
    forEachCell(cell => {
        // check clue
        if (cell.qnum >= 0 && cell.qdir !== QDIR.none) {
            let d = qdirRemap(cell.qdir);
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
            return;
        }
        // add dot around black
        if (isBlack(cell)) {
            fourside(add_cross, cell.adjborder);
            fourside(add_dot, cell.adjacent);
            return;
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
    });
}

function SlitherlinkAssist() {
    SingleLoopInBorder();
    let add_bg_color = function (c, color) {
        if (c === undefined || c.isnull || c.qsub !== CQSUB.none || c.qsub === color) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(color);
        c.draw();
    }
    let add_bg_inner_color = function (c) { add_bg_color(c, CQSUB.green); }
    let add_bg_outer_color = function (c) { add_bg_color(c, CQSUB.yellow); }
    let isYellow = c => c.isnull || c.qsub === CQSUB.yellow;
    CellConnected({
        isShaded: c => isGreen(c) && c.qnum !== 3,
        isUnshaded: c => isYellow(c) || c.qsub === CQSUB.none && c.qnum === 3,
        add_shaded: add_bg_inner_color,
        add_unshaded: add_bg_outer_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
    });
    CellConnected({
        isShaded: c => isYellow(c) && c.qnum !== 3,
        isUnshaded: c => isGreen(c) || c.qsub === CQSUB.none && c.qnum === 3,
        add_shaded: add_bg_outer_color,
        add_unshaded: add_bg_inner_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
        OutsideAsShaded: true,
    });
    // counting this due to some small loop jokes
    let twocnt = 0;
    let threecnt = 0;
    forEachCell(cell => {
        twocnt += cell.qnum === 2;
        threecnt += cell.qnum === 3;
    });
    forEachCell(cell => {
        let blist = adjlist(cell.adjborder);
        if (blist.filter(b => b.line).length === cell.qnum) {
            blist.forEach(b => add_cross(b));
        }
        if (blist.filter(b => b.qsub !== BQSUB.cross).length === cell.qnum) {
            blist.forEach(b => add_line(b));
        }
        // deduce single clue
        if (cell.qnum >= 0) {
            let list = [offset(cell, -.5, -.5), offset(cell, .5, -.5), offset(cell, -.5, .5), offset(cell, .5, .5)];
            let sum = list.map(cr => cr.qsub.length).reduce((a, b) => a + b, 0);
            let comblist = [];
            list[0].qsub.forEach(q0 => {
                if (adjlist(cell.adjborder).filter(b => [].concat(q0).includes(b)).length > cell.qnum) { return; }
                if (2 - adjlist(cell.adjborder).filter(b => [].concat(q0).includes(b)).length > 4 - cell.qnum) { return; }
                list[1].qsub.forEach(q1 => {
                    if (adjlist(cell.adjborder).filter(b => [].concat(q0, q1).includes(b)).length > cell.qnum) { return; }
                    if (3 - adjlist(cell.adjborder).filter(b => [].concat(q0, q1).includes(b)).length > 4 - cell.qnum) { return; }
                    if (q0.includes(offset(cell, 0, -.5)) ^ q1.includes(offset(cell, 0, -.5))) { return; }
                    list[2].qsub.forEach(q2 => {
                        if (q0.includes(offset(cell, -.5, 0)) ^ q2.includes(offset(cell, -.5, 0))) { return; }
                        list[3].qsub.forEach(q3 => {
                            if (q2.includes(offset(cell, 0, .5)) ^ q3.includes(offset(cell, 0, .5))) { return; }
                            if (q1.includes(offset(cell, .5, 0)) ^ q3.includes(offset(cell, .5, 0))) { return; }
                            if (adjlist(cell.adjborder).filter(b => [].concat(q0, q1, q2, q3).includes(b)).length !== cell.qnum) { return; }
                            comblist.push([q0, q1, q2, q3]);
                        });
                    });
                });
            });
            list.forEach((cr, i) => { cr.setQsub(cr.qsub.filter(s => comblist.some(comb => comb[i] === s))); });
            if (list.map(cr => cr.qsub.length).reduce((a, b) => a + b, 0) < sum) { flg2 = true; }
        }
        for (let d = 0; d < 4; d++) {
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
                let fn = function (c1, c2) {
                    if (c1.isnull || c1.qsub === CQSUB.yellow) {
                        add_bg_color(c2, CQSUB.green);
                    }
                    if (c1.qsub === CQSUB.green) {
                        add_bg_color(c2, CQSUB.yellow);
                    }
                };
                fn(offset(cell, 0, 1, d), offset(cell, 0, -1, d));
                fn(offset(cell, 0, -1, d), offset(cell, 0, 1, d));
            }
            //            ×
            // · · ·    · · ╻
            // ×2 3  -> ×2 3┃
            // · · ·    · · ╹
            //            ×  
            if (cell.qnum === 2 && offset(cell, 1, 0, d).qnum === 3 && offset(cell, -.5, 0, d).qsub === BQSUB.cross) {
                add_line(offset(cell, 1.5, 0, d));
                add_cross(offset(cell, .5, -1, d));
                add_cross(offset(cell, .5, 1, d));
            }
        }
    });
    // deduce color
    forEachCell(cell => {
        let innercnt = adjlist(cell.adjacent).filter(c => isGreen(c)).length;
        let outercnt = adjlist(cell.adjacent).filter(c => isYellow(c)).length;
        // number and color deduce
        if (cell.qnum >= 0) {
            if (cell.qnum < innercnt || 4 - cell.qnum < outercnt) {
                add_bg_inner_color(cell);
            }
            if (cell.qnum < outercnt || 4 - cell.qnum < innercnt) {
                add_bg_outer_color(cell);
            }
            if (isGreen(cell) && cell.qnum === outercnt) {
                fourside(add_bg_inner_color, cell.adjacent);
            }
            if (isYellow(cell) && cell.qnum === innercnt) {
                fourside(add_bg_outer_color, cell.adjacent);
            }
            if (isYellow(cell) && cell.qnum === 4 - outercnt) {
                fourside(add_bg_inner_color, cell.adjacent);
            }
            if (isGreen(cell) && cell.qnum === 4 - innercnt) {
                fourside(add_bg_outer_color, cell.adjacent);
            }
            if (cell.qnum === 2 && outercnt === 2) {
                fourside(add_bg_inner_color, cell.adjacent);
            }
            if (cell.qnum === 2 && innercnt === 2) {
                fourside(add_bg_outer_color, cell.adjacent);
            }
            // 2 different color around 1 or 3
            if ((cell.qnum === 1 || cell.qnum === 3) && innercnt === 1 && outercnt === 1) {
                fourside((c, d) => {
                    if (!c.isnull && c.qsub === CQSUB.none) {
                        if (cell.qnum === 1) { add_cross(d); }
                        if (cell.qnum === 3) { add_line(d); }
                    }
                }, cell.adjacent, cell.adjborder);
            }
            // same diagonal color as 3
            if (cell.qnum === 3 && cell.qsub !== CQSUB.none) {
                for (let d = 0; d < 4; d++) {
                    if (!offset(cell, 1, 0, d).isnull && !offset(cell, 0, 1, d).isnull && offset(cell, 1, 1, d).qsub === cell.qsub) {
                        add_line(offset(cell, -.5, 0, d));
                        add_line(offset(cell, 0, -.5, d));
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
                    let c1 = offset(cell, 1, 0, d);
                    let c2 = offset(cell, 0, 1, d);
                    // A=B
                    add_bg_color(c1, (c2.isnull ? CQSUB.yellow : c2.qsub));
                    add_bg_color(c2, (c1.isnull ? CQSUB.yellow : c1.qsub));
                }
            }
        }
    });
}
