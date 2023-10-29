// ==UserScript==
// @name         Puzz.link Assistance
// @version      23.10.29.1
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @match        http://pzv.jp/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// @namespace    https://greasyfork.org/users/1192854
// ==/UserScript==

(function () {
    'use strict';

    const MAXLOOP = 30;
    const MAXDFSCELLNUM = 200;
    let flg = true;
    let step = false;
    let board;

    //const list
    const CQNUM = {
        quesmark: -2,
        circle: -2, //no number
        block: -2,
        none: -1,
        wcir: 1,
        bcir: 2,
    }

    const CANUM = {
        none: -1,
        //Masyu
        wcir: 1,
        bcir: 2,
    };

    const CQANS = {
        none: 0,
        block: 1,
        //starbattle
        star: 1,
        //Akari
        light: 1,
        //Shakashaka triangle
        bl: 2,
        br: 3,
        tr: 4,
        tl: 5,
        //Slant
        rslash: 31,
        lslash: 32,
    };

    const CQUES = {
        none: 0,
        //Castle Wall
        gray: 0,
        white: 1,
        black: 2,
        //Icebarn
        ice: 6,
        //Simpleloop
        bwall: 7,
        //Slalom
        vgate: 21,
        hgate: 22,
        //Nurimaze
        cir: 41,
        tri: 42,
    };

    const CQSUB = {
        none: 0,
        dot: 1,
        green: 1,
        //Slitherlink
        yellow: 2,
    };

    const QDIR = {
        none: 0,
        //arrow
        up: 1,
        dn: 2,
        lt: 3,
        rt: 4,
    }

    const BQSUB = {
        none: 0,
        cross: 2,
        //Icebarn
        arrow_up: 11,
        arrow_dn: 12,
        arrow_lt: 13,
        arrow_rt: 14,
    };

    const genrelist = [
        [/slither(_play)?/, SlitherlinkAssist],
        [/yaji[lr]in/, YajilinAssist],
        [/simpleloop/, SimpleloopAssist],
        [/mas[yh]u/, MasyuAssist],
        [/(lightup|akari)/, AkariAssist],
        [/heyawake/, HeyawakeAssist],
        [/shakashaka/, ShakashakaAssist],
        [/ayeheya/, EkawayehAssist],
        [/nothree/, NothreeAssist],
        [/lits/, LitsAssist],
        [/icebarn/, IcebarnAssist],
        [/aquapelago/, AquapelagoAssist],
        [/nurimaze/, NurimazeAssist],
        [/yinyang/, YinyangAssist],
        [/guidearrow/, GuideArrowAssist],
        [/nurikabe/, NurikabeAssist],
        [/gokigen/, SlantAssist],
        [/cbanana/, ChocoBananaAssist],
        [/nurimisaki/, NurimisakiAssist],
        [/castle/, CastleWallAssist],
        [/starbattle/, StarbattleAssist],
        [/slalom/, SlalomAssist],
    ];

    if (genrelist.filter(g => RegExp('\\\?' + g[0].source + '\\\/').test(document.URL)).length === 1) {
        let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
        let btn2 = '<button type="button" class="btn" id="assiststep" style="display: inline;">Assist Step</button>';
        document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
        document.querySelector("#assist").insertAdjacentHTML('afterend', btn2);
        document.querySelector("#assist").addEventListener("click", assist, false);
        document.querySelector("#assiststep").addEventListener("click", assiststep, false);
        window.addEventListener("keypress", (event) => {
            if (event.key === 'q') { assist(); }
            if (event.key === 'w') { assiststep(); }
        });
    }

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
            genrelist.filter(g => RegExp('\\\?' + g[0].source + '\\\/').test(document.URL))[0][1]();
        }
        ui.puzzle.redraw();
        console.log('Assisted.');
    }

    let offset = function (c, dx, dy, dir = 0) {
        dir = (dir % 4 + 4) % 4;
        if (dir === 0) { return board.getobj(c.bx + dx * 2, c.by + dy * 2); }
        if (dir === 1) { return board.getobj(c.bx + dy * 2, c.by - dx * 2); }
        if (dir === 2) { return board.getobj(c.bx - dx * 2, c.by - dy * 2); }
        if (dir === 3) { return board.getobj(c.bx - dy * 2, c.by + dx * 2); }
    }
    let fourside = function (f, a) {
        f(a.top);
        f(a.bottom);
        f(a.left);
        f(a.right);
    };
    let fourside2 = function (f, a, b) {
        f(a.top, b.top);
        f(a.bottom, b.bottom);
        f(a.left, b.left);
        f(a.right, b.right);
    };
    let dir = function (c, d) {
        d = (d % 4 + 4) % 4;
        if (d === 0) return c.top;
        if (d === 1) return c.right;
        if (d === 2) return c.bottom;
        if (d === 3) return c.left;
    }
    let qdirremap = function (qdir) {
        return [-1, 0, 2, 3, 1][qdir];
    }

    //set val
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
    let add_arrow = function (b, dir) {
        if (b === undefined || b.isnull || b.qsub === BQSUB.cross) { return; }
        if (step && flg) { return; }
        flg = true;
        b.setQsub(dir);
        b.draw();
    };
    let add_block = function (c, notOnNum = false) {
        if (notOnNum && c.qnum !== CQNUM.none) { return; }
        if (c === undefined || c.isnull || c.lcnt !== 0 || c.qsub === CQSUB.dot || c.qans !== CQANS.none) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQans(CQANS.block);
        c.draw();
    };
    let add_light = function (c) {
        add_block(c, true);
    };
    let add_dot = function (c) {
        if (c === undefined || c.isnull || c.qnum !== CQNUM.none || c.qans !== CQANS.none || c.qsub === CQSUB.dot) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(CQSUB.dot);
        c.draw();
    };
    let add_green = function (c) {
        if (c === undefined || c.isnull || c.qans !== CQANS.none || c.qsub === CQSUB.dot) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(CQSUB.green);
        c.draw();
    };

    //single rule
    function No2x2Cell(isBlock, setGreen) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (templist.filter(c => c.isnull).length > 0) { continue; }
            templist = templist.filter(c => !isBlock(c));
            if (templist.length === 1) {
                setGreen(templist[0]);
            }
        }
    }

    function No2x2Block() {
        No2x2Cell(
            function (c) { return c.qans === CQANS.block; },
            add_green
        );
    }

    function No2x2Green() {
        No2x2Cell(
            function (c) { return c.qsub === CQSUB.green; },
            add_block
        );
    }

    function CellConnected(isBlock, isGreen, setBlock, setGreen,
        isLinked = function (c, nb, nc) { return isBlock(c) && isBlock(nc); },
        isNotPassable = function (c, nb, nc) { return false; },
        OutsideAsBlock = false) {
        //use tarjan to find cut vertex
        let n = 0;
        let ord = new Map();
        let low = new Map();
        let blkn = new Map();
        let dfs = function (c, f = null) {
            if (!c.isnull && isGreen(c) || ord.has(c)) { return; }
            if (c.isnull && !OutsideAsBlock) { return; }
            ord.set(c, n);
            low.set(n, n);
            blkn.set(n, 0);
            n++;
            let cellList = [];
            if (!c.isnull) {
                let linkdfs = function (c) {
                    if (c.isnull || cellList.indexOf(c) !== -1) { return; }
                    cellList.push(c);
                    blkn.set(ord.get(c), blkn.get(ord.get(c)) + isBlock(c));
                    let fn = function (nc, nb) {
                        if (nc.isnull || nb.isnull || ord.has(nc)) { return; }
                        if (!(isLinked(c, nb, nc) || isBlock(c) && isBlock(nc))) { return; }
                        ord.set(nc, ord.get(c));
                        linkdfs(nc);
                    };
                    fourside2(fn, c.adjacent, c.adjborder);
                }
                linkdfs(c);
            }
            let fn = function (nc, nb) {
                if (isNotPassable(c, nb, nc)) { return; }
                if (nc === f || isGreen(nc)) { return; }
                if (nc.isnull && !OutsideAsBlock) { return; }
                if (ord.get(c) === ord.get(nc)) { return; }
                if (ord.has(nc)) {
                    low.set(ord.get(c), Math.min(low.get(ord.get(c)), ord.get(nc)));
                    return;
                }
                dfs(nc, c);
                let ordc = ord.get(c);
                let ordnc = ord.get(nc);
                low.set(ordc, Math.min(low.get(ordc), low.get(ordnc)));
                if (ordnc > ordc) {
                    blkn.set(ordc, blkn.get(ordc) + blkn.get(ordnc));
                    if (ordc <= low.get(ordnc) && blkn.get(ordnc) > 0) {
                        cellList.forEach(c => setBlock(c));
                    }
                }
            };
            if (!c.isnull) {
                cellList.forEach(c => fourside2(fn, c.adjacent, c.adjborder));
            } else if (c.isnull) {
                for (let i = 0; i < board.cols; i++) {
                    for (let j = 0; j < board.rows; j++) {
                        dfs(board.getc(2 * i + 1, 2 * j + 1), c);
                    }
                }
            }
        };
        if (OutsideAsBlock) {
            dfs(board.getc(0, 0));
        } else {
            for (let i = 0; i < board.cell.length; i++) {
                if (!isBlock(board.cell[i])) { continue; }
                dfs(board.cell[i]);
                break;
            }
        }
        if (ord.size > 0) {
            for (let i = 0; i < board.cell.length; i++) {
                if (ord.has(board.cell[i]) || isBlock(board.cell[i]) || isGreen(board.cell[i])) { continue; }
                setGreen(board.cell[i]);
            }
        }
    }

    function CellNoLoop(isBlock, isGreen, setGreen) {
        let ord = new Map();
        let n = 0;
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (!isBlock(cell) || ord.has(cell)) { continue; }
            let dfs = function (c) {
                if (c.isnull || !isBlock(c) || ord.has(c)) { return; }
                ord.set(c, n);
                fourside(dfs, c.adjacent);
            }
            dfs(cell);
            n++;
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (isBlock(cell) || isGreen(cell)) { continue; }
            let templist = [offset(cell, -1, 0), offset(cell, 0, -1), offset(cell, 0, 1), offset(cell, 1, 0)];
            templist = templist.filter(c => !c.isnull && isBlock(c));
            templist = templist.map(c => ord.get(c));
            for (let i = 0; i < templist.length; i++) {
                for (let j = i + 1; j < templist.length; j++) {
                    if (templist[i] === templist[j]) {
                        setGreen(cell);
                    }
                }
            }
        }
    }

    function GreenConnectedInCell() {
        CellConnected(
            function (c) { return c.qsub === CQSUB.green; },
            function (c) { return c.qans === CQANS.block; },
            add_green,
            add_block,
        );
    }

    function BlockConnectedInCell() {
        CellConnected(
            function (c) { return c.qans === CQANS.block; },
            function (c) { return c.qsub === CQSUB.green; },
            add_block,
            add_green,
        );
    }

    function GreenNoLoopInCell() {
        CellNoLoop(
            function (c) { return c.qsub === CQSUB.green; },
            function (c) { return c.qans === CQANS.block; },
            add_block
        );
    }

    function BlockNotAdjacent() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qans !== CQANS.block) { continue; }
            fourside(add_green, cell.adjacent);
        }
    }

    function SingleLoopInCell(pathable = function (c) { return true; }, inPath = function (c) { return false; }) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (!pathable(cell)) {
                fourside(add_cross, cell.adjborder);
            }
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            let fn = function (c, b) {
                if (!c.isnull && pathable(c) && b.qsub !== BQSUB.cross) { emptynum++; }
                linenum += b.line;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2 && cell.ques !== CQUES.ice) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum === 1) {
                fourside(add_cross, adjline);
            }
            //2 degree path
            if (emptynum === 2 && (linenum === 1 || cell.qsub === CQSUB.dot || inPath(cell))) {
                fourside(add_line, adjline);
            }
        }
        //avoid forming multiple loop
        for (let i = 0; i < board.border.length; i++) {
            let border = board.border[i];
            if (border.qsub !== BQSUB.none || border.line) { continue; }
            let cr1 = border.sidecell[0];
            let cr2 = border.sidecell[1];
            if (cr1.ques === CQUES.ice || cr2.ques === CQUES.ice) { continue; }
            if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                add_cross(border);
            }
        }
    }

    function NumberRegion(isBlock, isGreen, setBlock, setGreen, OneNumPerRegion = true, NoGreenNum = true) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            //don't block region exit
            let templist = [offset(cell, -1, -1), offset(cell, -1, 0), offset(cell, -1, 1), offset(cell, 0, -1),
            offset(cell, 0, 1), offset(cell, 1, -1), offset(cell, 1, 0), offset(cell, 1, 1)];
            if (!isBlock(cell) && !isGreen(cell) && templist.filter(c => isGreen(c) || c.isnull).length >= 2) {
                for (let d = 0; d < 4; d++) {
                    let ncell = dir(cell.adjacent, d);
                    if (isGreen(ncell)) { continue; }
                    let cellList = [];
                    let dfs = function (c) {
                        if (cellList.length > MAXDFSCELLNUM) { return; }
                        if (c.isnull || isGreen(c) || c === cell || cellList.indexOf(c) !== -1) { return; }
                        cellList.push(c);
                        fourside(dfs, c.adjacent);
                    }
                    dfs(ncell);
                    if (cellList.length > MAXDFSCELLNUM) { continue; }
                    let templist = cellList.filter(c => c.qnum !== CQNUM.none && (NoGreenNum || isBlock(c)));
                    //extend region without num
                    if (templist.length === 0 && cellList.filter(c => isBlock(c)).length > 0 && OneNumPerRegion) {
                        setBlock(cell);
                    }
                    //extend region with less cells
                    if (templist.length >= 1 && templist[0].qnum !== CQNUM.quesmark && templist[0].qnum > cellList.length) {
                        setBlock(cell);
                    }
                }
            }
            //finished region
            if (cell.qnum > 0) {
                let cellList = [];
                let dfs = function (c) {
                    if (cellList.length > cell.qnum) { return; }
                    if (c.isnull || !isBlock(c) || cellList.indexOf(c) !== -1) { return; }
                    cellList.push(c);
                    fourside(dfs, c.adjacent);
                }
                dfs(cell);
                if (cellList.length === cell.qnum) {
                    cellList.forEach(c => fourside(setGreen, c.adjacent));
                }
            }
            //finished surrounded region
            if (cell.qnum > 0) {
                let cellList = [];
                let dfs = function (c) {
                    if (cellList.length > cell.qnum) { return; }
                    if (c.isnull || isGreen(c) || cellList.indexOf(c) !== -1) { return; }
                    cellList.push(c);
                    fourside(dfs, c.adjacent);
                }
                dfs(cell);
                if (cell.qnum !== CQNUM.quesmark && cell.qnum === cellList.length) {
                    cellList.forEach(c => setBlock(c));
                }
            }
            //not connect two region
            for (let d1 = 0; d1 < 4; d1++) {
                for (let d2 = d1 + 1; d2 < 4; d2++) {
                    if (isBlock(cell) || isGreen(cell)) { continue; }
                    let cell1 = dir(cell.adjacent, d1);
                    let cell2 = dir(cell.adjacent, d2);
                    if (cell1.isnull || cell2.isnull || !isBlock(cell1) || !isBlock(cell2)) { continue; }
                    let cellList1 = [];
                    let cellList2 = [];
                    let dfs = function (c, list) {
                        if (c.isnull || !isBlock(c) || list.indexOf(c) !== -1) { return; }
                        list.push(c);
                        dfs(c.adjacent.top, list);
                        dfs(c.adjacent.bottom, list);
                        dfs(c.adjacent.left, list);
                        dfs(c.adjacent.right, list);
                    }
                    dfs(cell1, cellList1);
                    dfs(cell2, cellList2);
                    if (cellList1.indexOf(cell2) !== -1) { continue; }
                    let templist1 = cellList1.filter(c => c.qnum !== CQNUM.none);
                    let templist2 = cellList2.filter(c => c.qnum !== CQNUM.none);
                    if (templist1.length >= 1 && templist2.length >= 1) {
                        if (templist1[0].qnum !== CQNUM.quesmark && templist2[0].qnum !== CQNUM.quesmark && templist1[0].qnum !== templist2[0].qnum || OneNumPerRegion) {
                            setGreen(cell);
                        }
                    }
                    if (templist1.length + templist2.length >= 1) {
                        let qnum = (templist1.length >= 1 ? templist1[0] : templist2[0]).qnum;
                        if (qnum !== CQNUM.quesmark && cellList1.length + cellList2.length + 1 > qnum) {
                            setGreen(cell);
                        }
                    }
                    if (cell.qnum >= 0 && cellList1.length + cellList2.length + 1 > cell.qnum) {
                        setGreen(cell);
                    }
                }
            }
            //cell and region
            for (let d = 0; d < 4; d++) {
                if (isBlock(cell) || isGreen(cell) || cell.qnum === CQNUM.none) { continue; }
                let ncell = dir(cell.adjacent, d);
                if (ncell.isnull || !isBlock(ncell)) { continue; }
                let cellList = [];
                let dfs = function (c) {
                    if (c.isnull || !isBlock(c) || cellList.indexOf(c) !== -1) { return; }
                    cellList.push(c);
                    fourside(dfs, c.adjacent);
                }
                dfs(ncell, cellList);
                let templist = cellList.filter(c => c.qnum !== CQNUM.none);
                if (templist.length >= 1 && (templist[0].qnum !== CQNUM.quesmark && cell.qnum !== CQNUM.quesmark && templist[0].qnum !== cell.qnum || OneNumPerRegion)) {
                    setGreen(cell);
                }
                if (cell.qnum !== CQNUM.quesmark && cellList.length + 1 > cell.qnum) {
                    setGreen(cell);
                }
            }
        }
    }

    //assist for certain genre
    function SlalomAssist() {
        SingleLoopInCell(
            function (c) { return c.ques !== 1; },
            function (c) { return c.bx === board.startpos.bx && c.by === board.startpos.by; }
        );
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
        let add_star = add_block;
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let cellList = [];
            for (let j = 0; j < room.clist.length; j++) {
                cellList.push(room.clist[j]);
            }
            //finish room
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
            //finish row/col
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
        SingleLoopInCell(
            function (c) { return c.qnum === CQNUM.none; },
        );
        //add invisible qsub at cross
        const INLOOP = 1, OUTLOOP = 2;
        let add_inout = function (cr, qsub) {
            if (cr.isnull || cr.qsub !== 0) { return; }
            cr.setQsub(qsub);
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum !== CQNUM.none) {
                //add qsub around b/w clue
                if (cell.ques === CQUES.black || cell.ques === CQUES.white) {
                    for (let d = 0; d < 4; d++) {
                        add_inout(offset(cell, .5, .5, d), (cell.ques === CQUES.black ? OUTLOOP : INLOOP));
                    }
                }
                //finish clue
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
            //outloop at side
            if (cross.bx === board.minbx || cross.bx === board.maxbx || cross.by === board.minby || cross.by === board.maxby) {
                add_inout(cross, OUTLOOP);
            }
            //no checker
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
            //add line between different i/o
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
            //extend i/o through cross/line
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
        let isEmpty = function (c) { return !c.isnull && c.qnum === CQNUM.none && c.qsub === CQSUB.none && c.qans === CQANS.none; }
        let isDot = function (c) { return !c.isnull && c.qsub === CQSUB.dot; }
        let isDotEmpty = function (c) { return isEmpty(c) || isDot(c); }
        let isBlock = function (c) { return !c.isnull && c.qans === CQANS.block; }
        let isBorderBlock = function (c) { return c.isnull || c.qans === CQANS.block; }
        let isConnectBlock = function (c) { return isBorderBlock(c) || c.qnum !== CQNUM.none; }
        let isCircle = function (c) { return !c.isnull && c.qnum !== CQNUM.none; }
        let isDotCircle = function (c) { return isDot(c) || isCircle(c); }

        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let blocknum = 0;
            let dotnum = 0;
            let fn = function (c) {
                if (isBorderBlock(c)) { blocknum++; }
                if (isDot(c)) { dotnum++; }
            };
            fourside(fn, cell.adjacent);

            //no clue pattern

            //add dot
            if (isEmpty(cell)) {
                for (let d = 0; d < 4; d++) {
                    //cannot place block with 2x2 block rule
                    if (isEmpty(offset(cell, 0, -1, d)) && isBlock(offset(cell, 1, 0, d)) && isBlock(offset(cell, 1, -1, d)) &&
                        (isBorderBlock(offset(cell, 0, -2, d)) || isBorderBlock(offset(cell, -1, -1, d)))) {
                        add_dot(cell);
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isBlock(offset(cell, -1, 0, d)) && isBlock(offset(cell, -1, -1, d)) &&
                        (isBorderBlock(offset(cell, 0, -2, d)) || isBorderBlock(offset(cell, 1, -1, d)))) {
                        add_dot(cell);
                    }
                    else if (isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 0, -1, d)) && isBlock(offset(cell, 1, -1, d)) &&
                        (isBorderBlock(offset(cell, 2, 0, d)) || isBorderBlock(offset(cell, 1, 1, d))) &&
                        (isBorderBlock(offset(cell, 0, -2, d)) || isBorderBlock(offset(cell, -1, -1, d)))) {
                        add_dot(cell);
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, -1, d)) && isBlock(offset(cell, 1, 0, d)) &&
                        isBorderBlock(offset(cell, -1, -1, d)) && isBorderBlock(offset(cell, 0, -2, d)) && offset(cell, 1, -2, d).isnull) {
                        add_dot(cell);
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, -1, d)) && isBlock(offset(cell, -1, 0, d)) &&
                        isBorderBlock(offset(cell, 1, -1, d)) && isBorderBlock(offset(cell, 0, -2, d)) && offset(cell, -1, -2, d).isnull) {
                        add_dot(cell);
                    }
                    //cannot place block with 2x2 dot rule
                    else if (isBlock(offset(cell, 1, 0, d)) && isBlock(offset(cell, 1, 1, d)) && isDot(offset(cell, -1, 2, d)) &&
                        isEmpty(offset(cell, 0, 1, d)) && isDotEmpty(offset(cell, -1, 1, d)) && isDotEmpty(offset(cell, 0, 2, d))) {
                        add_dot(cell);
                    }
                    else if (isBlock(offset(cell, -1, 0, d)) && isBlock(offset(cell, -1, 1, d)) && isDot(offset(cell, 1, 2, d)) &&
                        isEmpty(offset(cell, 0, 1, d)) && isDotEmpty(offset(cell, 1, 1, d)) && isDotEmpty(offset(cell, 0, 2, d))) {
                        add_dot(cell);
                    }
                    //cannot place block with 2x2 block rule and 2x2 dot rule
                    else if (isDotEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 0, -2, d)) &&
                        isBlock(offset(cell, 1, -1, d)) && isBlock(offset(cell, 1, -2, d)) && isBorderBlock(offset(cell, 0, -3, d))) {
                        add_dot(cell);
                    }
                    else if (isDotEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 0, -2, d)) &&
                        isBlock(offset(cell, -1, -1, d)) && isBlock(offset(cell, -1, -2, d)) && isBorderBlock(offset(cell, 0, -3, d))) {
                        add_dot(cell);
                    }
                    else if (isDotEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, -1, -1, d)) &&
                        isBlock(offset(cell, 0, -1, d)) && isBorderBlock(offset(cell, -1, 1, d)) && isBorderBlock(offset(cell, -1, -2, d))) {
                        add_dot(cell);
                    }
                    else if (isDotEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isBlock(offset(cell, 0, -1, d)) && isBorderBlock(offset(cell, 1, 1, d)) && isBorderBlock(offset(cell, 1, -2, d))) {
                        add_dot(cell);
                    }
                    //cannot place block with 2x3 border pattern
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, -1, d)) && isEmpty(offset(cell, 2, -1, d)) &&
                        isDotEmpty(offset(cell, 1, 0, d)) && isDotEmpty(offset(cell, 2, 0, d)) &&
                        isBorderBlock(offset(cell, -1, -1, d)) && isBorderBlock(offset(cell, 3, -1, d)) &&
                        isBorderBlock(offset(cell, 3, 0, d)) && offset(cell, 0, -2, d).isnull) {
                        add_dot(cell);
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, -1, d)) && isEmpty(offset(cell, -2, -1, d)) &&
                        isDotEmpty(offset(cell, -1, 0, d)) && isDotEmpty(offset(cell, -2, 0, d)) &&
                        isBorderBlock(offset(cell, 1, -1, d)) && isBorderBlock(offset(cell, -3, -1, d)) &&
                        isBorderBlock(offset(cell, -3, 0, d)) && offset(cell, 0, -2, d).isnull) {
                        add_dot(cell);
                    }
                }
            }
            if (cell.qsub === CQSUB.dot) {
                //dot cannot be deadend
                if (blocknum === 2) {
                    fourside(add_dot, cell.adjacent);
                }
                for (let d = 0; d < 4; d++) {
                    //avoid 2x2 dot
                    if (isBorderBlock(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                        isEmpty(offset(cell, -1, 0, d)) && isDot(offset(cell, 1, 1, d))) {
                        add_dot(offset(cell, -1, 0, d));
                    }
                    else if (isBorderBlock(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                        isEmpty(offset(cell, 1, 0, d)) && isDot(offset(cell, -1, 1, d))) {
                        add_dot(offset(cell, 1, 0, d));
                    }
                    //dot cannot be deadend with 2x2 dot rule
                    else if (isBorderBlock(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isBorderBlock(offset(cell, 2, 0, d)) &&
                        isBorderBlock(offset(cell, 1, -1, d)) && isEmpty(offset(cell, -1, 0, d))) {
                        add_dot(offset(cell, -1, 0, d));
                    }
                    else if (isBorderBlock(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, 0, d)) && isBorderBlock(offset(cell, -2, 0, d)) &&
                        isBorderBlock(offset(cell, -1, -1, d)) && isEmpty(offset(cell, 1, 0, d))) {
                        add_dot(offset(cell, 1, 0, d));
                    }
                }
            }

            //add block
            if (isEmpty(cell)) {
                //block deadend
                if (blocknum >= 3) {
                    add_block(cell);
                }
                for (let d = 0; d < 4; d++) {
                    //cannot dot with 2x2 dot rule
                    if (isBorderBlock(offset(cell, -1, 0, d)) && isBorderBlock(offset(cell, 2, 0, d)) && isEmpty(offset(cell, 1, 0, d)) &&
                        offset(cell, 0, -1, d).isnull && offset(cell, 1, -1, d).isnull) {
                        add_block(cell);
                    }
                    else if (isBorderBlock(offset(cell, 1, 0, d)) && isBorderBlock(offset(cell, 0, -1, d)) && isDot(offset(cell, -1, 1, d)) &&
                        isDotEmpty(offset(cell, -1, 0, d)) && isDotEmpty(offset(cell, 0, 1, d))) {
                        add_block(cell);
                    }
                }
            }

            //clue pattern

            //any circle clue
            if (cell.qnum !== CQNUM.none) {
                //clue deadend check
                if (blocknum === 3) {
                    fourside(add_dot, cell.adjacent);
                }
                else if (dotnum === 1) {
                    fourside(add_block, cell.adjacent);
                }
                for (let d = 0; d < 4; d++) {
                    //avoid 2x2 block pattern
                    if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isBlock(offset(cell, 0, -2, d)) && isBlock(offset(cell, 1, -2, d))) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isBlock(offset(cell, 2, 0, d)) && isBlock(offset(cell, 2, -1, d))) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isEmpty(offset(cell, 0, -2, d)) && isBlock(offset(cell, 1, -2, d)) &&
                        (isBorderBlock(offset(cell, 0, -3, d)) || isBorderBlock(offset(cell, -1, -2, d)))) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isEmpty(offset(cell, 2, 0, d)) && isBlock(offset(cell, 2, -1, d)) &&
                        (isBorderBlock(offset(cell, 3, 0, d)) || isBorderBlock(offset(cell, 2, 1, d)))) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    //avoid 2x2 block and 2x2 dot apttern
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isDotEmpty(offset(cell, 1, -1, d)) &&
                        isEmpty(offset(cell, 1, -2, d)) && isBlock(offset(cell, 0, -2, d)) && isBorderBlock(offset(cell, 1, -3, d))) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isDotEmpty(offset(cell, 1, -1, d)) &&
                        isEmpty(offset(cell, 2, -1, d)) && isBlock(offset(cell, 2, 0, d)) && isBorderBlock(offset(cell, 3, -1, d))) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    //avoid border 2x2 block
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isDotEmpty(offset(cell, 2, 0, d)) && isEmpty(offset(cell, 2, -1, d)) && isBorderBlock(offset(cell, 3, 0, d)) &&
                        isBorderBlock(offset(cell, 3, -1, d)) && offset(cell, 0, -2, d).isnull) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isDotEmpty(offset(cell, 0, -2, d)) && isEmpty(offset(cell, 1, -2, d)) && isBorderBlock(offset(cell, 0, -3, d)) &&
                        isBorderBlock(offset(cell, 1, -3, d)) && offset(cell, 2, 0, d).isnull) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    //avoid border 2x3 pattern
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isDotEmpty(offset(cell, 2, 0, d)) && isDotEmpty(offset(cell, 2, -1, d)) && isDotEmpty(offset(cell, 3, 0, d)) &&
                        isEmpty(offset(cell, 3, -1, d)) && isBorderBlock(offset(cell, 4, 0, d)) &&
                        isBorderBlock(offset(cell, 4, -1, d)) && offset(cell, 0, -2, d).isnull) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                    else if (isEmpty(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, -1, d)) &&
                        isDotEmpty(offset(cell, 0, -2, d)) && isDotEmpty(offset(cell, 1, -2, d)) && isDotEmpty(offset(cell, 0, -3, d)) &&
                        isEmpty(offset(cell, 1, -3, d)) && isBorderBlock(offset(cell, 0, -4, d)) &&
                        isBorderBlock(offset(cell, 1, -4, d)) && offset(cell, 2, 0, d).isnull) {
                        add_block(offset(cell, 0, 1, d));
                        add_block(offset(cell, -1, 0, d));
                    }
                }
            }
            if (isEmpty(cell)) {
                for (let d = 0; d < 4; d++) {
                    //cannot place block with 2x2 white
                    if (isBlock(offset(cell, 1, 0, d)) && isBlock(offset(cell, 1, 1, d)) && isCircle(offset(cell, -1, 2, d)) &&
                        isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, -1, 1, d)) && isEmpty(offset(cell, 0, 2, d))) {
                        add_dot(cell);
                    }
                    else if (isBlock(offset(cell, -1, 0, d)) && isBlock(offset(cell, -1, 1, d)) && isCircle(offset(cell, 1, 2, d)) &&
                        isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, 1, 1, d)) && isEmpty(offset(cell, 0, 2, d))) {
                        add_dot(cell);
                    }
                    //cannot place dot with 2x2 white
                    else if (isBorderBlock(offset(cell, 1, 0, d)) && isBorderBlock(offset(cell, 0, -1, d)) && isCircle(offset(cell, -1, 1, d)) &&
                        isEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, 0, 1, d))) {
                        add_block(cell);
                    }
                }
            }
            if (cell.qsub === CQSUB.dot) {
                for (let d = 0; d < 4; d++) {
                    //avoid 2x2 white
                    if (isBorderBlock(offset(cell, 0, -1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                        isDotEmpty(offset(cell, -1, 0, d)) && isCircle(offset(cell, 1, 1, d))) {
                        add_dot(offset(cell, -1, 0, d));
                        add_block(offset(cell, 2, 1, d));
                        add_block(offset(cell, 1, 2, d));
                    }
                    else if (isBorderBlock(offset(cell, 0, -1, d)) && isEmpty(offset(cell, -1, 0, d)) && isEmpty(offset(cell, 0, 1, d)) &&
                        isDotEmpty(offset(cell, 1, 0, d)) && isCircle(offset(cell, -1, 1, d))) {
                        add_dot(offset(cell, 1, 0, d));
                        add_block(offset(cell, -2, 1, d));
                        add_block(offset(cell, -1, 2, d));
                    }
                }
            }

            //circle clue with number
            if (cell.qnum >= 2) {
                for (let d = 0; d < 4; d++) {
                    if (isEmpty(offset(cell, 0, -1, d))) {
                        //avoid eyesight too long
                        if (isDotCircle(offset(cell, 0, -cell.qnum, d))) {
                            add_block(offset(cell, 0, -1, d));
                        }
                        //situation for clue at the end
                        else if (isCircle(offset(cell, 0, -cell.qnum + 1, d)) &&
                            offset(cell, 0, -cell.qnum + 1, d).qnum !== CQNUM.circle && offset(cell, 0, -cell.qnum + 1, d).qnum !== cell.qnum) {
                            add_block(offset(cell, 0, -1, d));
                        }
                    }
                    if (isEmpty(offset(cell, 0, -1, d))) {
                        for (let j = 2; j < cell.qnum; j++) {
                            //eyesight not enough long
                            if (j !== cell.qnum - 1 && isConnectBlock(offset(cell, 0, -j, d))) {
                                add_block(offset(cell, 0, -1, d));
                                break;
                            }
                            if (isBorderBlock(offset(cell, 0, -j, d))) {
                                add_block(offset(cell, 0, -1, d));
                                break;
                            }
                            //avoid 2x2 dot
                            if (isDot(offset(cell, 1, -j + 1, d)) && isDot(offset(cell, 1, -j, d))) {
                                add_block(offset(cell, 0, -1, d));
                                break;
                            }
                            if (isDot(offset(cell, -1, -j + 1, d)) && isDot(offset(cell, -1, -j, d))) {
                                add_block(offset(cell, 0, -1, d));
                                break;
                            }
                        }
                    }
                    //extend eyesight
                    if (isDot(offset(cell, 0, -1, d))) {
                        for (let j = 2; j < cell.qnum; j++) {
                            add_dot(offset(cell, 0, -j, d));
                        }
                        add_block(offset(cell, 0, -cell.qnum, d));
                    }
                }
            }
        }
        //2x2 rules
        No2x2Cell(
            function (c) { return c.qans === CQANS.block; },
            add_dot
        );
        No2x2Cell(
            function (c) { return c.qsub === CQSUB.dot; },
            add_block
        );
        CellConnected(isDot, isConnectBlock, add_dot, add_block);
    }

    function ChocoBananaAssist() {
        NumberRegion(
            function (c) { return c.qans === CQANS.block; },
            function (c) { return c.qsub === CQSUB.green; },
            add_block,
            add_green,
            false,
            false
        );
        NumberRegion(
            function (c) { return c.qsub === CQSUB.green; },
            function (c) { return c.qans === CQANS.block; },
            add_green,
            add_block,
            false,
            false
        );
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum === 1 || cell.qnum === 2) {
                add_block(cell);
            }
            let templist = [cell, offset(cell, 0, 1), offset(cell, 1, 0), offset(cell, 1, 1)];
            if (templist.filter(c => c.qans === CQANS.block).length === 3) {
                templist.forEach(c => add_block(c));
            }
            let fn = function (c, c1, c2, c12) {
                if (c1.isnull || c2.isnull || c12.isnull) { return; }
                if (c1.qans === CQANS.block && c2.qans === CQANS.block && c12.qsub === CQSUB.green) {
                    add_green(c);
                }
                if (c1.qans === CQANS.block && c2.qsub === CQSUB.green && c12.qans === CQANS.block) {
                    add_green(c);
                }
                if (c1.qsub === CQSUB.green && c2.qans === CQANS.block && c12.qans === CQANS.block) {
                    add_green(c);
                }
            };
            for (let d = 0; d < 4; d++) {
                fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
            }
            if (cell.qsub === CQSUB.green) {
                let templist = [offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, -1, 0), offset(cell, 0, -1)];
                templist = templist.filter(c => !c.isnull && c.qans !== CQANS.block);
                if (templist.length === 1) {
                    let ncell = templist[0];
                    add_green(ncell);
                    let templist2 = [offset(ncell, 1, 0), offset(ncell, 0, 1), offset(ncell, -1, 0), offset(ncell, 0, -1)];
                    templist2 = templist2.filter(c => !c.isnull && c.qans !== CQANS.block && c !== cell);
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
            //finish clue
            if (cross.qnum >= 0) {
                if (adjcellList.filter(c => c[0].qans === c[1]).length === cross.qnum) {
                    adjcellList.forEach(c => add_slash(c[0], c[2]));
                }
                if (adjcellList.filter(c => c[0].qans !== c[2]).length === cross.qnum) {
                    adjcellList.forEach(c => add_slash(c[0], c[1]));
                }
            }
            //diagonal 1 & 1
            if (cross.qnum === 1 && isNotSide(cross)) {
                for (let d = 0; d < 4; d++) {
                    let cross2 = offset(cross, 1, 1, d);
                    if (cross2.qnum === 1 && isNotSide(cross2)) {
                        add_slash(offset(cross, .5, .5, d), CQANS.lslash + d);
                    }
                }
            }
            //1 & 1
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
            //3 & 3
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
        //no loop
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
            //add dot on num
            let cell = board.cell[i];
            if (cell.qnum !== CQNUM.none) {
                add_green(cell);
            }
            //surrounded white cell
            let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
            if (cell.qnum === CQNUM.none && templist.filter(c => c.isnull || c.qans === CQANS.block).length === 4) {
                add_block(cell);
            }
        }
        flg = 0;
        BlockConnectedInCell();
        No2x2Block();
        NumberRegion(
            function (c) { return c.qsub === CQSUB.dot; },
            function (c) { return c.qans === CQANS.block; },
            add_green,
            add_block
        );
        //unreachable cell
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
            if (list.filter(c => c.qnum === CQNUM.quesmark).length === 0) {
                for (let i = 0; i < board.cell.length; i++) {
                    let cell = board.cell[i];
                    if (list.indexOf(cell) === -1) {
                        add_block(cell);
                    }
                }
            }
        }
        //remove the dot on num because it looks weird
        if (!step) {
            for (let i = 0; i < board.cell.length; i++) {
                let cell = board.cell[i];
                if (cell.qnum !== CQNUM.none) {
                    cell.setQsub(CQSUB.none);
                    cell.draw();
                }
            }
        }
    }

    function GuideArrowAssist() {
        BlockNotAdjacent();
        GreenConnectedInCell();
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
        CellConnected(
            function (c) { return c.anum === CANUM.wcir; },
            function (c) { return c.anum === CANUM.bcir; },
            add_white,
            add_black,
        );
        CellConnected(
            function (c) { return c.anum === CANUM.bcir; },
            function (c) { return c.anum === CANUM.wcir; },
            add_black,
            add_white,
        );
        No2x2Cell(
            function (c) { return c.anum === CANUM.wcir; },
            add_black
        );
        No2x2Cell(
            function (c) { return c.anum === CANUM.bcir; },
            add_white
        );
        //cell at side is grouped when both sides are even
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
            //WbB
            //W.W
            if (cell.anum === CANUM.none) {
                for (let d = 0; d < 4; d++) {
                    let templist = [offset(cell, 1, -1, d), offset(cell, 1, 1, d), offset(cell, 0, -1, d), offset(cell, 0, 1, d)];
                    if (templist.filter(c => c.isnull || c.anum === CANUM.none).length === 0 &&
                        templist[0].anum === templist[1].anum && templist[2].anum !== templist[3].anum) {
                        add_color(cell, CANUM.bcir + CANUM.wcir - templist[0].anum);
                    }
                }
            }
            //checker pattern
            if (cell.anum === CANUM.none) {
                let fn = function (c, c1, c2, c12) {
                    if (c1.isnull || c2.isnull || c12.isnull) { return; }
                    if (c1.anum === CANUM.none || c2.anum === CANUM.none || c12.anum === CANUM.none) { return; }
                    if (c1.anum === c2.anum && c1.anum !== c12.anum) {
                        add_color(c, c1.anum);
                    }
                };
                for (let d = 0; d < 4; d++) {
                    fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
                }
            }
        }
        //outside
        {
            let firstcell = board.cell[0];
            let cellList = [];
            for (let j = 0; j < board.rows; j++) { cellList.push(offset(firstcell, 0, j)); }
            for (let i = 1; i < board.cols - 1; i++) { cellList.push(offset(firstcell, i, board.rows - 1)); }
            for (let j = board.rows - 1; j >= 0; j--) { cellList.push(offset(firstcell, board.cols - 1, j)); }
            for (let i = board.cols - 2; i > 0; i--) { cellList.push(offset(firstcell, i, 0)); }
            let len = cellList.length;
            if (cellList.filter(c => c.anum === CANUM.bcir).length > 0 && cellList.filter(c => c.anum === CANUM.wcir).length > 0) {
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

    function NurimazeAssist() {
        No2x2Block();
        No2x2Green();
        CellConnected(
            function (c) { return c.qsub === CQSUB.green; },
            function (c) { return c.qans === CQANS.block; },
            add_green,
            add_block,
            function (c, nb, nc) { return c.room === nc.room; },
        );
        CellConnected(
            function (c) {
                let startcell = board.getc(board.startpos.bx, board.startpos.by);
                let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
                return c === startcell || c === goalcell || c.ques === CQUES.cir;
            },
            function (c) { return c.qans === CQANS.block || c.ques === CQUES.tri; },
            add_green,
            add_block,
            function (c, nb, nc) { return c.room === nc.room; },
        );
        let startcell = board.getc(board.startpos.bx, board.startpos.by);
        let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let cellList = [];
            for (let j = 0; j < room.clist.length; j++) {
                cellList.push(room.clist[j]);
            }
            if (cellList.filter(c => c.qsub === CQSUB.green || c.ques === CQUES.cir || c.ques === CQUES.tri).length > 0 ||
                room === startcell.room || room === goalcell.room) {
                cellList.forEach(c => add_green(c));
                continue;
            }
            if (cellList.filter(c => c.qans === CQANS.block).length > 0) {
                cellList.forEach(c => add_block(c));
                continue;
            }
            //no loop
            let templist = [];
            cellList.forEach(c => {
                let fn = function (c) {
                    if (c.isnull || templist.indexOf(c) !== -1) { return; }
                    templist.push(c);
                }
                let list = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 0, 1), offset(c, 1, 0)];
                list.forEach(c => fn(c));
            });
            templist = templist.filter(c => !c.isnull && c.qsub === CQSUB.green);
            if (templist.length < 2) { continue; }
            let fn1 = function (c) {
                let dfslist = [];
                let dfs = function (c) {
                    if (c.isnull || c.qsub !== CQSUB.green || dfslist.indexOf(c) !== -1) { return; }
                    dfslist.push(c);
                    fourside(dfs, c.adjacent);
                };
                dfs(c);
                return dfslist.filter(c => templist.indexOf(c) !== -1).length;
            };
            let templist2 = templist.map(c => fn1(c));
            if (templist2.filter(n => n > 1).length > 0) {
                cellList.forEach(c => add_block(c));
                continue;
            }
            //no branch
            let fn2 = function (c) {
                let res = 0;
                let dfslist = [];
                let dfs = function (c) {
                    if (c.isnull || c.qsub !== CQSUB.green || dfslist.indexOf(c) !== -1) { return; }
                    if (c === startcell || c === goalcell || c.ques === CQUES.cir || c.lcnt > 0) {
                        res += c === startcell;
                        res += c === goalcell;
                        res += (c.ques === CQUES.cir && c.lcnt === 0);
                        res += c.lcnt;
                        res += (dfslist.filter(c => c.ques === CQUES.tri).length > 0 ? 2 : 0);
                        return;
                    }
                    dfslist.push(c);
                    fourside(dfs, c.adjacent);
                    dfslist.pop();
                }
                dfs(c);
                return Math.min(res, 2);
            }
            templist2 = templist.map(c => fn2(c));
            if (templist2.reduce(function (a, b) { return a + b; }) > 2) {
                cellList.forEach(c => add_block(c));
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.ques === CQUES.cir) {
                let templist = [offset(cell, -1, 0), offset(cell, 1, 0), offset(cell, 0, -1), offset(cell, 0, 1)];
                templist = templist.filter(c => !c.isnull && c.qans !== CQANS.block);
                if (templist.length === 2) {
                    templist.forEach(c => add_green(c));
                }
            }
            //surrounded by block
            {
                let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
                if (templist.filter(c => c.isnull || c.qans === CQANS.block).length === 4) {
                    add_block(cell);
                }
            }
            //no 2*2
            {
                let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
                if (templist.filter(c => c.isnull).length == 0 && templist.filter(c => c.qsub === CQSUB.green).length === 0) {
                    let templist2 = templist.filter(c => !c.qans);
                    if (templist2.length > 0 && templist2.filter(c => c.room !== templist2[0].room).length === 0) {
                        add_green(templist2[0]);
                    }
                }
                if (templist.filter(c => c.qans).length === 0) {
                    let templist2 = templist.filter(c => c.qsub !== CQSUB.green);
                    if (templist2.length > 0 && templist2.filter(c => c.room !== templist2[0].room).length === 0) {
                        add_block(templist2[0]);
                    }
                }
            }
        }
        //line
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            if (cell.qans === CQANS.block || cell.ques === CQUES.tri) {
                fourside(add_cross, adjline);
            }
            if (cell.qans !== CQANS.block) {
                let emptynum = 0;
                let linenum = 0;
                let fn = function (c, b) {
                    if (!c.isnull && b.qsub !== BQSUB.cross) { emptynum++; }
                    linenum += b.line;
                };
                fourside2(fn, adjcell, adjline);
                if (linenum > 0) {
                    add_green(cell);
                }
                //no branch
                if (linenum === 2 || linenum === 1 && (cell === startcell || cell === goalcell)) {
                    fourside(add_cross, adjline);
                }
                //no deadend
                if (emptynum === 1) {
                    if (cell !== startcell && cell !== goalcell) {
                        fourside(add_cross, adjline);
                    } else {
                        let fn = function (c, b) {
                            if (!c.isnull && b.qsub !== BQSUB.cross) {
                                add_line(b);
                            }
                        }
                        fourside2(fn, adjcell, adjline);
                    }
                }
                //2 degree path
                if (emptynum === 2 && cell !== startcell && cell !== goalcell && (linenum === 1 || cell.ques === CQUES.cir)) {
                    let fn = function (c, b) {
                        add_line(b);
                        if (!b.isnull && b.line) {
                            add_green(c);
                        }
                    };
                    fourside2(fn, adjcell, adjline);
                }
                //extend line
                emptynum = 0;
                linenum = 0;
                fourside2(fn, adjcell, adjline);
                if (linenum === 1 && cell !== startcell && cell !== goalcell ||
                    linenum === 0 && (cell === startcell || cell === goalcell || cell.ques == CQUES.cir)) {
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
        BlockNotAdjacent();
        GreenConnectedInCell();
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum !== CQNUM.none) {
                add_block(cell);
            }
            if (cell.qnum > 0) {
                let templist = [];
                let fn = function (c) {
                    if (c.qans !== CQANS.block) { return; }
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
        //add cross outside except IN and OUT
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
                add_arrow(border, border.qdir + 10);   //from qdir to bqsub
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
        No2x2Block();
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let templist = [];
            for (let j = 0; j < room.clist.length; j++) {
                templist.push(room.clist[j]);
            }
            if (templist.filter(c => c.qsub !== CQSUB.dot).length === 4) {
                templist.forEach(c => add_block(c));
            }
            if (templist.filter(c => c.qans === CQANS.block).length === 4) {
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
                if (room.clist[j].qans !== CQANS.block) { continue; }
                templist2 = [];
                fn = function (c, step = 3) {
                    if (step < 0 || c.room !== room) { return; }
                    templist2.push(c);
                    fn(c.adjacent.top, step - 1);
                    fn(c.adjacent.bottom, step - 1);
                    fn(c.adjacent.left, step - 1);
                    fn(c.adjacent.right, step - 1);
                }
                fn(room.clist[j]);
                templist.forEach(c => {
                    if (templist2.indexOf(c) === -1) {
                        add_dot(c);
                    }
                });
            }
        }
    }

    function NothreeAssist() {
        BlockNotAdjacent();
        GreenConnectedInCell();
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
            let blocknum = 0;
            let emptynum = 0;
            cellList.forEach(c => {
                blocknum += c.qans === CQANS.block;
                emptynum += c.qans !== CQANS.block && c.qsub !== CQSUB.dot;
            });
            if (blocknum === 0 && emptynum === 1) {
                cellList.forEach(c => add_block(c));
            }
            if (blocknum === 1) {
                cellList.forEach(c => add_green(c));
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            for (let d = 0; d < 4; d++) {
                let fn = function (list) {
                    if (list.filter(c => c.isnull).length === 0 && list.filter(c => c.qans === CQANS.block).length === 2) {
                        list.forEach(c => add_green(c));
                    }
                }
                //O.O.O
                fn([cell, offset(cell, 2, 0, d), offset(cell, 4, 0, d)]);
                //O..O..O
                fn([cell, offset(cell, 3, 0, d), offset(cell, 6, 0, d)]);
                //O...O...O
                fn([cell, offset(cell, 4, 0, d), offset(cell, 8, 0, d)]);
                //OXXXXOX?XXO
                for (let l = 5; l * 2 < Math.max(board.cols, board.rows); l++) {
                    let templist1 = [cell, offset(cell, l, 0, d), offset(cell, 2 * l, 0, d)];
                    if (templist1.filter(c => c.isnull).length > 0) { continue; }
                    templist1 = templist1.filter(c => c.qans !== CQANS.block);
                    let templist2 = [];
                    for (let j = 1; j < 2 * l; j++) {
                        if (j === l) { continue; }
                        templist2.push(offset(cell, j, 0, d));
                    }
                    if (templist2.filter(c => c.qans === CQANS.block).length > 0) { continue; }
                    templist2 = templist2.filter(c => c.qsub !== CQSUB.dot);
                    if (templist1.length === 0 && templist2.length === 1) {
                        add_block(templist2[0]);
                    }
                    if (templist1.length === 1 && templist2.length === 0) {
                        add_green(templist1[0]);
                    }
                }
            }
        }
    }

    function EkawayehAssist() {
        HeyawakeAssist();
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let qnum = room.top.qnum;
            let rows = room.clist.getRectSize().rows;
            let cols = room.clist.getRectSize().cols;
            let tx = room.clist.getRectSize().x1 + room.clist.getRectSize().x2;
            let ty = room.clist.getRectSize().y1 + room.clist.getRectSize().y2;
            if (rows % 2 === 1 && cols % 2 === 0) {
                add_green(board.getc(tx / 2 - 1, ty / 2));
                add_green(board.getc(tx / 2 + 1, ty / 2));
            }
            if (rows % 2 === 0 && cols % 2 === 1) {
                add_green(board.getc(tx / 2, ty / 2 - 1));
                add_green(board.getc(tx / 2, ty / 2 + 1));
            }
            if (rows % 2 === 1 && cols % 2 === 1) {
                if (qnum >= 0 && qnum % 2 === 0) {
                    add_green(board.getc(tx / 2, ty / 2));
                }
                if (qnum >= 0 && qnum % 2 === 1) {
                    add_block(board.getc(tx / 2, ty / 2));
                }
            }
            for (let j = 0; j < room.clist.length; j++) {
                let cell = room.clist[j];
                if (cell.qsub === CQSUB.green) {
                    add_green(board.getc(tx - cell.bx, ty - cell.by));
                }
                if (cell.qans === CQANS.block) {
                    add_block(board.getc(tx - cell.bx, ty - cell.by));
                }
            }
        }
    }

    function ShakashakaAssist() {
        let isEmpty = function (c) {
            return !c.isnull && c.qnum === CQNUM.none && c.qsub === CQSUB.none && c.qans === CQANS.none;
        };
        //draw triangle
        let add_triangle = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            if (c === undefined || c.isnull || !isEmpty(c)) { return; }
            if (step && flg) { return; }
            flg = true;
            ndir = (ndir % 4 + 4) % 4;
            c.setQans(ndir + 2);
            c.draw();
        };
        //check blocking edge
        let isEdge = function (c, ndir) { //0 = left, 1 = bottom, 2 = right, 3 = top
            ndir = (ndir % 4 + 4) % 4;
            let tdir = (ndir + 3) % 4;
            return c.isnull || c.qnum !== CQNUM.none || c.qans === tdir + 2 || c.qans === ndir + 2;
        };
        //check dot area if stick edge
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
                dfs(dir(c.adjacent, 3 - d), d);
            }
            return temp;
        };
        //check blocking edge including dot
        let isEdgeEx = function (c, ndir) { //0 = left, 1 = bottom, 2 = right, 3 = top
            return isEdge(c, ndir) || isDotEdge(c);
        };
        //check blocking corner including dot
        let isCorner = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            ndir = (ndir % 4 + 4) % 4;
            return c.isnull || c.qnum !== CQNUM.none || c.qans === ndir + 2 || isDotEdge(c);
        };
        //check blocking sharp including dot
        let isSharp = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            ndir = (ndir % 4 + 4) % 4;
            return isEdgeEx(c, ndir) || c.qans === (ndir + 1) % 4 + 2;
        };
        //if can place triangle of specific direction
        let isntTri = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
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
        //extend of isntTri including some complex logic
        let isntTriEx = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            if (isntTri(c, ndir)) { return true; }
            let templist = [offset(c, -1, 0, ndir), offset(c, 0, 1, ndir), offset(c, -2, 0, ndir),
            offset(c, 0, 2, ndir), offset(c, -1, 1, ndir)];
            if (isEmpty(templist[0]) && isEmpty(templist[1]) && isEdgeEx(templist[2], ndir + 2) &&
                isEdgeEx(templist[3], ndir + 3) && isEmpty(templist[4]) && isntTri(templist[4], ndir + 2)) {
                return true;
            }
            return false;
        }

        //start assist
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let trinum = 0;
            let emptynum = 0;
            let fn = function (c) {
                if (!c.isnull && c.qans >= 2) { trinum++; }
                if (isEmpty(c)) { emptynum++; }
            };
            fourside(fn, adjcell);

            //add dot

            //cannot place any triangle
            {
                let temp = true;
                for (let d = 0; d < 4; d++) {
                    temp &= isntTriEx(cell, d);
                }
                if (temp) { add_dot(cell); }
            }
            //fill rectangle
            {
                let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
                if (templist.filter(c => c.isnull).length === 0) {
                    templist = templist.filter(c => c.qsub !== CQSUB.dot);
                    if (templist.length === 1) {
                        add_dot(templist[0]);
                    }
                }
            }
            //dot by clue
            if (trinum === cell.qnum) {
                fourside(add_dot, adjcell);
            }
            //pattern with clue 1
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

            //add triangle

            //cannot form non-rectangle
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
            //triangle by clue
            if (emptynum === cell.qnum - trinum) {
                for (let d = 0; d < 4; d++) {
                    let adj = dir(adjcell, 4 - d);
                    if (isEmpty(adj)) {
                        if (isntTriEx(adj, d)) { add_triangle(adj, d + 1); }
                        else if (isntTriEx(adj, d + 1)) { add_triangle(adj, d); }
                    }
                }
            }
            //side extend
            if (cell.qans >= 2) {
                let ndir = cell.qans - 2;
                //rectangle needs turn or cannot turn
                if (isntTriEx(offset(cell, -1, -1, ndir), ndir)) { add_triangle(offset(cell, 0, -1, ndir), ndir + 3); }
                else if (isntTriEx(offset(cell, 0, -1, ndir), ndir + 3)) { add_triangle(offset(cell, -1, -1, ndir), ndir); }
                if (isntTriEx(offset(cell, 1, 1, ndir), ndir)) { add_triangle(offset(cell, 1, 0, ndir), ndir + 1); }
                else if (isntTriEx(offset(cell, 1, 0, ndir), ndir + 1)) { add_triangle(offset(cell, 1, 1, ndir), ndir); }
                //only one opposite side position
                if (isEdgeEx(offset(cell, 2, -1, ndir), ndir)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
                else if (isEdgeEx(offset(cell, 1, -2, ndir), ndir + 1)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
                else if (isSharp(offset(cell, 2, -2, ndir), ndir)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
                //rectangle opposite side extend
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
            //2x2 pattern
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
        GreenConnectedInCell();
        BlockNotAdjacent();
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let blocknum = 0;
            let fn = function (c) {
                blocknum += c.isnull || c.qans === CQANS.block;
            };
            fourside(fn, adjcell);
            //no two facing doors
            for (let d = 0; d < 4; d++) {
                if (cell.qsub !== CQSUB.green) { break; }
                let pcell = dir(cell.adjacent, d);
                let bordernum = 0;
                let emptycellList = [cell];
                while (!pcell.isnull && pcell.qans !== CQANS.block && bordernum < 2) {
                    if (dir(pcell.adjborder, d + 2).ques) {
                        bordernum++;
                    }
                    emptycellList.push(pcell);
                    pcell = dir(pcell.adjacent, d);
                }
                emptycellList = emptycellList.filter(c => c.qsub !== CQSUB.green);
                if (bordernum === 2 && emptycellList.length === 1) {
                    add_block(emptycellList[0]);
                }
            }
        }
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            if (room.top.qnum === CQNUM.none) { continue; }
            let blocknum = 0;
            let emptynum = 0;
            let oddcellList = [];
            let evencellList = [];
            let minx = room.clist.getRectSize().x2;
            let maxx = room.clist.getRectSize().x1;
            let miny = room.clist.getRectSize().y2;
            let maxy = room.clist.getRectSize().y1;
            for (let j = 0; j < room.clist.length; j++) {
                let cell = room.clist[j];
                blocknum += cell.qans === CQANS.block;
                emptynum += cell.qans !== CQANS.block && cell.qsub !== CQSUB.green;
                if (cell.qans !== CQANS.block && cell.qsub !== CQSUB.green && (cell.bx + cell.by) % 4 === 2) {
                    oddcellList.push(cell);
                }
                if (cell.qans !== CQANS.block && cell.qsub !== CQSUB.green && (cell.bx + cell.by) % 4 === 0) {
                    evencellList.push(cell);
                }
                if (cell.qans !== CQANS.block && cell.qsub !== CQSUB.green) {
                    minx = Math.min(minx, cell.bx);
                    maxx = Math.max(maxx, cell.bx);
                    miny = Math.min(miny, cell.by);
                    maxy = Math.max(maxy, cell.by);
                }
            }
            if (emptynum === 0) { continue; }
            //finished room
            if (blocknum === room.top.qnum) {
                for (let j = 0; j < room.clist.length; j++) {
                    add_green(room.clist[j]);
                }
            }
            //finish room
            if (blocknum + emptynum === room.top.qnum) {
                for (let j = 0; j < room.clist.length; j++) {
                    add_block(room.clist[j]);
                }
            }
            //4 in 3*3
            if (maxx - minx === 4 && maxy - miny === 4 && blocknum + 4 === room.top.qnum) {
                let ccell = board.getc(minx + 2, miny + 2)
                add_green(offset(ccell, 0, -1));
                add_green(offset(ccell, 0, +1));
                add_green(offset(ccell, -1, 0));
                add_green(offset(ccell, +1, 0));
                let fn = function (c) { return c.isnull || c.qans === CQANS.block; }
                if (fn(offset(ccell, +2, 0)) || fn(offset(ccell, 0, +2))) { add_block(offset(ccell, -1, -1)); }
                if (fn(offset(ccell, +2, 0)) || fn(offset(ccell, 0, -2))) { add_block(offset(ccell, -1, +1)); }
                if (fn(offset(ccell, -2, 0)) || fn(offset(ccell, 0, +2))) { add_block(offset(ccell, +1, -1)); }
                if (fn(offset(ccell, -2, 0)) || fn(offset(ccell, 0, -2))) { add_block(offset(ccell, +1, +1)); }
            }
            //2 in 2*2 at corner
            if (maxx - minx === 2 && maxy - miny === 2 && blocknum + 2 === room.top.qnum) {
                if (minx - 1 === board.minbx && miny - 1 === board.minby || maxx + 1 === board.maxbx && maxy + 1 === board.maxby) {
                    add_block(board.getc(minx, miny));
                    add_block(board.getc(maxx, maxy));
                }
                if (minx - 1 === board.minbx && maxy + 1 === board.maxby || maxx + 1 === board.maxbx && miny - 1 === board.minby) {
                    add_block(board.getc(minx + 2, miny));
                    add_block(board.getc(minx, miny + 2));
                }
            }
            //3 in 2*3 at side
            if ((maxx - minx === 4 && maxy - miny === 2 || maxx - minx === 2 && maxy - miny === 4) && blocknum + 3 === room.top.qnum) {
                if (maxx - 3 === board.minbx || maxy - 3 === board.minby) {
                    add_block(board.getc(minx, miny + 2));
                    add_block(board.getc(minx + 2, miny));
                }
                if (minx + 3 === board.maxbx || miny + 3 == board.maxby) {
                    add_block(board.getc(maxx, maxy - 2));
                    add_block(board.getc(maxx - 2, maxy));
                }
            }
            let connectedcellList = [];
            let fn = function (c) {
                if (connectedcellList.indexOf(c.id) !== -1) { return; }
                if (c.isnull || c.qans === CQANS.block || c.qsub === CQSUB.green) { return; }
                if (c.room !== room) { return; }
                connectedcellList.push(c.id);
                fourside(fn, c.adjacent);
            }
            fn(oddcellList.length > 0 ? oddcellList[0] : evencellList[0]);
            if (connectedcellList.length < emptynum) { continue; }
            if (!(maxx - minx <= 2 || maxy - miny <= 2 || (maxx - minx === 4 && maxy - miny === 4))) { continue; }
            //add at odd
            if (blocknum + oddcellList.length === room.top.qnum && oddcellList.length > evencellList.length) {
                for (let j = 0; j < oddcellList.length; j++) {
                    add_block(oddcellList[j]);
                }
            }
            //add at even
            if (blocknum + evencellList.length === room.top.qnum && evencellList.length > oddcellList.length) {
                for (let j = 0; j < evencellList.length; j++) {
                    add_block(evencellList[j]);
                }
            }
        }
    }

    function AkariAssist() {
        let isEmpty = function (c) { return !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.light && c.qsub !== CQSUB.dot; };
        let isNotLight = function (c) { return c.isnull || c.qnum !== CQNUM.none || c.qsub === CQSUB.dot; }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let emptynum = 0;
            let lightnum = 0;
            //add dot where lighted
            if (cell.qlight && cell.qans !== CQANS.light) {
                add_dot(cell);
            }
            //only one place can light
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
            let fn = function (c) {
                if (!c.isnull && c.qnum === CQNUM.none && c.qsub !== CQSUB.dot && c.qans !== CQANS.light) { emptynum++; }
                lightnum += (c.qans === CQANS.light);
            };
            fourside(fn, adjcell);
            if (cell.qnum >= 0) {
                //finished clue
                if (cell.qnum === lightnum) {
                    fourside(add_dot, adjcell);
                }
                //finish clue
                if (cell.qnum === emptynum + lightnum) {
                    fourside(add_light, adjcell);
                }
                //dot at corner
                if (cell.qnum - lightnum + 1 === emptynum) {
                    for (let d = 0; d < 4; d++) {
                        if (isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, 1, d))) {
                            add_dot(offset(cell, 1, 1, d));
                        }
                    }
                }
            }
            //3 & 1
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
            //2 & 1
            if (cell.qnum === 2) {
                for (let d = 0; d < 4; d++) {
                    if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1) {
                        add_dot(offset(cell, -1, -1, d));
                    }
                }
            }
            //1 & 1
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
        SingleLoopInCell();
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
            if (cell.qnum === CQNUM.wcir) {//white
                for (let d = 0; d < 4; d++) {
                    //go straight
                    if (dir(adjline, d).line || dir(adjline, d + 1).qsub === BQSUB.cross || dir(adjline, d + 1).isnull) {
                        add_line(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                        add_cross(dir(adjline, d + 1));
                        add_cross(dir(adjline, d + 3));
                    }
                    //turn at one side
                    if (dir(adjline, d).line && dir(dir(adjcell, d).adjborder, d).line) {
                        add_cross(dir(dir(adjcell, d + 2).adjborder, d + 2));
                    }
                    //no turn on both side
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
            if (cell.qnum === CQNUM.bcir) {//black
                for (let d = 0; d < 4; d++) {
                    //can't go straight this way
                    if (dir(adjcell, d).isnull || dir(adjline, d).qsub === BQSUB.cross ||
                        dir(dir(adjcell, d).adjacent, d).isnull || dir(dir(adjcell, d).adjborder, d).qsub === BQSUB.cross ||
                        dir(adjcell, d).qnum === CQNUM.bcir || dir(adjline, d + 2).line) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //going straight this way will branch
                    if (dir(adjcell, d).isnull || dir(dir(adjcell, d).adjborder, d + 1).line ||
                        dir(dir(adjcell, d).adjborder, d + 3).line) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //go straight
                    if (dir(adjline, d).line) {
                        add_line(dir(dir(adjcell, d).adjborder, d));
                    }
                }
            }
        }
    }

    function SimpleloopAssist() {
        SingleLoopInCell(
            function (c) { return c.qnum !== CQNUM.block; },
            function (c) { return c.qnum !== CQNUM.block; },
        );
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            if (cell.ques === CQUES.bwall) {
                fourside(add_cross, adjline);
            }
        }
    }

    function YajilinAssist() {
        SingleLoopInCell(
            function (c) { return c.qnum === CQNUM.none; },
        );
        let isPathable = function (c) { return !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.block; };
        let isEmpty = function (c) { return !c.isnull && c.qnum === CQNUM.none && c.qans !== CQANS.block && c.qsub !== CQSUB.dot && c.lcnt === 0; };
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            //check clue
            if (cell.qnum >= 0 && cell.qdir !== QDIR.none) {
                let d = qdirremap(cell.qdir);
                let emptynum = 0;
                let blocknum = 0;
                let lastcell = cell;
                let pcell = dir(cell.adjacent, d);
                let emptycellList = [];
                let addcellList = [];
                while (!pcell.isnull && (pcell.qdir !== cell.qdir || pcell.qnum < 0)) {
                    if (isEmpty(pcell)) {
                        emptynum++;
                        emptycellList.push(pcell);
                    }
                    blocknum += pcell.qans === CQANS.block;
                    if (isEmpty(lastcell) && isEmpty(pcell)) {
                        lastcell = cell;
                        emptynum--;
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
                    blocknum += pcell.qnum;
                }
                //finish clue
                if (emptynum + blocknum === cell.qnum) {
                    addcellList.forEach(cell => add_block(cell, 1));
                }
                //finished clue
                if (blocknum === cell.qnum) {
                    emptycellList.forEach(cell => add_dot(cell));
                }
            }
            //add cross
            if (cell.qnum !== CQNUM.none) {
                fourside(add_cross, adjline);
                continue;
            }
            //add dot around block
            if (cell.qans === CQANS.block) {
                fourside(add_cross, adjline);
                fourside(add_dot, adjcell);
                continue;
            }
            let fn = function (c, b) {
                if (isPathable(c) && b.qsub !== BQSUB.cross) { emptynum++; }
                linenum += b.line;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum <= 1) {
                add_block(cell);
                fourside(add_cross, adjline);
                fourside(add_dot, adjcell);
            }
            //2 degree cell no deadend
            if (emptynum === 2) {
                let fn = function (c, b) {
                    if (!isPathable(c) || b.qsub === BQSUB.cross) { return; }
                    add_dot(c);
                };
                fourside2(fn, adjcell, adjline);
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
        let add_bg_inner_color = function (c) {
            add_bg_color(c, CQSUB.green);
        }
        let add_bg_outer_color = function (c) {
            add_bg_color(c, CQSUB.yellow);
        }
        CellConnected(
            function (c) { return c.qsub === CQSUB.green; },
            function (c) { return c.qsub === CQSUB.yellow || c.qsub === CQSUB.none && c.qnum === 3; },
            add_bg_inner_color,
            add_bg_outer_color,
            function (c, nb, nc) { return nb.qsub === BQSUB.cross },
            function (c, nb, nc) { return nb.line; },
        );
        CellConnected(
            function (c) { return c.qsub === CQSUB.yellow; },
            function (c) { return c.qsub === CQSUB.green || c.qsub === CQSUB.none && c.qnum === 3; },
            add_bg_outer_color,
            add_bg_inner_color,
            function (c, nb, nc) { return nb.qsub === BQSUB.cross },
            function (c, nb, nc) { return nb.line; },
            true,
        );
        let twonum = 0;
        let threenum = 0;
        for (let i = 0; i < board.cell.length; i++) {
            twonum += board.cell[i].qnum === 2;
            threenum += board.cell[i].qnum === 3;
        }
        // deduce cell
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            let emptynum = 0;
            let linenum = 0;
            //add cross for 0
            if (cell.qnum === 0) {
                fourside(add_cross, adjline);
            }
            let fn = function (b) {
                if (b.qsub !== BQSUB.cross) { emptynum++; }
                linenum += (b.line);
            };
            fourside(fn, adjline);
            //finish number
            if (emptynum === cell.qnum) {
                fourside(add_line, adjline);
            }
            //add cross for finished number
            if (linenum === cell.qnum) {
                fourside(add_cross, adjline);
            }
            // vertical 3s
            if (cell.qnum === 3 && !adjcell.bottom.isnull && adjcell.bottom.qnum === 3 && (threenum > 2 || twonum > 0)) {
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.bottom);
                add_line(adjcell.bottom.adjborder.bottom);
                if (!adjcell.left.isnull) { add_cross(adjcell.left.adjborder.bottom); }
                if (!adjcell.right.isnull) { add_cross(adjcell.right.adjborder.bottom); }
            }
            // horizontal 3s
            if (cell.qnum === 3 && !adjcell.right.isnull && adjcell.right.qnum === 3 && (threenum > 2 || twonum > 0)) {
                add_line(cell.adjborder.left);
                add_line(cell.adjborder.right);
                add_line(adjcell.right.adjborder.right);
                if (!adjcell.top.isnull) { add_cross(adjcell.top.adjborder.right); }
                if (!adjcell.bottom.isnull) { add_cross(adjcell.bottom.adjborder.right); }
            }
            //sub diagonal 3s
            if (cell.qnum === 3 && !adjcell.bottom.isnull && !adjcell.bottom.adjacent.left.isnull && adjcell.bottom.adjacent.left.qnum === 3) {
                let cell2 = adjcell.bottom.adjacent.left;
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.right);
                add_line(cell2.adjborder.bottom);
                add_line(cell2.adjborder.left);
            }
            //main diagonal 3s
            if (cell.qnum === 3 && !adjcell.bottom.isnull && !adjcell.bottom.adjacent.right.isnull && adjcell.bottom.adjacent.right.qnum === 3) {
                let cell2 = adjcell.bottom.adjacent.right;
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.left);
                add_line(cell2.adjborder.bottom);
                add_line(cell2.adjborder.right);
            }
        }
        //deduce cross
        for (let i = 0; i < board.cross.length; i++) {
            let cross = board.cross[i];
            let crsline = cross.adjborder;
            let emptynum = 0;
            let linenum = 0;
            let fn = function (b) {
                if (b !== undefined && !b.isnull && b.qsub !== BQSUB.cross) { emptynum++; }
                linenum += (b.line);
            };
            fourside(fn, crsline);
            //no deadend or branch
            if (emptynum === 1 || linenum === 2) {
                fourside(add_cross, crsline);
            }
            //extend deadend
            if (emptynum === 2 && linenum === 1) {
                fourside(add_line, crsline);
            }
            //empty turn with 1 or 3
            if (emptynum === 2 && linenum === 0) {
                let fn = function (c) { return c !== undefined && !c.isnull && c.qsub === 0; }
                if (fn(crsline.top) && fn(crsline.left) && crsline.top.sidecell[0].qnum === 3) { fourside(add_line, crsline); }
                if (fn(crsline.top) && fn(crsline.right) && crsline.top.sidecell[1].qnum === 3) { fourside(add_line, crsline); }
                if (fn(crsline.bottom) && fn(crsline.left) && crsline.bottom.sidecell[0].qnum === 3) { fourside(add_line, crsline); }
                if (fn(crsline.bottom) && fn(crsline.right) && crsline.bottom.sidecell[1].qnum === 3) { fourside(add_line, crsline); }

                if (fn(crsline.top) && fn(crsline.left) && crsline.top.sidecell[0].qnum === 1) { fourside(add_cross, crsline); }
                if (fn(crsline.top) && fn(crsline.right) && crsline.top.sidecell[1].qnum === 1) { fourside(add_cross, crsline); }
                if (fn(crsline.bottom) && fn(crsline.left) && crsline.bottom.sidecell[0].qnum === 1) { fourside(add_cross, crsline); }
                if (fn(crsline.bottom) && fn(crsline.right) && crsline.bottom.sidecell[1].qnum === 1) { fourside(add_cross, crsline); }
            }
            //2 degree turn or line enter
            {
                let fn = function (b1, b2, b3, b4, b5, b6, c34) {
                    if (c34.isnull) { return; }
                    //avoid 1*1 loop with 2 degree turn
                    if ((b1.isnull || b1.qsub === BQSUB.cross) && (b2.isnull || b2.qsub === BQSUB.cross) && b5.line && b6.line) {
                        add_cross(b3);
                        add_cross(b4);
                    }
                    //line enters 1
                    if (!b1.isnull && b1.line && (b2.isnull || b2.qsub === BQSUB.cross) && c34.qnum === 1) {
                        add_cross(b5);
                        add_cross(b6);
                    }
                    //2 degree turn with 2
                    if ((b1.isnull || b1.qsub === BQSUB.cross) && (b2.isnull || b2.qsub === BQSUB.cross) && (b5.qsub === BQSUB.cross || b6.qsub === BQSUB.cross) && c34.qnum === 2) {
                        add_line(b3);
                        add_line(b4);
                        add_cross(b5);
                        add_cross(b6);
                    }
                    if ((b1.isnull || b1.qsub === BQSUB.cross) && (b2.isnull || b2.qsub === BQSUB.cross) && (b5.line || b6.line) && c34.qnum === 2) {
                        add_cross(b3);
                        add_cross(b4);
                        add_line(b5);
                        add_line(b6);
                    }
                    //line enters 3
                    if (!b1.isnull && b1.line && c34.qnum === 3) {
                        add_cross(b2);
                        add_line(b5);
                        add_line(b6);
                    }
                    //line exit 1
                    if ((b2.isnull || b2.qsub === BQSUB.cross) && c34.qnum === 1 && b5.qsub === BQSUB.cross && b6.qsub === BQSUB.cross) {
                        add_line(b1);
                    }
                    //line exit 2
                    if ((b2.isnull || b2.qsub === BQSUB.cross) && c34.qnum === 2 && (b5.qsub === BQSUB.cross && b6.line || b6.qsub === BQSUB.cross && b5.line)) {
                        add_line(b1);
                    }
                    //line exit 3
                    if ((b2.isnull || b2.qsub === BQSUB.cross) && c34.qnum === 3 && b5.line && b6.line) {
                        add_line(b1);
                    }
                    //line should enter 1
                    if (b1.line && c34.qnum === 1 && b5.qsub === BQSUB.cross && b6.qsub === BQSUB.cross) {
                        add_cross(b2);
                    }
                    //line should enter 2
                    if (b1.line && c34.qnum === 2 && (b5.qsub === BQSUB.cross || b6.qsub === BQSUB.cross)) {
                        add_cross(b2);
                        add_line(b5);
                        add_line(b6);
                    }
                };
                if (!crsline.bottom.isnull) {
                    fn(crsline.top, crsline.left, crsline.bottom, crsline.right, crsline.bottom.sidecell[1].adjborder.bottom, crsline.bottom.sidecell[1].adjborder.right, crsline.bottom.sidecell[1]);
                    fn(crsline.left, crsline.top, crsline.bottom, crsline.right, crsline.bottom.sidecell[1].adjborder.bottom, crsline.bottom.sidecell[1].adjborder.right, crsline.bottom.sidecell[1]);
                    fn(crsline.top, crsline.right, crsline.bottom, crsline.left, crsline.bottom.sidecell[0].adjborder.bottom, crsline.bottom.sidecell[0].adjborder.left, crsline.bottom.sidecell[0]);
                    fn(crsline.right, crsline.top, crsline.bottom, crsline.left, crsline.bottom.sidecell[0].adjborder.bottom, crsline.bottom.sidecell[0].adjborder.left, crsline.bottom.sidecell[0]);
                }
                if (!crsline.top.isnull) {
                    fn(crsline.bottom, crsline.left, crsline.top, crsline.right, crsline.top.sidecell[1].adjborder.top, crsline.top.sidecell[1].adjborder.right, crsline.top.sidecell[1]);
                    fn(crsline.left, crsline.bottom, crsline.top, crsline.right, crsline.top.sidecell[1].adjborder.top, crsline.top.sidecell[1].adjborder.right, crsline.top.sidecell[1]);
                    fn(crsline.bottom, crsline.right, crsline.top, crsline.left, crsline.top.sidecell[0].adjborder.top, crsline.top.sidecell[0].adjborder.left, crsline.top.sidecell[0]);
                    fn(crsline.right, crsline.bottom, crsline.top, crsline.left, crsline.top.sidecell[0].adjborder.top, crsline.top.sidecell[0].adjborder.left, crsline.top.sidecell[0]);
                }
            }
        }
        //avoid forming multiple loop
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
        //deduce color
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            let adjcell = cell.adjacent;
            //same neighbor color
            {
                let fn = function (c, d) {
                    if (!c.isnull && cell.qsub !== CQSUB.none && cell.qsub === c.qsub) {
                        add_cross(d);
                    }
                    if (cell.qsub === CQSUB.yellow && c.isnull) {
                        add_cross(d);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //deduce neighbor color
            if (cell.qsub === CQSUB.none) {
                let fn = function (c, b) {
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
                };
                fourside2(fn, adjcell, adjline);
            }
            //checker pattern
            if (cell.qsub === CQSUB.none) {
                let fn = function (c, c1, c2, c12) {
                    if (c1.isnull || c2.isnull || c12.isnull) { return; }
                    if (c1.qsub === CQSUB.none || c2.qsub === CQSUB.none || c12.qsub === CQSUB.none) { return; }
                    if (c1.qsub === c2.qsub && c1.qsub !== c12.qsub) {
                        add_bg_color(c, c1.qsub);
                    }
                };
                for (let d = 0; d < 4; d++) {
                    fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
                }
            }
            {
                let innernum = 0;
                let outernum = 0;
                let fn = function (c) {
                    if (!c.isnull && c.qsub === CQSUB.green) { innernum++; }
                    if (c.isnull || c.qsub === CQSUB.yellow) { outernum++; }
                };
                fourside(fn, adjcell);
                //surrounded by green
                if (innernum === 4) {
                    add_bg_inner_color(cell);
                }
                //number and color deduce
                if (cell.qnum >= 0) {
                    if (cell.qnum < innernum || 4 - cell.qnum < outernum) {
                        add_bg_inner_color(cell);
                    }
                    if (cell.qnum < outernum || 4 - cell.qnum < innernum) {
                        add_bg_outer_color(cell);
                    }
                    if (cell.qsub === CQSUB.green && cell.qnum === outernum) {
                        fourside(add_bg_inner_color, adjcell);
                    }
                    if (cell.qsub === CQSUB.yellow && cell.qnum === innernum) {
                        fourside(add_bg_outer_color, adjcell);
                    }
                    if (cell.qsub === CQSUB.yellow && cell.qnum === 4 - outernum) {
                        fourside(add_bg_inner_color, adjcell);
                    }
                    if (cell.qsub === CQSUB.green && cell.qnum === 4 - innernum) {
                        fourside(add_bg_outer_color, adjcell);
                    }
                    if (cell.qnum === CQSUB.yellow && outernum === 2) {
                        fourside(add_bg_inner_color, adjcell);
                    }
                    if (cell.qnum === CQSUB.yellow && innernum === 2) {
                        fourside(add_bg_outer_color, adjcell);
                    }
                    //2 different color around 1 or 3
                    {
                        let fn = function (c, d) {
                            if (!c.isnull && c.qsub === CQSUB.none) {
                                if (cell.qnum === 1) { add_cross(d); }
                                if (cell.qnum === 3) { add_line(d); }
                            }
                        };
                        if ((cell.qnum === 1 || cell.qnum === 3) && innernum === 1 && outernum === 1) {
                            fourside2(fn, adjcell, adjline);
                        }
                    }
                    //same diagonal color as 3
                    if (cell.qnum === 3 && cell.qsub !== CQSUB.none) {
                        for (let d = 0; d < 4; d++) {
                            if (!dir(adjcell, d).isnull && !dir(adjcell, d + 1).isnull && dir(dir(adjcell, d).adjacent, d + 1).qsub === cell.qsub) {
                                add_line(dir(adjline, d + 2));
                                add_line(dir(adjline, d + 3));
                            }
                        }
                    }
                }
            }
        }
        ui.toolarea.outlineshaded();
    }

})();