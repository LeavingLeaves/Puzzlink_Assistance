// ==UserScript==
// @name         Puzz.link Assistance
// @version      23.10.14
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const maxLoop = 30;
    let flg = true;
    let board;

    let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
    document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
    document.querySelector("#assist").addEventListener("click", assist, false);
    window.addEventListener("keypress", (event) => {
        if (event.key !== 'q') { return; }
        assist();
    });

    function assist() {
        flg = true;
        board = ui.puzzle.board;
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            if (/slither/.test(document.URL)) { SlitherlinkAssist(); }
            if (/yaji[lr]in/.test(document.URL)) { YajilinAssist(); }
            if (/simpleloop/.test(document.URL)) { SimpleloopAssist(); }
            if (/mas[yh]u/.test(document.URL)) { MasyuAssist(); }
            if (/lightup|akari/.test(document.URL)) { AkariAssist(); }
            if (/heyawake/.test(document.URL)) { HeyawakeAssist(); }
        }
        console.log('Assisted.');
    }
    let fourside = function (a, b) {
        a(b.top);
        a(b.bottom);
        a(b.left);
        a(b.right);
    };
    let fourside2 = function (a, b, c) {
        a(b.top, c.top);
        a(b.bottom, c.bottom);
        a(b.left, c.left);
        a(b.right, c.right);
    };
    let add_cross = function (d) {
        if (d === undefined || d.isnull || d.line === 1 || d.qsub === 2) { return; }
        flg = 1;
        d.setQsub(2);
        d.draw();
    };
    let add_line = function (d) {
        if (d === undefined || d.isnull || d.qsub === 2 || d.line === 1) { return; }
        flg = 1;
        d.setLine(1);
        d.draw();
    };
    let add_block = function (c) {
        if (c === undefined || c.isnull || c.qnum !== -1 || c.lcnt !== 0 || c.qsub === 1 || c.qans === 1) { return; }
        flg = 1;
        c.setQans(1);
        c.draw();
    };
    let add_light = add_block;
    let add_block2 = function (c) {
        if (c === undefined || c.isnull || c.lcnt !== 0 || c.qsub === 1 || c.qans === 1) { return; }
        flg = 1;
        c.setQans(1);
        c.draw();
    };
    let add_dot = function (c) {
        if (c === undefined || c.isnull || c.qnum !== -1 || c.qans !== 0 || c.qsub === 1) { return; }
        flg = 1;
        c.setQsub(1);
        c.draw();
    };
    let add_green = function (c) {
        if (c === undefined || c.isnull || c.qans !== 0 || c.qsub === 1) { return; }
        flg = 1;
        c.setQsub(1);
        c.draw();
    };
    let add_bg_color = function (c, color) {
        if (c === undefined || c.isnull || c.qsub !== 0 || c.qsub === color) { return; }
        flg = 1;
        c.setQsub(color);
        c.draw();
    }
    let add_bg_inner_color = function (c) {
        add_bg_color(c, 1);
    }
    let add_bg_outer_color = function (c) {
        add_bg_color(c, 2);
    }

    let dir = function (c, ndir) {
        ndir = (ndir % 4 + 4) % 4;
        if (ndir === 1) return c.top;
        if (ndir === 2) return c.right;
        if (ndir === 3) return c.bottom;
        if (ndir === 0) return c.left;
    }

    let SingleLoopInCell = function (inPath) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            let fn = function (c, d) {
                if (!c.isnull && d.qsub !== 2) { emptynum++; }
                linenum += d.line === 1;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum === 1) {
                fourside(add_cross, adjline);
            }
            //2 degree path
            if (emptynum === 2 && (linenum === 1 || cell.qsub === 1 || inPath)) {
                fourside(add_line, adjline);
            }
        }
        //avoid forming multiple loop
        for (let i = 0; i < board.border.length; i++) {
            let border = board.border[i];
            if (border.qsub !== 0) { continue; }
            if (border.line !== 0) { continue; }
            let cr1 = border.sidecell[0];
            let cr2 = border.sidecell[1];
            if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                add_cross(border);
            }
        }
    };

    function HeyawakeAssist() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let blocknum = 0;
            //green around block
            if (cell.qans === 1) {
                fourside(add_green, adjcell);
                continue;
            }
            let fn = function (c) {
                blocknum += c.isnull || c.qans === 1;
            };
            fourside(fn, adjcell);
            //green escape
            if (cell.qans !== 1 && blocknum === 3) {
                fourside(add_green, adjcell);
            }
            //no two facing doors
            for (let d = 0; d < 4; d++) {
                if (cell.qsub !== 1) { break; }
                let pcell = dir(cell.adjacent, d);
                let bordernum = 0;
                let emptynum = 0;
                let emptycell = pcell;
                while (!pcell.isnull && pcell.qans !== 1 && emptynum <= 1 && bordernum < 2) {
                    if (pcell.qsub !== 1) {
                        emptynum++;
                        emptycell = pcell;
                    }
                    if (dir(pcell.adjborder, d + 2).ques === 1) {
                        bordernum++;
                    }
                    pcell = dir(pcell.adjacent, d);
                }
                if (bordernum === 2 && emptynum === 1) {
                    add_block2(emptycell);
                }
            }
        }
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            if (room.top.qnum === -1) { continue; }
            let blocknum = 0;
            let emptynum = 0;
            for (let j = 0; j < room.clist.length; j++) {
                blocknum += room.clist[j].qans === 1;
                emptynum += room.clist[j].qans !== 1 && room.clist[j].qsub !== 1;
            }
            if (blocknum === room.top.qnum) {
                for (let j = 0; j < room.clist.length; j++) {
                    add_green(room.clist[j]);
                }
            }
            if (blocknum + emptynum === room.top.qnum) {
                for (let j = 0; j < room.clist.length; j++) {
                    add_block2(room.clist[j]);
                }
            }
        }
    }

    function AkariAssist() {
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0 && c.qsub === 0; };
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let emptynum = 0;
            let lightnum = 0;
            //add dot where lighted
            if (cell.qlight === 1 && cell.qans !== 1) {
                add_dot(cell);
            }
            //only one place can light
            if (cell.qnum === -1 && cell.qlight === 0) {
                let emptynum = (cell.qsub === 0 ? 1 : 0);
                let emptycell = cell;
                for (let d = 0; d < 4; d++) {
                    let pcell = dir(cell.adjacent, d);
                    while (!pcell.isnull && pcell.qnum === -1) {
                        if (pcell.qsub === 0) {
                            emptynum++;
                            emptycell = pcell;
                        }
                        pcell = dir(pcell.adjacent, d);
                    }
                }
                if (emptynum === 1) {
                    add_light(emptycell);
                }
            }
            let fn = function (c) {
                if (!c.isnull && c.qnum === -1 && c.qsub === 0 && c.qans !== 1) { emptynum++; }
                lightnum += (c.qans === 1);
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
                        if (isEmpty(dir(adjcell, d)) && isEmpty(dir(adjcell, d + 1)) && isEmpty(dir(dir(adjcell, d).adjacent, d + 1))) {
                            add_dot(dir(dir(adjcell, d).adjacent, d + 1));
                        }
                    }
                }
            }
        }
    }

    function MasyuAssist() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            {
                for (let d = 0; d < 4; d++) {
                    if (dir(adjcell, d + 1).qnum === 2 && dir(adjcell, d + 3).qnum === 2 && (dir(adjline, d + 2).isnull || dir(adjline, d + 2).qsub === 2)) {
                        add_cross(dir(adjline, d));
                    }
                }
            }
            if (cell.qnum === 1) {//white
                for (let d = 0; d < 4; d++) {
                    //go straight
                    if (dir(adjline, d).line === 1 || dir(adjline, d + 1).qsub === 2 || dir(adjline, d + 1).isnull) {
                        add_line(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                        add_cross(dir(adjline, d + 1));
                        add_cross(dir(adjline, d + 3));
                    }
                    //turn at one side
                    if (dir(adjline, d).line === 1 && dir(dir(adjcell, d).adjborder, d).line === 1) {
                        add_cross(dir(dir(adjcell, d + 2).adjborder, d + 2));
                    }
                    //no turn on both side
                    if ((!dir(adjcell, d).isnull && (dir(dir(adjcell, d).adjborder, d).line === 1 ||
                        dir(dir(adjcell, d).adjborder, d + 1).qsub === 2 && dir(dir(adjcell, d).adjborder, d + 3).qsub === 2
                    ) || dir(adjcell, d).qnum === 1) &&
                        (!dir(adjcell, d + 2).isnull && (dir(dir(adjcell, d + 2).adjborder, d + 2).line === 1 ||
                            dir(dir(adjcell, d + 2).adjborder, d + 1).qsub === 2 && dir(dir(adjcell, d + 2).adjborder, d + 3).qsub === 2
                        ) || dir(adjcell, d + 2).qnum === 1)) {
                        add_line(dir(adjline, d + 1));
                        add_line(dir(adjline, d + 3));
                        add_cross(dir(adjline, d));
                        add_cross(dir(adjline, d + 2));
                    }
                }
            }
            if (cell.qnum === 2) {//black
                for (let d = 0; d < 4; d++) {
                    //can't go straight this way
                    if (dir(adjcell, d).isnull || dir(adjline, d).qsub === 2 ||
                        dir(dir(adjcell, d).adjacent, d).isnull || dir(dir(adjcell, d).adjborder, d).qsub === 2 ||
                        dir(adjcell, d).qnum === 2 || dir(adjline, d + 2).line === 1) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //going straight this way will branch
                    if (dir(adjcell, d).isnull || dir(dir(adjcell, d).adjborder, d + 1).line === 1 ||
                        dir(dir(adjcell, d).adjborder, d + 3).line === 1) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //go straight
                    if (dir(adjline, d).line === 1) {
                        add_line(dir(dir(adjcell, d).adjborder, d));
                    }
                }
            }
        }
        SingleLoopInCell(0);
    }

    function SimpleloopAssist() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            if (cell.ques === 7) {//7 for black block
                fourside(add_cross, adjline);
            }
        }
        SingleLoopInCell(1);
    }

    function YajilinAssist() {
        let isPathable = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0; };
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0 && c.qsub === 0 && c.lcnt === 0; };
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            //check clue
            if (cell.qnum !== -1 && cell.qdir !== 0) {
                let d = [-1, 1, 3, 0, 2][cell.qdir];
                let emptynum = 0;
                let blocknum = 0;
                let lastcell = cell;
                let pcell = dir(cell.adjacent, d);
                let emptycellList = [];
                let addcellList = [];
                while (!pcell.isnull && pcell.qdir !== cell.qdir) {
                    if (isEmpty(pcell)) {
                        emptynum++;
                        emptycellList.push(pcell);
                    }
                    blocknum += pcell.qans === 1;
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
                    addcellList.forEach(cell => { add_block(cell); });
                }
                //finished clue
                if (blocknum === cell.qnum) {
                    emptycellList.forEach(cell => { add_dot(cell); });
                }
            }
            //add cross
            if (cell.qnum !== -1) {
                fourside(add_cross, adjline);
                continue;
            }
            //add dot around block
            if (cell.qans === 1) {
                fourside(add_cross, adjline);
                fourside(add_dot, adjcell);
                continue;
            }
            let fn = function (c, d) {
                if (isPathable(c) && d.qsub !== 2) { emptynum++; }
                linenum += d.line === 1;
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
                let fn = function (c, d) {
                    if (!isPathable(c) || d.qsub === 2) { return; }
                    add_dot(c);
                };
                fourside2(fn, adjcell, adjline);
            }
        }
        SingleLoopInCell(0);
    }

    function SlitherlinkAssist() {
        // deduce cell
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            let emptynum = 0;
            let linenum = 0;
            //add cross for 0
            if (cell.qnum === 0) {
                fourside(add_cross, adjline);
            }
            let fn = function (d) {
                if (d.qsub === 0) { emptynum++; }
                linenum += (d.line === 1);
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
            if (cell.qnum === 3 && cell.adjacent.bottom !== undefined && cell.adjacent.bottom.qnum === 3) {
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.bottom);
                add_line(cell.adjacent.bottom.adjborder.bottom);
                if (cell.adjacent.left !== undefined) { add_cross(cell.adjacent.left.adjborder.bottom); }
                if (cell.adjacent.right !== undefined) { add_cross(cell.adjacent.right.adjborder.bottom); }
            }
            // horizontal 3s
            if (cell.qnum === 3 && cell.adjacent.right !== undefined && cell.adjacent.right.qnum === 3) {
                add_line(cell.adjborder.left);
                add_line(cell.adjborder.right);
                add_line(cell.adjacent.right.adjborder.right);
                if (cell.adjacent.top !== undefined) { add_cross(cell.adjacent.top.adjborder.right); }
                if (cell.adjacent.bottom !== undefined) { add_cross(cell.adjacent.bottom.adjborder.right); }
            }
            //sub diagonal 3s
            if (cell.qnum === 3 && cell.adjacent.bottom !== undefined && cell.adjacent.bottom.adjacent.left !== undefined && cell.adjacent.bottom.adjacent.left.qnum === 3) {
                let cell2 = cell.adjacent.bottom.adjacent.left;
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.right);
                add_line(cell2.adjborder.bottom);
                add_line(cell2.adjborder.left);
            }
            //main diagonal 3s
            if (cell.qnum === 3 && cell.adjacent.bottom !== undefined && cell.adjacent.bottom.adjacent.right !== undefined && cell.adjacent.bottom.adjacent.right.qnum === 3) {
                let cell2 = cell.adjacent.bottom.adjacent.right;
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
            let fn = function (d) {
                if (d !== undefined && !d.isnull && d.qsub === 0) { emptynum++; }
                linenum += (d.line === 1);
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
                let fn = function (c1, c2, c3, c4, c5, c6, c34) {
                    if (c34.isnull) { return; }
                    //avoid 1*1 loop with 2 degree turn
                    if ((c1.isnull || c1.qsub === 2) && (c2.isnull || c2.qsub === 2) && c5.line === 1 && c6.line === 1) {
                        add_cross(c3);
                        add_cross(c4);
                    }
                    //line enters 1
                    if (!c1.isnull && c1.line === 1 && (c2.isnull || c2.qsub === 2) && c34.qnum === 1) {
                        add_cross(c5);
                        add_cross(c6);
                    }
                    //2 degree turn with 2
                    if ((c1.isnull || c1.qsub === 2) && (c2.isnull || c2.qsub === 2) && (c5.qsub === 2 || c6.qsub === 2) && c34.qnum === 2) {
                        add_line(c3);
                        add_line(c4);
                        add_cross(c5);
                        add_cross(c6);
                    }
                    //line enters 3
                    if (!c1.isnull && c1.line === 1 && c34.qnum === 3) {
                        add_cross(c2);
                        add_line(c5);
                        add_line(c6);
                    }
                    //line exit 1
                    if ((c2.isnull || c2.qsub === 2) && c34.qnum === 1 && c5.qsub === 2 && c6.qsub === 2) {
                        add_line(c1);
                    }
                    //line exit 2
                    if ((c2.isnull || c2.qsub === 2) && c34.qnum === 2 && (c5.qsub === 2 && c6.line === 1 || c6.qsub === 2 && c5.line === 1)) {
                        add_line(c1);
                    }
                    //line exit 3
                    if ((c2.isnull || c2.qsub === 2) && c34.qnum === 3 && c5.line === 1 && c6.line === 1) {
                        add_line(c1);
                    }
                    //line should enter 1
                    if (c1.line === 1 && c34.qnum === 1 && c5.qsub === 2 && c6.qsub === 2) {
                        add_cross(c2);
                    }
                    //line should enter 2
                    if (c1.line === 1 && c34.qnum === 2 && (c5.qsub === 2 || c6.qsub === 2)) {
                        add_cross(c2);
                        add_line(c5);
                        add_line(c6);
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
            if (border.qsub !== 0) { continue; }
            if (border.line !== 0) { continue; }
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
                    if (!c.isnull && cell.qsub !== 0 && cell.qsub === c.qsub) {
                        add_cross(d);
                    }
                    if (cell.qsub === 2 && c.isnull) {
                        add_cross(d);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //deduce neighbor color
            {
                let fn = function (cn, dn) {
                    if (dn.line === 1 && cn.isnull) {
                        add_bg_inner_color(cell);
                    }
                    if (dn.qsub === 2 && cn.isnull) {
                        add_bg_outer_color(cell);
                    }
                    if (dn.line === 1 && !cn.isnull && cn.qsub !== 0) {
                        add_bg_color(cell, 3 - cn.qsub);
                    }
                    if (dn.qsub === 2 && !cn.isnull && cn.qsub !== 0) {
                        add_bg_color(cell, cn.qsub);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //number and color deduce
            {
                let innernum = 0;
                let outernum = 0;
                let fn = function (c) {
                    if (!c.isnull && c.qsub === 1) { innernum++; }
                    if (c.isnull || c.qsub === 2) { outernum++; }
                };
                fourside(fn, adjcell);
                if (innernum === 4) {
                    add_bg_inner_color(cell);
                }
                if (outernum === 4) {
                    add_bg_outer_color(cell);
                }
                if (cell.qnum < 0) {
                    continue;
                }
                if (cell.qnum < innernum || 4 - cell.qnum < outernum) {
                    add_bg_inner_color(cell);
                }
                if (cell.qnum < outernum || 4 - cell.qnum < innernum) {
                    add_bg_outer_color(cell);
                }
                if (cell.qsub === 1 && cell.qnum === outernum) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === 2 && cell.qnum === innernum) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qsub === 2 && cell.qnum === 4 - outernum) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === 1 && cell.qnum === 4 - innernum) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qnum === 2 && outernum === 2) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qnum === 2 && innernum === 2) {
                    fourside(add_bg_outer_color, adjcell);
                }
                //2 different color around 1 or 3
                {
                    let fn = function (c, d) {
                        if (!c.isnull && c.qsub === 0) {
                            if (cell.qnum === 1) { add_cross(d); }
                            if (cell.qnum === 3) { add_line(d); }
                        }
                    };
                    if ((cell.qnum === 1 || cell.qnum === 3) && innernum === 1 && outernum === 1) {
                        fourside2(fn, adjcell, adjline);
                    }
                }
            }
            //checker pattern
            {
                let fn = function (c, c1, c2, c12) {
                    if (c1.isnull || c2.isnull || c12.isnull) { return; }
                    if (c1.qsub === 0 || c2.qsub === 0 || c12.qsub === 0) { return; }
                    if (c1.qsub === c2.qsub && c1.qsub !== c12.qsub) {
                        add_bg_color(c, c1.qsub);
                    }
                };
                fn(cell, adjcell.top, adjcell.left, adjcell.top.adjacent.left);
                fn(cell, adjcell.top, adjcell.right, adjcell.top.adjacent.right);
                fn(cell, adjcell.bottom, adjcell.left, adjcell.bottom.adjacent.left);
                fn(cell, adjcell.bottom, adjcell.right, adjcell.bottom.adjacent.right);
            }
        }
    }

})();