let offset = function (c, dx, dy, dir = 0) {
    dir = (dir % 4 + 4) % 4;
    if (dir === 0) { return board.getobj(c.bx + dx * 2, c.by + dy * 2); }
    if (dir === 1) { return board.getobj(c.bx + dy * 2, c.by - dx * 2); }
    if (dir === 2) { return board.getobj(c.bx - dx * 2, c.by - dy * 2); }
    if (dir === 3) { return board.getobj(c.bx - dy * 2, c.by + dx * 2); }
}
let adjlist = function (a) {
    return [a.top, a.left, a.bottom, a.right];
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
    if (c === undefined || c.isnull || c.qnum !== CQNUM.none || c.qnums.length > 0 || c.qans !== CQANS.none || c.qsub === CQSUB.dot) { return; }
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