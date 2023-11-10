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
        isShaded: c => c.qans === CQANS.black,
        add_unshaded: add_green,
    });
}

function No2x2Green() {
    No2x2Cell({
        isShaded: c => c.qsub === CQSUB.green,
        add_unshaded: add_black,
    });
}

function CellConnected({ isShaded, isUnshaded, add_shaded, add_unshaded,
    isLinked = (c, nb, nc) => isShaded(c) && isShaded(nc),
    isNotPassable = (c, nb, nc) => false,
    OutsideAsShaded = false } = {}) {
    // use tarjan to find cut vertex
    // Maximum call stack size exceeded sometimes for big puzzle
    let n = 0;
    let ord = new Map();
    let low = new Map();
    let shdn = new Map();
    let shadelist = [];
    let dfs = function (c, f = null) {
        if (!c.isnull && isUnshaded(c) || ord.has(c)) { return; }
        if (c.isnull && !OutsideAsShaded) { return; }
        ord.set(c, n);
        low.set(n, n);
        shdn.set(n, 0);
        n++;
        const cellset = new Set();
        if (!c.isnull) {
            let linkdfs = function (c) {
                if (c.isnull || cellset.has(c)) { return; }
                cellset.add(c);
                fourside((nb, nc) => {
                    if (isLinked(c, nb, nc)) {
                        linkdfs(nc);
                    }
                }, c.adjborder, c.adjacent);
            }
            linkdfs(c);
            cellset.forEach(cl => {
                ord.set(cl, ord.get(c));
                shdn.set(ord.get(cl), shdn.get(ord.get(cl)) + isShaded(cl));
            });
        }
        let fn = function (nc, nb) {
            if (isNotPassable(c, nb, nc)) { return; }
            if (nc === f || isUnshaded(nc)) { return; }
            if (nc.isnull && !OutsideAsShaded) { return; }
            if (ord.get(c) === ord.get(nc)) { return; }
            if (ord.has(nc)) {
                low.set(ord.get(c), Math.min(low.get(ord.get(c)), ord.get(nc)));
                return;
            }
            dfs(nc, c);
            let ordc = ord.get(c);
            let ordnc = ord.get(nc);
            low.set(ordc, Math.min(low.get(ordc), low.get(ordnc)));
            shdn.set(ordc, shdn.get(ordc) + shdn.get(ordnc));
            if (ordc <= low.get(ordnc) && shdn.get(ordnc) > 0) {
                cellset.forEach(c => shadelist.push(c));
            }
        };
        if (!c.isnull) {
            for (let c of cellset) {
                // expand Fourside to avoid Maximum call stack size exceeded
                fn(c.adjacent.top, c.adjborder.top);
                fn(c.adjacent.bottom, c.adjborder.bottom);
                fn(c.adjacent.left, c.adjborder.left);
                fn(c.adjacent.right, c.adjborder.right);
            };
        } else if (c.isnull) {
            for (let i = 0; i < board.cols; i++) {
                dfs(board.getc(2 * i + 1, board.minby + 1), c);
                dfs(board.getc(2 * i + 1, board.maxby - 1), c);
            }
            for (let i = 0; i < board.rows; i++) {
                dfs(board.getc(board.minbx + 1, 2 * i + 1), c);
                dfs(board.getc(board.maxbx - 1, 2 * i + 1), c);
            }
        }
    };
    if (OutsideAsShaded) {
        dfs(board.getc(0, 0));
    } else {
        for (let i = 0; i < board.cell.length; i++) {
            if (!isShaded(board.cell[i]) || ord.has(board.cell[i])) { continue; }
            dfs(board.cell[i]);
        }
    }
    shadelist.forEach(c => add_shaded(c));
    if (ord.size > 0) {
        for (let i = 0; i < board.cell.length; i++) {
            if (ord.has(board.cell[i]) || isShaded(board.cell[i]) || isUnshaded(board.cell[i])) { continue; }
            add_unshaded(board.cell[i]);
        }
    }
}

function GreenConnected() {
    CellConnected({
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qans === CQANS.black,
        add_shaded: add_green,
        add_unshaded: add_black,
    });
}

function BlackConnected() {
    CellConnected({
        isShaded: c => c.qans === CQANS.black,
        isUnshaded: c => c.qsub === CQSUB.green,
        add_shaded: add_black,
        add_unshaded: add_green,
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
        isShaded: c => c.qsub === CQSUB.green,
        isUnshaded: c => c.qans === CQANS.black,
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
            if (!isPathable(b)) { add_notpath(b); }
            if (!c.isnull && isPassable(c) && isPathable(b)) { emptycnt++; }
            linecnt += isPath(b);
        }, adjcell, adjline);
        if (linecnt > 0) {
            add_pass(cell);
        }
        // no branch
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
        if (linecnt === 0) {
            let list = [];
            fourside((c, b) => {
                if (isPathable(b)) { list.push([c, b]); }
            }, adjcell, adjline);
            if (list.length === 3) {
                let fn = function (a, b, c) {
                    if (a[0].path !== null && a[0].path === b[0].path) {
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

function SizeRegion({ isShaded, isUnshaded, add_shaded, add_unshaded, OneNumPerRegion = true, NoUnshadedNum = true } = {}) {
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
                    if (c.isnull || isUnshaded(c) || c === cell || cellList.indexOf(c) !== -1) { return; }
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
                if (c.isnull || !isShaded(c) || cellList.indexOf(c) !== -1) { return; }
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
                if (c.isnull || isUnshaded(c) || cellList.indexOf(c) !== -1) { return; }
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
                    if (c.isnull || !isShaded(c) || list.indexOf(c) !== -1) { return; }
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
                if (c.isnull || !isShaded(c) || cellList.indexOf(c) !== -1) { return; }
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

function SightNumber({ isShaded, isUnshaded, add_shaded, add_unshaded } = {}) {
    for (let i = 0; i < board.cell.length; i++) {
        let cell = board.cell[i];
        let qnum = cell.qnum;
        if (cell.qnum !== CQNUM.none) {
            add_shaded(cell);
        }
        if (cell.qnum !== CQNUM.none && cell.qnum !== CQNUM.quesmark) {
            let seencnt = (isShaded(cell) ? 1 : 0);
            let farthest = [0, 0, 0, 0];
            // count seen green cells
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
            let maxn = farthest.reduce((a, b) => a + b) + (isShaded(cell) ? 1 : 0);
            for (let d = 0; d < 4; d++) {
                for (let j = 1; j <= qnum - maxn + farthest[d]; j++) {
                    add_green(offset(cell, 0, -j, d));
                }
            }
        }
    }
}

function NoChecker({ isShaded, isUnshaded, add_shaded, add_unshaded } = {}) {
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
