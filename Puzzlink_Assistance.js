// ==UserScript==
// @name         Puzz.link Assistance
// @version      23.11.10.2
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @match        http://pzv.jp/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=puzz.link
// @grant        none
// @namespace    https://greasyfork.org/users/1192854
// @license      GPL
// @require      https://raw.githubusercontent.com/LeavingLeaves/Puzzlink_Assistance/main/colored_shade.js#sha256=af29ae319d1fe8ed661cd3484a5e9db792392276833493e82eee3c6b4a6df7c3
// @require      https://raw.githubusercontent.com/LeavingLeaves/Puzzlink_Assistance/main/const_list.js#sha256=7744e668fd4c894b79162e4e36e49258a2ea687eabf2d944fa91fdc7bf4fef71
// @require      https://raw.githubusercontent.com/LeavingLeaves/Puzzlink_Assistance/main/simple_func.js#sha256=30d23e3eebe9ab588fb24f7fccf4a1c31aaad00c30dd4e3507b8f1dc69ce5968
// @require      https://raw.githubusercontent.com/LeavingLeaves/Puzzlink_Assistance/main/single_deduce.js#sha256=b578a12e38251c7e3022af68bde8742a283bd9b766b8d385cff4e631b9981593
// ==/UserScript==

'use strict';

let GENRENAME = "";
let flg = true;
let step = false;
let board;

window.addEventListener('load', function () {
    GENRENAME = this.window.ui.puzzle.info.en;
    board = this.window.ui.puzzle.board;
    colored_shade();
    if (genrelist.some(g => g[0] === GENRENAME)) {
        let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
        let btn2 = '<button type="button" class="btn" id="assiststep" style="display: inline;">Assist Step</button>';
        document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
        document.querySelector("#assist").insertAdjacentHTML('afterend', btn2);
        document.querySelector("#assist").addEventListener("click", assist, false);
        document.querySelector("#assiststep").addEventListener("click", assiststep, false);
        window.addEventListener("keypress", (event) => {
            if (event.key === 'q' || (event.key === 'Q')) { assist(); }
            if (event.key === 'w' || (event.key === 'W')) { assiststep(); }
        });
    }
}, false);

function assiststep() {
    step = true;
    assist();
    step = false;
}

function assist() {
    flg = true;
    for (let loop = 0; loop < (step ? 1 : MAXLOOP); loop++) {
        if (!flg) { break; }
        flg = false;
        genrelist.find(g => g[0] === GENRENAME)[1]();
    }
    ui.puzzle.redraw();
    console.log('Assisted.');
}

// assist for certain genre
function TentaishoAssist() {
    let add_line = function (b) {
        if (b === undefined || b.isnull || b.qsub === BQSUB.link || b.qans) { return; }
        if (step && flg) { return; }
        b.setQans(1);
        b.draw();
        flg |= b.qans;
    };
    let isDot = obj => obj.qnum > 0;
    let isEmpty = c => !c.isnull && c.ques !== CQUES.bwall;
    for (let i = 0; i < board.cross.length; i++) {
        let cross = board.cross[i];
        let list = adjlist(cross.adjborder);
        if (list.filter(b => !b.isnull && b.qsub === BQSUB.link).length === 2 && cross.lcnt === 1) {
            list.forEach(b => add_line(b));
        }
        if (list.filter(b => !b.isnull && b.qsub === BQSUB.link).length === 3) {
            list.forEach(b => add_link(b));
        }
    }
    let n = 0;
    let id = new Map(); // map every cell to unique dot id
    let dotmap = new Map();
    let bfs_c = function (clist, n) {
        let c = clist.pop();
        let x = dotmap.get(n).bx;
        let y = dotmap.get(n).by;
        if (!isEmpty(c) || id.has(c)) { return; }
        id.set(c, n);
        let fn = function (bbx, bby, cbx, cby) {
            let nb = board.getb(bbx, bby);
            let nc = board.getc(cbx, cby);
            if (!isEmpty(nc) || nb.qans || id.has(nc) && id.get(nc) !== id.get(c)) {
                add_line(nb);
                add_line(board.getb(2 * x - bbx, 2 * y - bby));
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
    };
    let bfs = function (clist, n) {
        while (clist.length > 0) { bfs_c(clist, n); }
    }
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
                bfs(clist, n);
            }
        }
    }
    // check not assigned cells
    let templist = [];
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (!isEmpty(cell) || id.has(cell) || templist.includes(cell)) { continue; }
        let clist = [];
        let nid = [];
        let dfs = function (c) {
            if (!isEmpty(c) || clist.includes(c)) { return; }
            clist.push(c);
            templist.push(c);
            fourside((nb, nc) => {
                if (nb.qans || !isEmpty(nc) || clist.includes(nc)) { return; }
                if (id.has(nc)) {
                    if (!nid.includes(id.get(nc))) {
                        nid.push(id.get(nc));
                    }
                    return;
                }
                if (isEmpty(nc)) {
                    dfs(nc);
                }
            }, c.adjborder, c.adjacent)
        };
        dfs(cell);
        for (let c of clist) {
            let anid = nid.filter(n => {
                let dot = dotmap.get(n);
                let dc = board.getc(dot.bx * 2 - c.bx, dot.by * 2 - c.by);
                return isEmpty(dc) && (!id.has(dc) || id.get(dc) === n);
            });
            if (anid.length === 1) {
                bfs([c], anid[0]);
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
        if (cell.qans === CQANS.black && list.filter(c => !c.isnull && c.qsub !== CQSUB.dot).length === 1) {
            let ncell = list.find(c => !c.isnull && c.qsub !== CQSUB.dot);
            add_black(ncell);
        }
        // finished domino
        if (cell.qans === CQANS.black && list.some(c => !c.isnull && c.qans === CQANS.black)) {
            let ncell = list.find(c => !c.isnull && c.qans === CQANS.black);
            fourside(add_dot, cell.adjacent);
            fourside(add_dot, ncell.adjacent);
        }
        // not making triomino
        if (list.filter(c => !c.isnull && c.qans === CQANS.black).length >= 2) {
            add_dot(cell);
        }
        //  .      . 
        // .X  -> .X 
        //          .
        for (let d = 0; d < 4; d++) {
            if (cell.qans === CQANS.black &&
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
        if (list.filter(c => c.qans === CQANS.black).length === 2) {
            list.forEach(c => add_dot(c));
        }
        if (list.filter(c => c.qsub !== CQSUB.dot).length === 2) {
            list.forEach(c => add_black(c));
        }
        if (list.filter(c => c.qans === CQANS.black).length === 1) {
            list.forEach(c => {
                if (c.qans === CQANS.black || c.qsub === CQSUB.dot) { return; }
                if (!adjlist(c.adjacent).some(nc => !nc.isnull &&
                    (c.room !== nc.room && nc.qsub !== CQSUB.dot || c.room === nc.room && nc.qans === CQANS.black))) {
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
            if (c1.qans === CQANS.black && c2.qans === CQANS.black && c3.qans === CQANS.black) {
                add_green(cell);
            }
            if (c1.qsub === CQSUB.green && c2.qsub === CQSUB.green && c3.qsub === CQSUB.green) {
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
        if (list.filter(c => c.qans === CQANS.black).length === qnum) {
            list.forEach(c => add_green(c));
        }
        if (qnum - list.filter(c => c.qans === CQANS.black).length ===
            list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) {
            list.forEach(c => add_black(c));
        }
    }
}

function KurodokoAssist() {
    GreenConnected();
    BlackNotAdjacent();
    SightNumber({
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qans === CQANS.black,
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
            if (cell.qsub === CQSUB.green) vis.set(cell.qnum, cell);
        }
        for (let cell of a) {
            if (cell.qnum === CQNUM.none) continue;
            if (vis.has(cell.qnum)) add_black(cell);
        }

        let cnt = new Map();
        for (let cell of a) {
            if (cell.qnum === CQNUM.none || cell.qans === CQANS.black) continue;
            let c = cnt.has(cell.qnum) ? cnt.get(cell.qnum) : 0;
            c++;
            cnt.set(cell.qnum, c);
        }
        for (let cell of a) {
            if (cell.qnum === CQNUM.none || cell.qans === CQANS.black) continue;
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

function CaveAssist() {
    GreenConnected();
    CellConnected({
        isShaded: c => c.qans === CQANS.black,
        isUnshaded: c => c.qsub === CQSUB.green,
        add_shaded: add_black,
        add_unshaded: add_green,
        OutsideAsShaded: true,
    });
    SightNumber({
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qans === CQANS.black,
        add_shaded: add_green,
        add_unshaded: add_black,
    });
    NoChecker({
        isShaded: c => c.qans === CQANS.black,
        isUnshaded: c => c.qans === CQANS.green,
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
        isShaded: c => c.qans === CQANS.black,
        add_unshaded: add_dot,
    });
    CellConnected({
        isShaded: c => c.qans === CQANS.black,
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
            if (s.indexOf(qnums[i]) === -1) { continue; }
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
        let blk = parseInt(list.map(c => (!c.isnull && c.qans === CQANS.black ? "1" : "0")).join(""), 2);
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
    SizeRegion({
        isShaded: c => c.qans === CQANS.black,
        isUnshaded: c => c.qans === CQANS.white,
        add_shaded: add_black,
        add_unshaded: add_white,
        NoUnshadedNum: false,
    });
    SizeRegion({
        isShaded: c => c.qans === CQANS.white,
        isUnshaded: c => c.qans === CQANS.black,
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
                cross.setQsub(0);
                cross.draw();
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
    let isBlack = c => !c.isnull && c.qans === CQANS.black;
    let isBorderBlack = c => c.isnull || c.qans === CQANS.black;
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
        isShaded: c => c.qans === CQANS.black,
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
    SizeRegion({
        isShaded: c => c.qans === CQANS.black,
        isUnshaded: c => c.qsub === CQSUB.green,
        add_shaded: add_black,
        add_unshaded: add_green,
        OneNumPerRegion: false,
        NoUnshadedNum: false,
    });
    SizeRegion({
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qans === CQANS.black,
        add_shaded: add_green,
        add_unshaded: add_black,
        OneNumPerRegion: false,
        NoUnshadedNum: false,
    });
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        if (cell.qnum === 1 || cell.qnum === 2) {
            add_black(cell);
        }
        let templist = [cell, offset(cell, 0, 1), offset(cell, 1, 0), offset(cell, 1, 1)];
        if (templist.filter(c => c.qans === CQANS.black).length === 3) {
            templist.forEach(c => add_black(c));
        }
        let fn = function (c, c1, c2, c12) {
            if (c1.isnull || c2.isnull || c12.isnull) { return; }
            if (c1.qans === CQANS.black && c2.qans === CQANS.black && c12.qsub === CQSUB.green) {
                add_green(c);
            }
            if (c1.qans === CQANS.black && c2.qsub === CQSUB.green && c12.qans === CQANS.black) {
                add_green(c);
            }
            if (c1.qsub === CQSUB.green && c2.qans === CQANS.black && c12.qans === CQANS.black) {
                add_green(c);
            }
        };
        for (let d = 0; d < 4; d++) {
            fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
        }
        if (cell.qsub === CQSUB.green) {
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
        // diagonal 1 & 1
        if (cross.qnum === 1 && isNotSide(cross)) {
            for (let d = 0; d < 4; d++) {
                let cross2 = offset(cross, 1, 1, d);
                if (cross2.qnum === 1 && isNotSide(cross2)) {
                    add_slash(offset(cross, .5, .5, d), CQANS.lslash + d);
                }
            }
        }
        // 1 & 1
        if (cross.qnum === 1) {
            for (let d = 0; d < 4; d++) {
                if (offset(cross, 0, 1, d).isnull || offset(cross, 0, -1, d).isnull) { continue; }
                if (!offset(cross, 1, 0, d).isnull && offset(cross, 1, 0, d).qnum === 1) {
                    add_slash(offset(cross, -0.5, -.5, d), CQANS.lslash + d);
                    add_slash(offset(cross, -0.5, +.5, d), CQANS.rslash + d);
                    add_slash(offset(cross, +1.5, -.5, d), CQANS.rslash + d);
                    add_slash(offset(cross, +1.5, +.5, d), CQANS.lslash + d);
                }
            }
        }
        // 3 & 3
        if (cross.qnum === 3) {
            for (let d = 0; d < 4; d++) {
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

function NurikabeAssist() {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        // surrounded white cell
        let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
        if (cell.qnum === CQNUM.none && templist.filter(c => c.isnull || c.qans === CQANS.black).length === 4) {
            add_black(cell);
        }
    }
    flg = 0;
    CellConnected({
        isShaded: c => c.qans === CQANS.black,
        isUnshaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        add_shaded: c => add_black(c, true),
        add_unshaded: add_dot,
    });
    No2x2Cell({
        isShaded: c => c.qans === CQANS.black,
        add_unshaded: add_dot,
    });
    SizeRegion({
        isShaded: c => c.qsub === CQSUB.dot || c.qnum !== CQNUM.none,
        isUnshaded: c => c.qans === CQANS.black,
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
                        if (c.isnull || list.indexOf(c) !== -1) { continue; }
                        list.push(c);
                    }
                }
            }
        }
        if (!list.some(c => c.qnum === CQNUM.quesmark)) {
            for (let i = 0; i < board.cell.length; i++) {
                let cell = board.cell[i];
                if (list.indexOf(cell) === -1) {
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
                if (!c.isnull && c.qsub === CQSUB.green && vis.has(c)) { cnt++; }
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
                        if (c1 === undefined || c1.isnull || c1.qans === CQANS.black) continue;
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
                    if (c1 === undefined || c1.isnull || c1.qans === CQANS.black) continue;
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
    NoChecker({
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
        // WbB
        // W.W
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
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qans === CQANS.black,
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
        isUnshaded: c => c.qans === CQANS.black || c.ques === CQUES.tri,
        add_shaded: add_green,
        add_unshaded: () => { },
        isLinked: (c, nb, nc) => c.room === nc.room,
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
        if (cellList.some(c => c.qsub === CQSUB.green || c.ques === CQUES.cir || c.ques === CQUES.tri || c.lcnt > 0) ||
            room === startcell.room || room === goalcell.room) {
            cellList.forEach(c => add_green(c));
            continue;
        }
        if (cellList.some(c => c.qans === CQANS.black)) {
            cellList.forEach(c => add_black(c));
            continue;
        }
        let circnt1 = circnt, circnt2 = circnt;
        let templist = [];
        cellList.forEach(c => {
            let list = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 0, 1), offset(c, 1, 0)];
            list.forEach(c => {
                if (c.isnull || templist.indexOf(c) !== -1) { return; }
                templist.push(c);
            });
        });
        templist = templist.filter(c => !c.isnull && c.qsub === CQSUB.green);
        if (templist.length < 2) { continue; }
        // no loop
        let templist2 = templist.map(c => {
            let dfslist = [];
            let dfs = function (c) {
                if (c.isnull || c.qsub !== CQSUB.green || dfslist.indexOf(c) !== -1) { return; }
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
            return dfslist.filter(c => templist.indexOf(c) !== -1).length;
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
                if (c.isnull || c.qsub !== CQSUB.green || dfslist.indexOf(c) !== -1) { return; }
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
            if (templist.filter(c => c.isnull || c.qans === CQANS.black).length === 4) {
                add_black(cell);
            }
        }
        // no 2*2
        {
            let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (!templist.some(c => c.isnull) && !templist.some(c => c.qsub === CQSUB.green)) {
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
        if (cell.qans === CQANS.black || cell.ques === CQUES.tri) {
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
                    if (c.isnull || c.qsub !== CQSUB.green || list.indexOf(c) !== -1) { return; }
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
                if (templist.indexOf(c) !== -1) { return; }
                templist.push(c);
                fn(offset(c, -1, -1));
                fn(offset(c, -1, +1));
                fn(offset(c, +1, -1));
                fn(offset(c, +1, +1));
            }
            fn(cell);
            if (templist.length === cell.qnum) {
                templist.forEach(c => {
                    add_green(offset(c, -1, -1));
                    add_green(offset(c, -1, +1));
                    add_green(offset(c, +1, -1));
                    add_green(offset(c, +1, +1));
                });
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

function LitsAssist() {
    BlackConnected();
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
        if (templist.filter(c => c.qans === CQANS.black).length === 4) {
            templist.forEach(c => add_dot(c));
        }
        for (let j = 0; j < room.clist.length; j++) {
            if (room.clist[j].qsub === CQSUB.dot) { continue; }
            let templist2 = [];
            let fn = function (c) {
                if (c.room !== room || c.qsub === CQSUB.dot || templist2.indexOf(c) !== -1) { return; }
                templist2.push(c);
                fourside(fn, c.adjacent);
            }
            fn(room.clist[j]);
            if (templist2.length < 4) {
                templist2.forEach(c => add_dot(c));
            }
            if (room.clist[j].qans !== CQANS.black) { continue; }
            templist2 = [];
            let fn2 = function (c, step = 3) {
                if (step < 0 || c.room !== room) { return; }
                templist2.push(c);
                fn2(c.adjacent.top, step - 1);
                fn2(c.adjacent.bottom, step - 1);
                fn2(c.adjacent.left, step - 1);
                fn2(c.adjacent.right, step - 1);
            }
            fn2(room.clist[j]);
            templist.forEach(c => {
                if (templist2.indexOf(c) === -1) {
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
        let blackcnt = 0;
        let emptycnt = 0;
        cellList.forEach(c => {
            blackcnt += c.qans === CQANS.black;
            emptycnt += c.qans !== CQANS.black && c.qsub !== CQSUB.dot;
        });
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
                if (!list.some(c => c.isnull) && list.filter(c => c.qans === CQANS.black).length === 2) {
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
                if (templist2.some(c => c.qans === CQANS.black)) { continue; }
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

function EkawayehAssist() {
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
            if (c1.room === room) { add_green(); }
            if (c2.room === room) { add_green(); }
        }
        if (rows % 2 === 0 && cols % 2 === 1) {
            let c1 = board.getc(tx / 2, ty / 2 - 1);
            let c2 = board.getc(tx / 2, ty / 2 + 1);
            if (c1.room === room) { add_green(); }
            if (c2.room === room) { add_green(); }
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
            if (cell.qsub === CQSUB.green) {
                add_green(board.getc(tx - cell.bx, ty - cell.by));
            }
            if (cell.qans === CQANS.black) {
                add_black(board.getc(tx - cell.bx, ty - cell.by));
            }
        }
    }
    HeyawakeAssist();
}

function ShakashakaAssist() {
    let isEmpty = function (c) {
        return !c.isnull && c.qnum === CQNUM.none && c.qsub === CQSUB.none && c.qans === CQANS.none;
    };
    // draw triangle
    let add_triangle = function (c, ndir) { // 0 = bl, 1 = br, 2 = tr, 3 = tl
        if (c === undefined || c.isnull || !isEmpty(c)) { return; }
        if (step && flg) { return; }
        flg = true;
        ndir = (ndir % 4 + 4) % 4;
        c.setQans(ndir + 2);
        c.draw();
    };
    // check blacking edge
    let isEdge = function (c, ndir) { // 0 = left, 1 = bottom, 2 = right, 3 = top
        ndir = (ndir % 4 + 4) % 4;
        let tdir = (ndir + 3) % 4;
        return c.isnull || c.qnum !== CQNUM.none || c.qans === tdir + 2 || c.qans === ndir + 2;
    };
    // check dot area if stick edge
    let isDotEdge = function (c) {
        if (c.qsub !== CQSUB.dot) { return false; }
        let temp = false;
        let dfslist = [c];
        let dfs = function (c, ndir) {
            if (isEmpty(c) || dfslist.indexOf(c) !== -1) { return; }
            if (isEdge(c, ndir + 2)) { temp = true; return; }
            if (c.qsub === CQSUB.dot) {
                dfslist.push(c);
                dfs(offset(c, -1, 0), 0);
                dfs(offset(c, 0, 1), 1);
                dfs(offset(c, 1, 0), 2);
                dfs(offset(c, 0, -1), 3);
            }
        };
        for (let d = 0; d < 4; d++) {
            dfs(dir(c.adjacent, d + 1), d);
        }
        return temp;
    };
    // check blacking edge including dot
    let isEdgeEx = function (c, ndir) { // 0 = left, 1 = bottom, 2 = right, 3 = top
        return isEdge(c, ndir) || isDotEdge(c);
    };
    // check blacking corner including dot
    let isCorner = function (c, ndir) { // 0 = bl, 1 = br, 2 = tr, 3 = tl
        ndir = (ndir % 4 + 4) % 4;
        return c.isnull || c.qnum !== CQNUM.none || c.qans === ndir + 2 || isDotEdge(c);
    };
    // check blacking sharp including dot
    let isSharp = function (c, ndir) { // 0 = bl, 1 = br, 2 = tr, 3 = tl
        ndir = (ndir % 4 + 4) % 4;
        return isEdgeEx(c, ndir) || c.qans === (ndir + 1) % 4 + 2;
    };
    // if can place triangle of specific direction
    let isntTri = function (c, ndir) { // 0 = bl, 1 = br, 2 = tr, 3 = tl
        ndir = (ndir % 4 + 4) % 4;
        if (!isEmpty(c) && c.qans !== ndir + 2) { return true; }
        if (c.qans === ndir + 2) { return false; }
        let temp = offset(c, 1, 0, ndir);
        if (isEdgeEx(temp, ndir) || temp.qans === (ndir + 2) % 4 + 2) { return true; }
        temp = offset(c, 0, -1, ndir);
        if (isEdgeEx(temp, ndir + 1) || temp.qans === (ndir + 2) % 4 + 2) { return true; }
        temp = offset(c, -1, 0, ndir);
        if (!temp.isnull && (temp.qans === (ndir + 3) % 4 + 2 || temp.qans === ndir + 2)) { return true; }
        temp = offset(c, 0, 1, ndir);
        if (!temp.isnull && (temp.qans === ndir + 2 || temp.qans === (ndir + 1) % 4 + 2)) { return true; }
        temp = offset(c, 1, -1, ndir);
        if (!temp.isnull && isSharp(temp, ndir)) { return true; }
        temp = offset(c, -1, -1, ndir);
        if (!temp.isnull && temp.qans === (ndir + 3) % 4 + 2) { return true; }
        temp = offset(c, -1, 1, ndir);
        if (!temp.isnull && temp.qans === ndir + 2) { return true; }
        temp = offset(c, 1, 1, ndir);
        if (!temp.isnull && temp.qans === (ndir + 1) % 4 + 2) { return true; }
        temp = offset(c, 2, 0, ndir);
        if (!temp.isnull && temp.qans === (ndir + 1) % 4 + 2) { return true; }
        temp = offset(c, 0, -2, ndir);
        if (!temp.isnull && temp.qans === (ndir + 3) % 4 + 2) { return true; }
        temp = offset(c, 2, -1, ndir);
        if (!temp.isnull && temp.qans === (ndir + 2) % 4 + 2) { return true; }
        temp = offset(c, 1, -2, ndir);
        if (!temp.isnull && temp.qans === (ndir + 2) % 4 + 2) { return true; }
        return false;
    };
    // extend of isntTri including some complex logic
    let isntTriEx = function (c, ndir) { // 0 = bl, 1 = br, 2 = tr, 3 = tl
        if (isntTri(c, ndir)) { return true; }
        let templist = [offset(c, -1, 0, ndir), offset(c, 0, 1, ndir), offset(c, -2, 0, ndir),
        offset(c, 0, 2, ndir), offset(c, -1, 1, ndir)];
        if (isEmpty(templist[0]) && isEmpty(templist[1]) && isEdgeEx(templist[2], ndir + 2) &&
            isEdgeEx(templist[3], ndir + 3) && isEmpty(templist[4]) && isntTri(templist[4], ndir + 2)) {
            return true;
        }
        return false;
    }

    // start assist
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjcell = cell.adjacent;
        let tricnt = 0;
        let emptycnt = 0;
        fourside(c => {
            if (!c.isnull && c.qans >= 2) { tricnt++; }
            if (isEmpty(c)) { emptycnt++; }
        }, adjcell);

        // add dot

        // cannot place any triangle
        {
            let temp = true;
            for (let d = 0; d < 4; d++) {
                temp &= isntTriEx(cell, d);
            }
            if (temp) { add_dot(cell); }
        }
        // fill rectangle
        {
            let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (!templist.some(c => c.isnull)) {
                templist = templist.filter(c => c.qsub !== CQSUB.dot);
                if (templist.length === 1) {
                    add_dot(templist[0]);
                }
            }
        }
        // dot by clue
        if (tricnt === cell.qnum) {
            fourside(add_dot, adjcell);
        }
        // pattern with clue 1
        if (cell.qnum === 1) {
            for (let d = 0; d < 4; d++) {
                let tempcell = offset(cell, -1, 0, d);
                let tempstate = !tempcell.isnull && (isEmpty(tempcell) || tempcell.qsub === CQSUB.dot);
                tempcell = offset(cell, 0, 1, d);
                tempstate &= !tempcell.isnull && (isEmpty(tempcell) || tempcell.qsub === CQSUB.dot);
                tempcell = offset(cell, -1, 1, d);
                tempstate &= tempcell.qnum === CQNUM.none && isntTriEx(tempcell, d + 2);
                if (tempstate) { add_dot(offset(cell, 1, 0, d)); add_dot(offset(cell, 0, -1, d)); }
            }
        }

        // add triangle

        // cannot form non-rectangle
        if (isEmpty(cell)) {
            for (let d = 0; d < 4; d++) {
                let templist = [offset(cell, -1, 0, d), offset(cell, 0, 1, d), offset(cell, -1, 1, d)];
                let templist_dot = templist.filter(c => !c.isnull && !isEmpty(c) && c.qsub === CQSUB.dot);
                let templist_ndot = templist.filter(c => !c.isnull && !isEmpty(c) && c.qsub !== CQSUB.dot);
                if (templist_dot.length === 2 && templist_ndot.length === 1) {
                    let temp = templist_ndot[0];
                    if (templist.indexOf(temp) === 0 && isCorner(temp, d + 1)) { add_triangle(cell, d); break; }
                    else if (templist.indexOf(temp) === 1 && isCorner(temp, d + 3)) { add_triangle(cell, d); break; }
                    else if (templist.indexOf(temp) === 2 && isCorner(temp, d + 2)) { add_triangle(cell, d); break; }
                }
            }
        }
        // triangle by clue
        if (emptycnt === cell.qnum - tricnt) {
            for (let d = 0; d < 4; d++) {
                let adj = dir(adjcell, d);
                if (isEmpty(adj)) {
                    if (isntTriEx(adj, d)) { add_triangle(adj, d + 1); }
                    else if (isntTriEx(adj, d + 1)) { add_triangle(adj, d); }
                }
            }
        }
        // side extend
        if (cell.qans >= 2) {
            let ndir = cell.qans - 2;
            // rectangle needs turn or cannot turn
            if (isntTriEx(offset(cell, -1, -1, ndir), ndir)) { add_triangle(offset(cell, 0, -1, ndir), ndir + 3); }
            else if (isntTriEx(offset(cell, 0, -1, ndir), ndir + 3)) { add_triangle(offset(cell, -1, -1, ndir), ndir); }
            if (isntTriEx(offset(cell, 1, 1, ndir), ndir)) { add_triangle(offset(cell, 1, 0, ndir), ndir + 1); }
            else if (isntTriEx(offset(cell, 1, 0, ndir), ndir + 1)) { add_triangle(offset(cell, 1, 1, ndir), ndir); }
            // only one opposite side position
            if (isEdgeEx(offset(cell, 2, -1, ndir), ndir)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
            else if (isEdgeEx(offset(cell, 1, -2, ndir), ndir + 1)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
            else if (isSharp(offset(cell, 2, -2, ndir), ndir)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
            // rectangle opposite side extend
            let temp = cell;
            while (!offset(temp, -1, -1, ndir).isnull && offset(temp, -1, -1, ndir).qans === cell.qans) {
                temp = offset(temp, -1, -1, ndir);
            }
            let turn1 = offset(temp, 0, -1, ndir);
            if (turn1.qans === (ndir + 3) % 4 + 2) {
                let temp = cell;
                while (!offset(temp, 1, 1, ndir).isnull && offset(temp, 1, 1, ndir).qans === cell.qans) {
                    temp = offset(temp, 1, 1, ndir);
                }
                let turn2 = offset(temp, 1, 0, ndir);
                if (turn2.qans === (ndir + 1) % 4 + 2) {
                    turn1 = offset(turn1, 1, -1, ndir);
                    turn2 = offset(turn2, 1, -1, ndir);
                    while ((!turn1.isnull && turn1.qans === (ndir + 3) % 4 + 2) ||
                        (!turn2.isnull && turn2.qans === (ndir + 1) % 4 + 2)) {
                        add_triangle(turn1, ndir + 3);
                        add_triangle(turn2, ndir + 1);
                        turn1 = offset(turn1, 1, -1, ndir);
                        turn2 = offset(turn2, 1, -1, ndir);
                    }
                }
            }
        }
        // 2x2 pattern
        if (isEmpty(cell)) {
            for (let d = 0; d < 4; d++) {
                let templist = [offset(cell, -1, 0, d), offset(cell, 0, -1, d), offset(cell, 0, 1, d),
                offset(cell, -1, -1, d), offset(cell, 0, -2, d)];
                if (!templist[0].isnull && templist[0].qsub === CQSUB.dot && isEmpty(templist[1]) &&
                    isEdge(templist[2], d + 3) && isEdge(templist[3], d + 1) && isEdgeEx(templist[4], d + 1)) {
                    add_triangle(cell, d);
                    break;
                }
                templist = [offset(cell, 0, 1, d), offset(cell, 1, 0, d), offset(cell, -1, 0, d),
                offset(cell, 1, 1, d), offset(cell, 2, 0, d)];
                if (!templist[0].isnull && templist[0].qsub === CQSUB.dot && isEmpty(templist[1]) &&
                    isEdge(templist[2], d + 2) && isEdge(templist[3], d) && isEdgeEx(templist[4], d)) {
                    add_triangle(cell, d);
                    break;
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
            blackcnt += c.isnull || c.qans === CQANS.black;
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
    const MAXSIT = 10000;
    const MAXAREA = 100;
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
            cst.set(cell, (cell.qans === CQANS.black ? "BLK" : (cell.qsub === CQSUB.green ? "GRN" : "UNK")));
            apl.set(cell, (cell.qans === CQANS.black ? "BLK" : (cell.qsub === CQSUB.green ? "GRN" : "UNK")));
        }
        if (qnum === list.filter(c => c.qans === CQANS.black).length) {
            list.forEach(c => add_green(c));
            continue;
        }
        // randomly chosen approximate formula
        if (list.length > MAXAREA &&
            (qnum - list.filter(c => c.qans === CQANS.black).length + 1) < list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) { continue; }
        if ((qnum - list.filter(c => c.qans === CQANS.black).length) * 2 + 5 <
            list.filter(c => c.qans === CQANS.none && c.qsub === CQSUB.none).length) { continue; }
        list.forEach(c => {
            let templist = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 1, 0), offset(c, 0, 1)];
            templist.forEach(c => {
                if (c.isnull || c.room === room || surlist.indexOf(c) !== -1) { return; }
                if (c.qsub === CQSUB.green || c.qans === CQANS.black) { return; }
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
                    if (templist.indexOf(c) !== -1) { return false; }
                    let n = 0;
                    let olist = [];
                    let dfs = function (c) {
                        if (c.isnull || templist.indexOf(c) !== -1) { return false; }
                        if (c.room !== room) {
                            if (c.qans === CQANS.black) { return false; }
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
                    if (templist2.indexOf(c) !== -1) { return; }
                    let templist = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 1, 0), offset(c, 0, 1)];
                    if (templist.some(c => !c.isnull && c.room === room && cst.get(c) === "BLK")) { return; }
                    apl.set(c, "AMB");
                });
                return;
            }
            if (cst.get(list[i]) !== "UNK") { dfs(i + 1, blkcnt); return; }
            sitcnt++;
            let templist = [offset(list[i], -1, 0), offset(list[i], 0, -1), offset(list[i], 1, 0), offset(list[i], 0, 1)];
            if (blkcnt < qnum && !templist.some(c => !c.isnull && c.qans === CQANS.black || cst.has(c) && cst.get(c) === "BLK")) {
                cst.set(list[i], "BLK");
                dfs(i + 1, blkcnt + 1);
                cst.set(list[i], "UNK");
            }
            cst.set(list[i], "GRN");
            dfs(i + 1, blkcnt);
            cst.set(list[i], "UNK");
        };
        dfs(0, list.filter(c => c.qans === CQANS.black).length);
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
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let adjcell = cell.adjacent;
        let adjline = cell.adjborder;
        {
            for (let d = 0; d < 4; d++) {
                if (dir(adjcell, d + 1).qnum === CQNUM.bcir && dir(adjcell, d + 3).qnum === CQNUM.bcir &&
                    (dir(adjline, d + 2).isnull || dir(adjline, d + 2).qsub === BQSUB.cross)) {
                    add_cross(dir(adjline, d));
                }
            }
        }
        if (cell.qnum === CQNUM.wcir) {// white
            for (let d = 0; d < 4; d++) {
                // go straight
                if (dir(adjline, d).line || dir(adjline, d + 1).qsub === BQSUB.cross || dir(adjline, d + 1).isnull) {
                    add_line(dir(adjline, d));
                    add_line(dir(adjline, d + 2));
                    add_cross(dir(adjline, d + 1));
                    add_cross(dir(adjline, d + 3));
                }
                // turn at one side
                if (dir(adjline, d).line && dir(dir(adjcell, d).adjborder, d).line) {
                    add_cross(dir(dir(adjcell, d + 2).adjborder, d + 2));
                }
                // no turn on both side
                if ((!dir(adjcell, d).isnull && (dir(dir(adjcell, d).adjborder, d).line ||
                    dir(dir(adjcell, d).adjborder, d + 1).qsub === BQSUB.cross && dir(dir(adjcell, d).adjborder, d + 3).qsub === BQSUB.cross
                ) || dir(adjcell, d).qnum === CQNUM.wcir) &&
                    (!dir(adjcell, d + 2).isnull && (dir(dir(adjcell, d + 2).adjborder, d + 2).line ||
                        dir(dir(adjcell, d + 2).adjborder, d + 1).qsub === BQSUB.cross && dir(dir(adjcell, d + 2).adjborder, d + 3).qsub === BQSUB.cross
                    ) || dir(adjcell, d + 2).qnum === CQNUM.wcir)) {
                    add_line(dir(adjline, d + 1));
                    add_line(dir(adjline, d + 3));
                    add_cross(dir(adjline, d));
                    add_cross(dir(adjline, d + 2));
                }
            }
        }
        if (cell.qnum === CQNUM.bcir) {// black
            for (let d = 0; d < 4; d++) {
                // can't go straight this way
                if (dir(adjcell, d).isnull || dir(adjline, d).qsub === BQSUB.cross ||
                    dir(dir(adjcell, d).adjacent, d).isnull || dir(dir(adjcell, d).adjborder, d).qsub === BQSUB.cross ||
                    dir(adjcell, d).qnum === CQNUM.bcir || dir(adjline, d + 2).line) {
                    add_cross(dir(adjline, d));
                    add_line(dir(adjline, d + 2));
                }
                // going straight this way will branch
                if (dir(adjcell, d).isnull || dir(dir(adjcell, d).adjborder, d + 1).line ||
                    dir(dir(adjcell, d).adjborder, d + 3).line) {
                    add_cross(dir(adjline, d));
                    add_line(dir(adjline, d + 2));
                }
                // go straight
                if (dir(adjline, d).line) {
                    add_line(dir(dir(adjcell, d).adjborder, d));
                }
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

function YajilinAssist() {
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
        // TODO: rewrite this
        // check clue
        if (cell.qnum >= 0 && cell.qdir !== QDIR.none) {
            let d = qdirremap(cell.qdir);
            let emptycnt = 0;
            let blackcnt = 0;
            let lastcell = cell;
            let pcell = dir(cell.adjacent, d);
            let emptycellList = [];
            let addcellList = [];
            while (!pcell.isnull && (pcell.qdir !== cell.qdir || pcell.qnum < 0)) {
                if (isEmpty(pcell)) {
                    emptycnt++;
                    emptycellList.push(pcell);
                }
                blackcnt += pcell.qans === CQANS.black;
                if (isEmpty(lastcell) && isEmpty(pcell)) {
                    lastcell = cell;
                    emptycnt--;
                } else {
                    if (isEmpty(lastcell) && !isEmpty(pcell)) {
                        addcellList.push(lastcell);
                    }
                    lastcell = pcell;
                }
                pcell = dir(pcell.adjacent, d);
            }
            if (isEmpty(lastcell)) {
                addcellList.push(lastcell);
            }
            if (!pcell.isnull) {
                blackcnt += pcell.qnum;
            }
            // finish clue
            if (emptycnt + blackcnt === cell.qnum) {
                addcellList.forEach(cell => add_black(cell, true));
            }
            // finished clue
            if (blackcnt === cell.qnum) {
                emptycellList.forEach(cell => add_dot(cell));
            }
        }
        // add cross
        if (cell.qnum !== CQNUM.none) {
            fourside(add_cross, adjline);
            continue;
        }
        // add dot around black
        if (cell.qans === CQANS.black) {
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
            add_black(cell);
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
    let isCross = b => b.isnull || b.qsub === BQSUB.cross
    let isLine = b => b.line
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
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qsub === CQSUB.yellow || c.qsub === CQSUB.none && c.qnum === 3,
        add_shaded: add_bg_inner_color,
        add_unshaded: add_bg_outer_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
    });
    CellConnected({
        isShaded: c => c.qsub === CQSUB.yellow,
        isUnshaded: c => c.qsub === CQSUB.green || c.qsub === CQSUB.none && c.qnum === 3,
        add_shaded: add_bg_outer_color,
        add_unshaded: add_bg_inner_color,
        isLinked: (c, nb, nc) => nb.qsub === BQSUB.cross,
        isNotPassable: (c, nb, nc) => nb.line,
        OutsideAsShaded: true,
    });
    NoChecker({
        isShaded: c => !c.isnull && c.qsub === CQSUB.green,
        isUnshaded: c => c.isnull || c.qsub === CQSUB.yellow,
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
        // 2+3+
        //  4c5
        //  +6+
        let fn = function (c, b1, b2, b3, b4, b5, b6) {
            //  x       x 
            // x+ + -> x+x+
            //   1      x1 
            //  + +     + +
            if (c.qnum === 1 && isCross(b1) && isCross(b2)) {
                add_cross(b3);
                add_cross(b4);
            }
            //  x       x 
            // x+ + -> x+-+
            //   3      |3 
            //  + +     + +
            if (c.qnum === 3 && isCross(b1) && isCross(b2)) {
                add_line(b3);
                add_line(b4);
            }
            //  x       x  
            // -+ +    -+ +
            //   1  ->   1x
            //  + +     +x+
            if (c.qnum === 1 && (isCross(b1) && isLine(b2) || isLine(b1) && isCross(b2))) {
                add_cross(b5);
                add_cross(b6);
            }
            //          x       |  
            //  + +    -+ +    x+ +
            //   1x ->   1x or   1x
            //  +x+     +x+     +x+
            if (c.qnum === 1 && isCross(b5) && isCross(b6)) {
                add_oneline(b1, b2);
            }
            //          x  
            // -+ +    -+ +
            //   3  ->   3|
            //  + +     +-+
            if (c.qnum === 3 && (isLine(b1) || isLine(b2))) {
                add_cross(b1);
                add_cross(b2);
                add_line(b5);
                add_line(b6);
            }
            //          x       |  
            //  + +    -+ +    x+ +
            //   3| ->   3| or   3|
            //  +-+     +-+     +-+
            if (c.qnum === 3 && isLine(b5) && isLine(b6)) {
                add_oneline(b1, b2);
            }
            //  x       x  
            // x+ +    x+x+
            //   2| ->  x2|
            //  + +     +-+
            if (c.qnum === 2 && isCross(b1) && isCross(b2) && (isLine(b5) || isLine(b6))) {
                add_cross(b3);
                add_cross(b4);
                add_line(b5);
                add_line(b6);
            }
            //  x       x  
            // x+ +    x+-+
            //   2x ->  |2x
            //  + +     +x+
            if (c.qnum === 2 && isCross(b1) && isCross(b2) && (isCross(b5) || isCross(b6))) {
                add_line(b3);
                add_line(b4);
                add_cross(b5);
                add_cross(b6);
            }
            //          x  
            // -+ +    -+ +
            //   2x ->   2x
            //  + +     +-+
            if (c.qnum === 2 && (isLine(b1) || isLine(b2)) && (isCross(b5) || isCross(b6))) {
                add_cross(b1);
                add_cross(b2);
                add_line(b5);
                add_line(b6);
            }
            //          x       |  
            //  + +    -+ +    x+ +
            //   2x ->   2x or   2x
            //  +-+     +-+     +-+
            if (c.qnum === 2 && (isLine(b5) && isCross(b6) || isCross(b5) && isLine(b6))) {
                add_oneline(b1, b2);
            }
        };
        for (let d = 0; d < 4; d++) {
            fn(cell, offset(cell, -1, -.5, d), offset(cell, -.5, -1, d),
                offset(cell, 0, -.5, d), offset(cell, -.5, 0, d),
                offset(cell, .5, 0, d), offset(cell, 0, .5, d),);
            // + + +    +-+ +
            //  3       |3   
            // + + + -> + + +
            //    3        3|
            // + + +    + +-+
            if (cell.qnum === 3 && offset(cell, 1, 1, d).qnum === 3) {
                add_line(offset(cell, 0, -.5, d));
                add_line(offset(cell, -.5, 0, d));
                add_line(offset(cell, 1.5, 1, d));
                add_line(offset(cell, 1, 1.5, d));
            }
            //  x x      x x 
            // x+ +     x+ +-
            //   2   ->   2  
            // -+ +     -+ + 
            //           x   
            if (cell.qnum === 2 &&
                isCross(offset(cell, -.5, -1, d)) && isCross(offset(cell, -1, -.5, d))) {
                add_oneline(offset(cell, .5, -1, d), offset(cell, 1, -.5, d));
                add_oneline(offset(cell, -1, .5, d), offset(cell, -.5, 1, d));
            }
            //  x        x   
            // x+ +     x+ + 
            //   2   ->   2  
            //  + +x     + +x
            //             x 
            if (cell.qnum === 2 &&
                isCross(offset(cell, -.5, -1, d)) && isCross(offset(cell, -1, -.5, d)) &&
                (isCross(offset(cell, 1, .5, d)) || isCross(offset(cell, .5, 1, d)))) {
                add_cross(offset(cell, 1, .5, d));
                add_cross(offset(cell, .5, 1, d));
            }
            //  x        x   
            // x+ +     x+-+ 
            //   2   ->  |2x 
            //  + +-     +x+-
            //             | 
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
            //            x  
            // + + +    + + +
            //  3 3  -> |3|3|
            // + + +    + + +
            //            x  
            if (cell.qnum === 3 && (threecnt > 2 || twocnt > 0) &&
                offset(cell, 1, 0, d).qnum === 3) {
                add_line(offset(cell, -.5, 0, d));
                add_line(offset(cell, .5, 0, d));
                add_line(offset(cell, 1.5, 0, d));
                add_cross(offset(cell, .5, -1, d));
                add_cross(offset(cell, .5, 1, d));
            }
            //            x  
            // + + +    + + +
            // x2 3  -> x2 3|
            // + + +    + + +
            //            x  
            if (cell.qnum === 2 && offset(cell, 1, 0, d).qnum === 3 && isCross(offset(cell, -.5, 0, d))) {
                add_line(offset(cell, 1.5, 0, d));
                add_cross(offset(cell, .5, -1, d));
                add_cross(offset(cell, .5, 1, d));
            }
            // +x+ +    +x+ +
            // x1       x1   
            // + + + -> + + +
            //    1        1x
            // + + +    + +x+
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
            let innercnt = 0;
            let outercnt = 0;
            fourside(c => {
                if (!c.isnull && c.qsub === CQSUB.green) { innercnt++; }
                if (c.isnull || c.qsub === CQSUB.yellow) { outercnt++; }
            }, adjcell);
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
                if (cell.qsub === CQSUB.green && cell.qnum === outercnt) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === CQSUB.yellow && cell.qnum === innercnt) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qsub === CQSUB.yellow && cell.qnum === 4 - outercnt) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === CQSUB.green && cell.qnum === 4 - innercnt) {
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
                    //  x   
                    // x+ + 
                    //   2 A
                    //  + +a
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

