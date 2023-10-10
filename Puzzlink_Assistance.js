// ==UserScript==
// @name         Puzz.link Assistance
// @version      1.0
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p?*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const maxLoop = 20;

    let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
    document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
    document.querySelector("#assist").addEventListener("click", assist, false);
    window.addEventListener("keypress", (event) => {
        if (event.key !== 'q') { return; }
        assist();
    });

    function assist() {
        if (/slither/.test(document.URL)) { SlitherlinkAssist(); }
        if (/yaji[lr]in/.test(document.URL)) { YajilinAssist(); }
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

    function YajilinAssist() {
        let board = ui.puzzle.board;
        let cell = board.cell;
        let flg = true;
        let isEmpty = function (c) { return c.id !== null && c.qnum === -1 && c.qans === 0; };
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            for (let i = 0; i < cell.length; i++) {
                if (cell[i].qnum !== -1 && cell[i].qdir !== 0) {
                    let qnum = cell[i].qnum;
                    let qdir = cell[i].qdir;
                    let dirs = [[],[-1, 0], [1, 0], [0, -1], [0, 1]];//Top Bottom Left Right
                    let rows = board.rows, cols = board.cols;
                    let x = Math.floor(i / cols);
                    let y = i % cols;
                    let emptynum = 0;
                    let blocknum = 0;
                    while (x >= 0 && y >= 0 && x < rows && y < cols) {
                        emptynum += isEmpty(cell[x * cols + y]) && cell[x * cols + y].qsub!==1;
                        blocknum += cell[x * cols + y].qans === 1;
                        x += dirs[qdir][0];
                        y += dirs[qdir][1];
                    }
                    if (emptynum + blocknum === qnum) {
                        x = Math.floor(i / cols);
                        y = i % cols;
                        while (x >= 0 && y >= 0 && x < rows && y < cols) {
                            if (isEmpty(cell[x * cols + y]) && cell[x * cols + y].qsub!==1) {
                                flg = 1;
                                cell[x * cols + y].setQans(1);
                                cell[x * cols + y].draw();
                            }
                            x += dirs[qdir][0];
                            y += dirs[qdir][1];
                        }
                    }
                    if (blocknum === qnum){
                        x = Math.floor(i / cols);
                        y = i % cols;
                        while (x >= 0 && y >= 0 && x < rows && y < cols) {
                            if (isEmpty(cell[x * cols + y]) && cell[x * cols + y].qsub!==1) {
                                flg = 1;
                                cell[x * cols + y].setQsub(1);
                                cell[x * cols + y].draw();
                            }
                            x += dirs[qdir][0];
                            y += dirs[qdir][1];
                        }
                    }
                }
                if (cell[i].qnum !== -1) {
                    continue;
                }
                let emptynum = 0;
                let linenum = 0;
                let adj = cell[i].adjacent;
                let adb = cell[i].adjborder;
                if (cell[i].qans === 1) {
                    let fn = function (c) {
                        if (!isEmpty(c)) { return; }
                        flg |= (c.qsub !== 1);
                        c.setQsub(1);
                        c.draw();
                    };
                    fourside(fn, adj);
                    continue;
                }
                let fn = function (c, d) {
                    if (isEmpty(c) && d.qsub !== 2) { emptynum++; }
                    linenum += d.line == 1;
                };
                fourside2(fn, adj, adb);
                if (linenum === 2) {
                    let fn = function (d) {
                        if (d.line !== 1) {
                            flg |= d.qsub != 2;
                            d.setQsub(2);
                            d.draw();
                        }
                    }
                    fourside(fn, adb);
                }
                if (emptynum === 1) {
                    flg |= cell[i].qans !== 1;
                    cell[i].setQans(1);
                    cell[i].draw();
                }
                if (emptynum === 2) {
                    if (cell[i].qsub === 1 || linenum === 1) {
                        let fn = function (c, d) {
                            if (!isEmpty(c) || d.qsub === 2) { return; }
                            flg |= (c.qsub !== 1) | (d.line !== 1);
                            c.setQsub(1);
                            d.setLine(1);
                            c.draw();
                            d.draw();
                        };
                        fourside2(fn, adj, adb);
                    } else {
                        let fn = function (c, d) {
                            if (!isEmpty(c) || d.qsub === 2) { return; }
                            flg |= (c.qsub !== 1);
                            c.setQsub(1);
                            c.draw();
                        };
                        fourside2(fn, adj, adb);
                    }
                }
            }
        }
    }

    function SlitherlinkAssist() {
        let board = ui.puzzle.board;
        let cell = board.cell;
        let cross = board.cross;
        let flg = true;
        let addline = function (c) {
            if (c === undefined || c.id === null || c.qsub === 2) { return; }
            flg |= (c.line !== 1);
            c.setLine();
            c.draw();
        };
        let addcross = function (c) {
            if (c === undefined || c.id === null || c.line === 1) { return; }
            flg |= (c.qsub !== 2);
            c.setQsub(2);
            c.draw();
        };
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            for (let i = 0; i < cell.length; i++) {
                let adj = cell[i].adjborder;
                let emptynum = 0;
                let linenum = 0;
                if (cell[i].qnum === 0) {
                    fourside(addcross, adj);
                }
                let fn = function (c) {
                    if (c.qsub === 0) { emptynum++; }
                    linenum += (c.line == 1);
                };
                fourside(fn, adj);
                if (emptynum === cell[i].qnum) {
                    fourside(addline, adj);
                }
                if (linenum === cell[i].qnum) {
                    fourside(addcross, adj);
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.qnum === 3) {
                    addline(cell[i].adjborder.top);
                    addline(cell[i].adjborder.bottom);
                    addline(cell[i].adjacent.bottom.adjborder.bottom);
                    if (cell[i].adjacent.left !== undefined) { addcross(cell[i].adjacent.left.adjborder.bottom); }
                    if (cell[i].adjacent.right !== undefined) { addcross(cell[i].adjacent.right.adjborder.bottom); }
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.right !== undefined && cell[i].adjacent.right.qnum === 3) {
                    addline(cell[i].adjborder.left);
                    addline(cell[i].adjborder.right);
                    addline(cell[i].adjacent.right.adjborder.right);
                    if (cell[i].adjacent.top !== undefined) { addcross(cell[i].adjacent.top.adjborder.right); }
                    if (cell[i].adjacent.bottom !== undefined) { addcross(cell[i].adjacent.bottom.adjborder.right); }
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.adjacent.left !== undefined && cell[i].adjacent.bottom.adjacent.left.qnum === 3) {
                    let cell2 = cell[i].adjacent.bottom.adjacent.left;
                    addline(cell[i].adjborder.top);
                    addline(cell[i].adjborder.right);
                    addline(cell2.adjborder.bottom);
                    addline(cell2.adjborder.left);
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.adjacent.right !== undefined && cell[i].adjacent.bottom.adjacent.right.qnum === 3) {
                    let cell2 = cell[i].adjacent.bottom.adjacent.right;
                    addline(cell[i].adjborder.top);
                    addline(cell[i].adjborder.left);
                    addline(cell2.adjborder.bottom);
                    addline(cell2.adjborder.right);
                }
            }

            for (let i = 0; i < cross.length; i++) {
                let adj = cross[i].adjborder;
                let emptynum = 0;
                let linenum = 0;
                let fn = function (c) {
                    if (c !== undefined && c.id !== null && c.qsub === 0) { emptynum++; }
                    linenum += (c.line == 1);
                };
                fourside(fn, adj);
                if (emptynum === 1 || linenum === 2) {
                    fourside(addcross, adj);
                }
                if (emptynum === 2 && linenum === 1) {
                    fourside(addline, adj);
                }
                if (emptynum === 2 && linenum === 0) {
                    let fn = function (c) { return c !== undefined && c.id !== null && c.qsub === 0; }
                    if (fn(adj.top) && fn(adj.left) && adj.top.sidecell[0].qnum === 3) { fourside(addline, adj); }
                    if (fn(adj.top) && fn(adj.right) && adj.top.sidecell[1].qnum === 3) { fourside(addline, adj); }
                    if (fn(adj.bottom) && fn(adj.left) && adj.bottom.sidecell[0].qnum === 3) { fourside(addline, adj); }
                    if (fn(adj.bottom) && fn(adj.right) && adj.bottom.sidecell[1].qnum === 3) { fourside(addline, adj); }

                    if (fn(adj.top) && fn(adj.left) && adj.top.sidecell[0].qnum === 1) { fourside(addcross, adj); }
                    if (fn(adj.top) && fn(adj.right) && adj.top.sidecell[1].qnum === 1) { fourside(addcross, adj); }
                    if (fn(adj.bottom) && fn(adj.left) && adj.bottom.sidecell[0].qnum === 1) { fourside(addcross, adj); }
                    if (fn(adj.bottom) && fn(adj.right) && adj.bottom.sidecell[1].qnum === 1) { fourside(addcross, adj); }
                }
            }
        }
    }

})();